CREATE TABLE IF NOT EXISTS sourcing_candidate_ingestions (
  candidate_id text PRIMARY KEY,
  command_id uuid NOT NULL REFERENCES sourcing_commands(id) ON DELETE RESTRICT,
  rule_id uuid NOT NULL REFERENCES sourcing_rules(id) ON DELETE RESTRICT,
  vehicle_id text NOT NULL REFERENCES inventory_vehicles(vehicle_id) ON DELETE RESTRICT,
  source_reference text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('RETAINED', 'DUPLICATE')),
  worker_id text NOT NULL,
  safe_detail_json jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sourcing_candidate_rule_created ON sourcing_candidate_ingestions (rule_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sourcing_candidate_command_created ON sourcing_candidate_ingestions (command_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sourcing_candidate_source_retained ON sourcing_candidate_ingestions (source_reference) WHERE outcome = 'RETAINED';

GRANT SELECT, INSERT ON sourcing_candidate_ingestions TO nk_cars_app;
REVOKE DELETE, UPDATE ON sourcing_candidate_ingestions FROM nk_cars_app;
