CREATE TABLE IF NOT EXISTS jaklaen_search_requests (
  id uuid PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  request_type text NOT NULL CHECK (request_type IN ('SEARCH_NOW', 'STANDING_SEARCH')),
  status text NOT NULL CHECK (status IN ('QUEUED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'BLOCKED')),
  criteria_json jsonb NOT NULL,
  schedule_json jsonb,
  priority text NOT NULL CHECK (priority IN ('normal', 'high', 'urgent')),
  requested_by_json jsonb NOT NULL CHECK ((requested_by_json->>'role') IN ('OWNER', 'STAFF', 'CUSTOMER')),
  customer_case_reference text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS jaklaen_search_jobs (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES jaklaen_search_requests(id) ON DELETE RESTRICT,
  job_type text NOT NULL CHECK (job_type IN ('SEARCH_NOW', 'STANDING_SEARCH')),
  status text NOT NULL CHECK (status IN ('QUEUED', 'CLAIMED', 'COMPLETED', 'BLOCKED', 'FAILED')),
  worker_id text,
  request_snapshot_json jsonb NOT NULL,
  safe_detail_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  claimed_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS jaklaen_search_audit_events (
  id uuid PRIMARY KEY,
  request_id uuid REFERENCES jaklaen_search_requests(id) ON DELETE RESTRICT,
  job_id uuid REFERENCES jaklaen_search_jobs(id) ON DELETE RESTRICT,
  actor_id text NOT NULL,
  actor_email text NOT NULL,
  action text NOT NULL CHECK (action IN ('SEARCH_REQUEST_CREATED', 'JOB_QUEUED', 'JOB_CLAIMED', 'JOB_COMPLETED', 'JOB_BLOCKED', 'READINESS_ACTION')),
  safe_detail_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL
);

ALTER TABLE jaklaen_search_audit_events
  DROP CONSTRAINT IF EXISTS jaklaen_search_audit_events_action_check;
ALTER TABLE jaklaen_search_audit_events
  ADD CONSTRAINT jaklaen_search_audit_events_action_check
  CHECK (action IN ('SEARCH_REQUEST_CREATED', 'JOB_QUEUED', 'JOB_CLAIMED', 'JOB_COMPLETED', 'JOB_BLOCKED', 'READINESS_ACTION'));

CREATE INDEX IF NOT EXISTS idx_jaklaen_search_requests_created ON jaklaen_search_requests (created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_jaklaen_search_requests_requested_by ON jaklaen_search_requests ((requested_by_json->>'id'), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jaklaen_search_jobs_queue ON jaklaen_search_jobs (status, created_at, id);
CREATE INDEX IF NOT EXISTS idx_jaklaen_search_jobs_request ON jaklaen_search_jobs (request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jaklaen_search_audit_request ON jaklaen_search_audit_events (request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jaklaen_search_audit_job ON jaklaen_search_audit_events (job_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON jaklaen_search_requests TO nk_cars_app;
GRANT SELECT, INSERT, UPDATE ON jaklaen_search_jobs TO nk_cars_app;
GRANT SELECT, INSERT ON jaklaen_search_audit_events TO nk_cars_app;
REVOKE DELETE ON jaklaen_search_requests FROM nk_cars_app;
REVOKE DELETE ON jaklaen_search_jobs FROM nk_cars_app;
REVOKE DELETE, UPDATE ON jaklaen_search_audit_events FROM nk_cars_app;
