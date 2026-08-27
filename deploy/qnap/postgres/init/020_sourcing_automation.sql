CREATE TABLE IF NOT EXISTS sourcing_rules (
  id uuid PRIMARY KEY,
  revision integer NOT NULL CHECK (revision >= 1),
  rule_json jsonb NOT NULL,
  created_by text NOT NULL,
  updated_by text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS sourcing_rule_audit_events (
  id uuid PRIMARY KEY,
  rule_id uuid NOT NULL REFERENCES sourcing_rules(id) ON DELETE RESTRICT,
  revision integer NOT NULL CHECK (revision >= 1),
  actor_id text NOT NULL,
  actor_email text NOT NULL,
  action text NOT NULL CHECK (action IN ('CREATED', 'UPDATED')),
  old_value_json jsonb NOT NULL,
  new_value_json jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (rule_id, revision)
);

CREATE TABLE IF NOT EXISTS sourcing_commands (
  id uuid PRIMARY KEY,
  idempotency_key uuid NOT NULL UNIQUE,
  action text NOT NULL CHECK (action IN ('run_now', 'pause', 'resume')),
  rule_id uuid REFERENCES sourcing_rules(id) ON DELETE RESTRICT,
  rule_snapshot_json jsonb,
  status text NOT NULL CHECK (status IN ('QUEUED', 'CLAIMED', 'COMPLETED', 'FAILED')),
  actor_id text NOT NULL,
  actor_email text NOT NULL,
  worker_id text,
  safe_error_code text,
  created_at timestamptz NOT NULL,
  claimed_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS sourcing_runtime_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  hermes_state text NOT NULL CHECK (hermes_state IN ('not_configured', 'ready', 'running', 'paused', 'login_required', 'error')),
  browser_profile_state text NOT NULL CHECK (browser_profile_state IN ('not_configured', 'ready', 'paused', 'login_required', 'error')),
  processed_today integer NOT NULL CHECK (processed_today >= 0),
  processed_date date,
  last_run_at timestamptz,
  last_heartbeat_at timestamptz,
  message text NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS sourcing_command_events (
  id uuid PRIMARY KEY,
  command_id uuid NOT NULL REFERENCES sourcing_commands(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN ('QUEUED', 'CLAIMED', 'HEARTBEAT', 'COMPLETED', 'FAILED')),
  actor_id text NOT NULL,
  safe_detail_json jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

INSERT INTO sourcing_runtime_state (singleton, hermes_state, browser_profile_state, processed_today, message, updated_at)
VALUES (true, 'not_configured', 'not_configured', 0, 'Hermes worker has not connected yet.', now())
ON CONFLICT (singleton) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_sourcing_commands_status_created ON sourcing_commands (status, created_at);
CREATE INDEX IF NOT EXISTS idx_sourcing_audit_rule_created ON sourcing_rule_audit_events (rule_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sourcing_command_events_command_created ON sourcing_command_events (command_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON sourcing_rules TO nk_cars_app;
GRANT SELECT, INSERT ON sourcing_rule_audit_events TO nk_cars_app;
GRANT SELECT, INSERT, UPDATE ON sourcing_commands TO nk_cars_app;
GRANT SELECT, UPDATE ON sourcing_runtime_state TO nk_cars_app;
GRANT SELECT, INSERT ON sourcing_command_events TO nk_cars_app;

REVOKE DELETE ON sourcing_rules, sourcing_rule_audit_events, sourcing_commands, sourcing_runtime_state, sourcing_command_events FROM nk_cars_app;
