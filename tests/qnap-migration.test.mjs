import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { parseQnapInventoryPayload } from "../app/buying-browser/source-adapters/qnap-inventory-parser.mjs";

const validListing = {
  id: "nk-test-1",
  adapterId: "untrusted-upstream-adapter",
  sourceReference: "NK-TEST-1",
  title: "2020 Toyota Hilux Revo",
  summary: "Evidence-backed customer-safe summary.",
  brand: "Toyota",
  model: "Hilux Revo",
  year: 2020,
  grade: "Rocco",
  engine: "2.4L diesel",
  transmission: "AT",
  drive: "2WD",
  body: "Double Cab",
  mileageKm: 64000,
  color: "White",
  observedPriceThb: 759000,
  observedAt: "2026-08-27T00:00:00.000Z",
  generalLocation: "Bangkok",
  imageUrls: ["/vehicle-marketplace/test/cover.jpg"],
  availability: "Availability Not Yet Confirmed",
  translationState: "Normalized",
  evidenceLabels: ["Owner-reviewed listing facts"],
  demo: false,
  sourceUrl: "https://www.facebook.com/marketplace/item/private-source",
  sellerPhone: "+66 80 000 0000",
  internalNotes: "Must never reach the customer DTO",
};

test("QNAP inventory parser accepts only customer-safe media paths", () => {
  const parsed = parseQnapInventoryPayload({ observedAt: "2026-08-27T00:00:00.000Z", listings: [validListing] });
  assert.equal(parsed.listings.length, 1);
  assert.equal(parsed.observedAt, "2026-08-27T00:00:00.000Z");
  assert.equal(parsed.listings[0].adapterId, "qnap-postgres");
  assert.equal("sourceUrl" in parsed.listings[0], false);
  assert.equal("sellerPhone" in parsed.listings[0], false);
  assert.equal("internalNotes" in parsed.listings[0], false);
  const proxied = parseQnapInventoryPayload({ listings: [{ ...validListing, imageUrls: ["/api/buying-browser/qnap-media/nk-test-1/photo-01"] }] });
  assert.equal(proxied.listings[0].imageUrls[0], "/api/buying-browser/qnap-media/nk-test-1/photo-01");
  assert.throws(() => parseQnapInventoryPayload({ listings: [{ ...validListing, imageUrls: ["https://drive.google.com/private"] }] }), /qnap_inventory_invalid_listing/);
  assert.throws(() => parseQnapInventoryPayload({ listings: [{ ...validListing, imageUrls: ["/vehicle-marketplace/../internal/evidence.jpg"] }] }), /qnap_inventory_invalid_listing/);
});

test("QNAP PostgreSQL is private and the app role is least privilege", async () => {
  const [compose, schema, backupScript] = await Promise.all([
    fs.readFile(new URL("../deploy/qnap/docker-compose.full.yml", import.meta.url), "utf8"),
    fs.readFile(new URL("../deploy/qnap/postgres/init/010_schema.sql", import.meta.url), "utf8"),
    fs.readFile(new URL("../deploy/qnap/postgres/backup-loop.sh", import.meta.url), "utf8"),
  ]);
  const postgresSection = compose.split("  nk-cars-data:")[0];
  const dataSection = compose.split("  nk-cars-data:")[1].split("  nk-cars-app:")[0];
  const appSection = compose.split("  nk-cars-app:")[1].split("  nk-cars-backup:")[0];
  assert.doesNotMatch(postgresSection, /ports:/);
  assert.doesNotMatch(dataSection, /ports:/);
  assert.match(compose, /internal: true/);
  assert.match(appSection, /nk-cars-private/);
  assert.match(appSection, /nk-cars-edge/);
  assert.match(schema, /REVOKE ALL ON DATABASE nk_cars FROM PUBLIC/);
  assert.match(schema, /GRANT SELECT, INSERT ON buying_browser_case_audit_events TO nk_cars_app/);
  assert.doesNotMatch(schema, /GRANT ALL/);
  assert.match(backupScript, /sha256sum "\$\(basename "\$target"\)"/);
  assert.doesNotMatch(backupScript, /sha256sum "\$target"/);
});
