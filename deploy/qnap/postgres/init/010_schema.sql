REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE nk_cars FROM PUBLIC;

CREATE TABLE IF NOT EXISTS buying_browser_workspaces (
  user_id text PRIMARY KEY,
  email text NOT NULL,
  display_name text NOT NULL,
  state_json jsonb NOT NULL,
  revision integer NOT NULL CHECK (revision >= 1),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS buying_browser_workspace_events (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES buying_browser_workspaces(user_id) ON DELETE RESTRICT,
  revision integer NOT NULL CHECK (revision >= 1),
  event_type text NOT NULL,
  summary_json jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (user_id, revision)
);

CREATE TABLE IF NOT EXISTS buying_browser_case_audit_events (
  id uuid PRIMARY KEY,
  workspace_user_id text NOT NULL REFERENCES buying_browser_workspaces(user_id) ON DELETE RESTRICT,
  case_id text NOT NULL,
  actor_user_id text NOT NULL,
  action text NOT NULL,
  old_value_json jsonb NOT NULL,
  new_value_json jsonb NOT NULL,
  evidence_note text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS buying_browser_document_sequences (
  sequence_key text PRIMARY KEY,
  document_type text NOT NULL CHECK (document_type IN ('QUOTATION', 'PI')),
  year integer NOT NULL CHECK (year >= 2020),
  last_number integer NOT NULL CHECK (last_number >= 1),
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_vehicles (
  vehicle_id text PRIMARY KEY,
  source_reference text NOT NULL UNIQUE,
  publication_status text NOT NULL CHECK (publication_status IN ('APPROVED', 'NEEDS_REVIEW', 'REJECTED')),
  customer_record jsonb,
  internal_record jsonb NOT NULL,
  source_adapter text NOT NULL,
  observed_at timestamptz,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((publication_status = 'APPROVED' AND customer_record IS NOT NULL) OR publication_status <> 'APPROVED')
);

CREATE TABLE IF NOT EXISTS vehicle_media (
  media_id text PRIMARY KEY,
  vehicle_id text,
  relative_path text NOT NULL UNIQUE,
  visibility text NOT NULL CHECK (visibility IN ('CUSTOMER_VISIBLE', 'INTERNAL_ONLY')),
  lifecycle_stage text NOT NULL DEFAULT 'Source',
  sha256 text NOT NULL CHECK (length(sha256) = 64),
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  imported_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (vehicle_id) REFERENCES inventory_vehicles(vehicle_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS migration_imports (
  import_id uuid PRIMARY KEY,
  source_system text NOT NULL,
  source_version text NOT NULL,
  manifest_sha256 text NOT NULL CHECK (length(manifest_sha256) = 64),
  record_counts jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_system, source_version, manifest_sha256)
);

CREATE INDEX IF NOT EXISTS idx_workspace_events_user_created ON buying_browser_workspace_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_audit_workspace_case_created ON buying_browser_case_audit_events (workspace_user_id, case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_publication_observed ON inventory_vehicles (publication_status, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_media_vehicle_visibility ON vehicle_media (vehicle_id, visibility);

GRANT USAGE ON SCHEMA public TO nk_cars_app;
GRANT SELECT, INSERT, UPDATE ON buying_browser_workspaces TO nk_cars_app;
GRANT SELECT, INSERT ON buying_browser_workspace_events TO nk_cars_app;
GRANT SELECT, INSERT ON buying_browser_case_audit_events TO nk_cars_app;
GRANT SELECT, INSERT, UPDATE ON buying_browser_document_sequences TO nk_cars_app;
GRANT SELECT, INSERT, UPDATE ON inventory_vehicles TO nk_cars_app;
GRANT SELECT, INSERT, UPDATE ON vehicle_media TO nk_cars_app;
GRANT SELECT, INSERT ON migration_imports TO nk_cars_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC;
