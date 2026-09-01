CREATE TABLE IF NOT EXISTS jaklaen_candidate_review_events (
  id uuid PRIMARY KEY,
  vehicle_id text NOT NULL REFERENCES inventory_vehicles(vehicle_id) ON DELETE RESTRICT,
  candidate_id text NOT NULL,
  actor_id text NOT NULL,
  actor_email text NOT NULL,
  action text NOT NULL CHECK (action IN ('FIELD_EDITED', 'APPROVED', 'REJECTED', 'NEED_MORE_INFO')),
  old_value_json jsonb NOT NULL,
  new_value_json jsonb NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jaklaen_candidate_review_vehicle_created ON jaklaen_candidate_review_events (vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jaklaen_candidate_review_candidate_created ON jaklaen_candidate_review_events (candidate_id, created_at DESC);

GRANT SELECT, INSERT ON jaklaen_candidate_review_events TO nk_cars_app;
REVOKE DELETE, UPDATE ON jaklaen_candidate_review_events FROM nk_cars_app;
