import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createPool } from "./db.mjs";

const seedPath = process.argv[2];
if (!seedPath) throw new Error("Usage: node import-inventory.mjs <inventory-seed.json>");

const source = await fs.readFile(seedPath);
const manifestSha256 = crypto.createHash("sha256").update(source).digest("hex");
const seed = JSON.parse(source.toString("utf8"));
if (!Array.isArray(seed.vehicles) || !Array.isArray(seed.media) || !seed.sourceVersion) throw new Error("invalid_inventory_seed");

const pool = createPool();
const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const vehicle of seed.vehicles) {
    await client.query(
      `INSERT INTO inventory_vehicles
       (vehicle_id, source_reference, publication_status, customer_record, internal_record, source_adapter, observed_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, now())
       ON CONFLICT (vehicle_id) DO UPDATE SET
         source_reference = EXCLUDED.source_reference,
         publication_status = EXCLUDED.publication_status,
         customer_record = EXCLUDED.customer_record,
         internal_record = EXCLUDED.internal_record,
         source_adapter = EXCLUDED.source_adapter,
         observed_at = EXCLUDED.observed_at,
         updated_at = now()`,
      [vehicle.vehicleId, vehicle.sourceReference, vehicle.publicationStatus, vehicle.customerRecord ? JSON.stringify(vehicle.customerRecord) : null, JSON.stringify(vehicle.internalRecord), vehicle.sourceAdapter, vehicle.observedAt || null],
    );
  }
  for (const media of seed.media) {
    await client.query(
      `INSERT INTO vehicle_media
       (media_id, vehicle_id, relative_path, visibility, lifecycle_stage, sha256, size_bytes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (media_id) DO UPDATE SET
         vehicle_id = EXCLUDED.vehicle_id,
         relative_path = EXCLUDED.relative_path,
         visibility = EXCLUDED.visibility,
         lifecycle_stage = EXCLUDED.lifecycle_stage,
         sha256 = EXCLUDED.sha256,
         size_bytes = EXCLUDED.size_bytes`,
      [media.mediaId, media.vehicleId || null, media.relativePath, media.visibility, media.lifecycleStage || "Source", media.sha256, media.sizeBytes],
    );
  }
  await client.query(
    `INSERT INTO migration_imports (import_id, source_system, source_version, manifest_sha256, record_counts)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     ON CONFLICT (source_system, source_version, manifest_sha256) DO NOTHING`,
    [crypto.randomUUID(), "repository-snapshot", seed.sourceVersion, manifestSha256, JSON.stringify({ vehicles: seed.vehicles.length, media: seed.media.length })],
  );
  await client.query("COMMIT");
  console.log(JSON.stringify({ status: "imported", vehicles: seed.vehicles.length, media: seed.media.length, manifestSha256 }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
