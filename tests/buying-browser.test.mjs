import assert from "node:assert/strict";
import test from "node:test";
import {
  CUSTOMER_FX_THB_PER_USD,
  DEFAULT_FILTERS,
  addCaseQuestion,
  assessQuotationReadiness,
  calculatePricing,
  customerUsdToThb,
  createExternalSourceCapture,
  createVehicleCase,
  filterListings,
  formatCustomerUsd,
  inspectionQuoteForLocation,
  presentCustomerListing,
  requestAvailability,
  requestInspection,
  requestQuotation,
} from "../app/buying-browser/domain.mjs";
import { detectSourceLanguage, localizeAvailability, localizeListingSummary, normalizeLanguage, translate } from "../app/buying-browser/i18n.mjs";
import { normalizeCustomerImageContentType, parseGoogleStagingValues, readBoundedResponseBytes } from "../app/buying-browser/source-adapters/google-staging-parser.mjs";
import { customerWorkspaceId, mergeBuyingBrowserStates, validateAndOwnBuyingBrowserState, workspaceSummary } from "../app/buying-browser/workspace-state.mjs";
import { applyOwnerCaseVerification, normalizeOwnerCaseVerification } from "../app/buying-browser/owner-case-verification.mjs";

const source = {
  id: "listing-1",
  adapterId: "fixture",
  sourceReference: "FIXTURE-1",
  sourcePlatform: "Internal platform",
  sourceUrl: "https://private.example/source",
  sellerName: "Private Seller",
  sellerPhone: "+66 81 222 3333",
  exactLocation: "Private address",
  internalNotes: "Never expose",
  title: "2022 Toyota Hilux Revo",
  summary: "Evidence-backed normalized summary.",
  brand: "Toyota",
  model: "Hilux Revo",
  year: 2022,
  grade: "Rocco",
  engine: "2.8L diesel",
  transmission: "AT",
  drive: "4WD",
  body: "Double Cab",
  mileageKm: 42000,
  color: "Black",
  observedPriceThb: 900000,
  observedAt: "2026-08-23T08:30:00.000Z",
  generalLocation: "Bangkok",
  imageUrls: ["https://images.example/vehicle.jpg"],
  availability: "Availability Not Yet Confirmed",
  translationState: "Normalized",
  evidenceLabels: ["Listing title"],
  demo: true,
};

class MemoryWorkspaceD1 {
  constructor() {
    this.workspaces = new Map();
    this.events = new Map();
    this.caseAudits = new Map();
  }

  prepare(sql) {
    const workspaces = this.workspaces;
    const events = this.events;
    const caseAudits = this.caseAudits;
    let values = [];
    return {
      bind(...nextValues) { values = nextValues; return this; },
      async first() {
        if (sql.startsWith("SELECT state_json")) return workspaces.get(values[0]) ?? null;
        if (sql.startsWith("SELECT user_id, email, display_name, state_json")) return workspaces.get(values[0]) ?? null;
        throw new Error(`Unexpected first SQL: ${sql}`);
      },
      async all() {
        if (sql.startsWith("SELECT user_id, email, display_name, state_json")) return { success: true, results: [...workspaces.values()] };
        if (sql.startsWith("SELECT id, workspace_user_id, case_id")) return { success: true, results: [...caseAudits.values()].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 100) };
        throw new Error(`Unexpected all SQL: ${sql}`);
      },
      async run() {
        if (sql.startsWith("INSERT INTO buying_browser_workspaces")) {
          const [userId, email, displayName, stateJson, revision, createdAt, updatedAt] = values;
          if (workspaces.has(userId)) throw new Error("workspace_unique_conflict");
          workspaces.set(userId, { user_id: userId, email, display_name: displayName, state_json: stateJson, revision, created_at: createdAt, updated_at: updatedAt });
        } else if (sql.startsWith("UPDATE buying_browser_workspaces SET state_json")) {
          const [stateJson, revision, updatedAt, userId, expectedRevision] = values;
          const existing = workspaces.get(userId);
          if (existing?.revision === expectedRevision) workspaces.set(userId, { ...existing, state_json: stateJson, revision, updated_at: updatedAt });
        } else if (sql.startsWith("UPDATE buying_browser_workspaces")) {
          const [email, displayName, stateJson, revision, updatedAt, userId, expectedRevision] = values;
          const existing = workspaces.get(userId);
          if (existing?.revision === expectedRevision) workspaces.set(userId, { ...existing, email, display_name: displayName, state_json: stateJson, revision, updated_at: updatedAt });
        } else if (sql.startsWith("INSERT INTO buying_browser_workspace_events")) {
          const [id, userId, revision, eventType, summaryJson, createdAt] = values;
          const uniqueKey = `${userId}:${revision}`;
          if (events.has(uniqueKey)) throw new Error("event_revision_conflict");
          events.set(uniqueKey, { id, userId, revision, eventType, summaryJson, createdAt });
        } else if (sql.startsWith("INSERT INTO buying_browser_case_audit_events")) {
          const [id, workspaceUserId, caseId, actorUserId, action, oldValueJson, newValueJson, evidenceNote, createdAt] = values;
          caseAudits.set(id, { id, workspace_user_id: workspaceUserId, case_id: caseId, actor_user_id: actorUserId, action, old_value_json: oldValueJson, new_value_json: newValueJson, evidence_note: evidenceNote, created_at: createdAt });
        } else {
          throw new Error(`Unexpected run SQL: ${sql}`);
        }
        return { success: true, meta: {} };
      },
    };
  }

  async batch(statements) {
    const workspaceBackup = new Map(this.workspaces);
    const eventBackup = new Map(this.events);
    const caseAuditBackup = new Map(this.caseAudits);
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    } catch (error) {
      this.workspaces.clear();
      this.events.clear();
      this.caseAudits.clear();
      for (const entry of workspaceBackup) this.workspaces.set(...entry);
      for (const entry of eventBackup) this.events.set(...entry);
      for (const entry of caseAuditBackup) this.caseAudits.set(...entry);
      throw error;
    }
  }
}

test("account workspace validation enforces ownership and customer-safe fields", () => {
  const listing = presentCustomerListing(source);
  const vehicleCase = createVehicleCase(listing, [], "spoofed-customer", "2026-08-26T10:00:00.000Z").caseRecord;
  const state = { version: 1, savedListingIds: [listing.id], cases: [vehicleCase], importedListings: [listing], sourceCaptures: [], generalMessages: [] };
  const owned = validateAndOwnBuyingBrowserState(state, "account-1");
  assert.equal(owned.cases[0].customerId, customerWorkspaceId("account-1"));
  assert.deepEqual(workspaceSummary(owned), { savedVehicles: 1, vehicleCases: 1, importedListings: 1, sourceCaptures: 0, messages: 1 });
  assert.throws(() => validateAndOwnBuyingBrowserState({ ...state, importedListings: [{ ...listing, sellerPhone: "private" }] }, "account-1"), /internal_field_not_allowed/);
});

test("workspace conflict merge preserves newer cases and unique history", () => {
  const listing = presentCustomerListing(source);
  const original = createVehicleCase(listing, [], "customer", "2026-08-26T10:00:00.000Z").caseRecord;
  const server = { version: 1, savedListingIds: ["server"], cases: [original], importedListings: [], sourceCaptures: [], generalMessages: [{ id: "server-message", sender: "System", text: "server", createdAt: "2026-08-26T10:00:00.000Z" }] };
  const local = { version: 1, savedListingIds: ["local"], cases: [{ ...original, status: "Availability Requested", updatedAt: "2026-08-26T11:00:00.000Z" }], importedListings: [], sourceCaptures: [], generalMessages: [{ id: "local-message", sender: "Customer", text: "local", createdAt: "2026-08-26T11:00:00.000Z" }] };
  const merged = mergeBuyingBrowserStates(server, local);
  assert.deepEqual(merged.savedListingIds.sort(), ["local", "server"]);
  assert.equal(merged.cases[0].status, "Availability Requested");
  assert.deepEqual(merged.generalMessages.map((item) => item.id), ["server-message", "local-message"]);
});

test("authenticated workspace API persists cases, isolates accounts, and rejects stale writes", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `workspace-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const DB = new MemoryWorkspaceD1();
  globalThis.__NK_WORKSPACE_TEST_DB__ = DB;
  const env = { DB, ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const authHeaders = { "content-type": "application/json", "oai-authenticated-user-id": "account-1", "oai-authenticated-user-email": "buyer@example.com" };
  const listing = presentCustomerListing(source);
  const vehicleCase = createVehicleCase(listing, [], "spoofed", "2026-08-26T10:00:00.000Z").caseRecord;
  const state = { version: 1, savedListingIds: [listing.id], cases: [vehicleCase], importedListings: [], sourceCaptures: [], generalMessages: [] };

  const anonymous = await worker.fetch(new Request("http://localhost/api/buying-browser/workspace", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ state, expectedRevision: 0 }) }), env, ctx);
  assert.equal(anonymous.status, 401);

  const saved = await worker.fetch(new Request("http://localhost/api/buying-browser/workspace", { method: "PUT", headers: authHeaders, body: JSON.stringify({ state, expectedRevision: 0 }) }), env, ctx);
  assert.equal(saved.status, 200);
  const savedPayload = await saved.json();
  assert.equal(savedPayload.revision, 1);
  assert.equal(savedPayload.state.cases[0].customerId, customerWorkspaceId("account-1"));

  const otherAccount = await worker.fetch(new Request("http://localhost/api/buying-browser/workspace", { headers: { "oai-authenticated-user-id": "account-2", "oai-authenticated-user-email": "other@example.com" } }), env, ctx);
  assert.equal(otherAccount.status, 200);
  assert.equal((await otherAccount.json()).state, null);

  const stale = await worker.fetch(new Request("http://localhost/api/buying-browser/workspace", { method: "PUT", headers: authHeaders, body: JSON.stringify({ state, expectedRevision: 0 }) }), env, ctx);
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).revision, 1);
  assert.equal(DB.events.size, 1);
  delete globalThis.__NK_WORKSPACE_TEST_DB__;
});

test("Owner verification validates evidence and preserves deterministic commercial gates", () => {
  const listing = presentCustomerListing(source);
  const vehicleCase = createVehicleCase(listing, [], "customer-1", "2026-08-26T10:00:00.000Z").caseRecord;
  assert.throws(() => normalizeOwnerCaseVerification({ availability: "Verified Available", evidenceNote: "x" }), /invalid_evidence_note/);
  assert.throws(() => normalizeOwnerCaseVerification({ availability: "Verified Available", actualVehiclePurchasePriceThb: -1, evidenceNote: "Verified by Owner" }), /invalid_vehicle_price/);
  const applied = applyOwnerCaseVerification(vehicleCase, {
    availability: "Verified Available",
    actualVehiclePurchasePriceThb: 880000,
    inspectionTravelThb: 3500,
    domesticTransportThb: 0,
    repairModificationThb: 0,
    exportShippingThb: 42000,
    otherAgreedThb: 0,
    evidenceNote: "Seller confirmed availability and price; material costs checked against current records.",
  }, new Date("2026-08-26T11:00:00.000Z"));
  assert.equal(applied.quotationReadiness.ready, true);
  assert.equal(applied.caseRecord.vehicle.availability, "Verified Available");
  assert.equal(applied.caseRecord.inspectionQuote.totalThb, 3500);
  assert.equal(applied.caseRecord.quotationRequest, null);
  assert.match(applied.caseRecord.messages.at(-1).text, /no quotation, PI, payment, or purchase/i);
  assert.doesNotMatch(JSON.stringify(applied.caseRecord), /paymentConfirmed|piNumber|quotationNumber/i);
});

test("Owner Case API is allowlisted, auditable, conflict-safe, and updates the customer workspace", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `owner-case-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const DB = new MemoryWorkspaceD1();
  globalThis.__NK_WORKSPACE_TEST_DB__ = DB;
  const env = { DB, ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const customerHeaders = { "content-type": "application/json", "oai-authenticated-user-id": "customer-account", "oai-authenticated-user-email": "buyer@example.com" };
  const ownerHeaders = { "content-type": "application/json", "oai-authenticated-user-id": "owner-account", "oai-authenticated-user-email": "owner@example.com" };
  const listing = presentCustomerListing(source);
  const vehicleCase = requestQuotation(createVehicleCase(listing, [], "spoofed", "2026-08-26T10:00:00.000Z").caseRecord, new Date("2026-08-26T10:05:00.000Z"));
  const state = { version: 1, savedListingIds: [listing.id], cases: [vehicleCase], importedListings: [], sourceCaptures: [], generalMessages: [] };
  const saved = await worker.fetch(new Request("http://localhost/api/buying-browser/workspace", { method: "PUT", headers: customerHeaders, body: JSON.stringify({ state, expectedRevision: 0 }) }), env, ctx);
  assert.equal(saved.status, 200);

  const previousOwnerIds = process.env.NK_OWNER_ACCOUNT_IDS;
  process.env.NK_OWNER_ACCOUNT_IDS = "owner-account";
  try {
    const anonymous = await worker.fetch(new Request("http://localhost/api/buying-browser/owner/cases"), env, ctx);
    assert.equal(anonymous.status, 401);
    const denied = await worker.fetch(new Request("http://localhost/api/buying-browser/owner/cases", { headers: customerHeaders }), env, ctx);
    assert.equal(denied.status, 403);
    const queue = await worker.fetch(new Request("http://localhost/api/buying-browser/owner/cases", { headers: ownerHeaders }), env, ctx);
    assert.equal(queue.status, 200);
    const queuePayload = await queue.json();
    assert.equal(queuePayload.cases.length, 1);
    assert.equal(queuePayload.cases[0].customerEmail, "buyer@example.com");
    assert.equal(queuePayload.cases[0].workspaceRevision, 1);

    const verification = {
      availability: "Verified Available",
      actualVehiclePurchasePriceThb: 880000,
      inspectionTravelThb: 3500,
      domesticTransportThb: 0,
      repairModificationThb: 0,
      exportShippingThb: 42000,
      otherAgreedThb: 0,
      evidenceNote: "Seller confirmed current availability and price; remaining costs checked by Owner.",
    };
    const updated = await worker.fetch(new Request("http://localhost/api/buying-browser/owner/cases", { method: "PATCH", headers: ownerHeaders, body: JSON.stringify({ workspaceUserId: "customer-account", caseId: vehicleCase.id, expectedRevision: 1, verification }) }), env, ctx);
    assert.equal(updated.status, 200);
    const updatedPayload = await updated.json();
    assert.equal(updatedPayload.case.workspaceRevision, 2);
    assert.equal(updatedPayload.case.quotationReadiness.ready, true);
    assert.equal(updatedPayload.case.vehicleCase.quotationRequest.status, "Requested - Awaiting NK Review");
    assert.equal(updatedPayload.case.auditEvents[0].oldValue.actualVehiclePurchasePriceThb, null);
    assert.equal(updatedPayload.case.auditEvents[0].newValue.actualVehiclePurchasePriceThb, 880000);
    assert.equal(DB.caseAudits.size, 1);

    const customerWorkspace = await worker.fetch(new Request("http://localhost/api/buying-browser/workspace", { headers: customerHeaders }), env, ctx);
    const customerPayload = await customerWorkspace.json();
    assert.equal(customerPayload.revision, 2);
    assert.equal(customerPayload.state.cases[0].availability, "Verified Available");
    assert.equal(customerPayload.state.cases[0].actualVehiclePurchasePriceThb, 880000);

    const stale = await worker.fetch(new Request("http://localhost/api/buying-browser/owner/cases", { method: "PATCH", headers: ownerHeaders, body: JSON.stringify({ workspaceUserId: "customer-account", caseId: vehicleCase.id, expectedRevision: 1, verification }) }), env, ctx);
    assert.equal(stale.status, 409);
    assert.equal(DB.caseAudits.size, 1);
  } finally {
    if (previousOwnerIds === undefined) delete process.env.NK_OWNER_ACCOUNT_IDS;
    else process.env.NK_OWNER_ACCOUNT_IDS = previousOwnerIds;
    delete globalThis.__NK_WORKSPACE_TEST_DB__;
  }
});

test("Google staging uses named columns, keeps review rows internal, and exposes only approved customer-safe records and media", () => {
  const vehicleRows = [
    ["title_en", "vehicle_id", "publication_status", "visibility", "source_reference", "summary_en", "brand", "model", "observed_at", "source_url", "seller_name", "drive_folder_id", "year", "transmission", "drive", "availability_status", "translation_state", "evidence_labels_json", "observed_price_thb", "general_location"],
    ["2020 Toyota Hilux Revo", "vehicle-approved", "Approved for Browse", "CUSTOMER_VISIBLE", "NK-STAGE-001", "Evidence-backed customer summary.", "Toyota", "Hilux Revo", "2026-08-26T01:00:00.000Z", "https://www.facebook.com/marketplace/item/private-source/", "Private Seller", "private-folder-id", 2020, "AT", "4WD", "Availability Not Yet Confirmed", "Normalized", "[\"Listing facts\"]", 500000, "Bangkok"],
    ["Internal Vehicle", "vehicle-internal", "Needs Review", "INTERNAL_ONLY", "NK-STAGE-002", "Internal only.", "Toyota", "Hilux Revo", "2026-08-26T02:00:00.000Z", "https://private.example/internal", "Internal Seller", "internal-folder", 2021, "AT", "2WD", "Availability Not Yet Confirmed", "Need Review", "[]", 600000, "Bangkok"],
  ];
  const mediaRows = [
    ["drive_file_id", "media_id", "vehicle_id", "source_reference", "sort_order", "visibility", "review_status", "kind", "alt_text_en", "mime_type", "uploaded_at", "fallback_path"],
    ["drive-approved-secret", "photo-01", "vehicle-approved", "NK-STAGE-001", 1, "CUSTOMER_VISIBLE", "Approved", "photo", "Vehicle front", "image/jpeg", "2026-08-26T01:01:00.000Z", "/safe-fallback.jpg"],
    ["drive-internal-secret", "photo-02", "vehicle-approved", "NK-STAGE-001", 2, "INTERNAL_ONLY", "Approved", "photo", "Internal evidence", "image/jpeg", "2026-08-26T01:02:00.000Z", "/internal.jpg"],
    ["drive-unreviewed-secret", "photo-03", "vehicle-approved", "NK-STAGE-001", 3, "CUSTOMER_VISIBLE", "Needs Review", "photo", "Unreviewed", "image/jpeg", "2026-08-26T01:03:00.000Z", "/unreviewed.jpg"],
  ];

  const snapshot = parseGoogleStagingValues(vehicleRows, mediaRows, "2026-08-26T03:00:00.000Z", "sheet-private-id");
  assert.equal(snapshot.listings.length, 1);
  assert.equal(snapshot.internalRecords.length, 2);
  assert.deepEqual(snapshot.listings[0].imageUrls, ["/api/buying-browser/media/vehicle-approved/photo-01"]);
  const customerJson = JSON.stringify(snapshot.listings);
  assert.doesNotMatch(customerJson, /facebook\.com|Private Seller|drive-approved-secret|private-folder-id|sheet-private-id/i);
  assert.match(snapshot.internalRecords[0].sourceUrl, /facebook\.com/);
  assert.match(snapshot.internalRecords[0].spreadsheetUrl, /sheet-private-id/);
  assert.equal(snapshot.internalRecords[1].publicationStatus, "Needs Review");
  assert.equal(snapshot.internalRecords[1].visibility, "INTERNAL_ONLY");
  assert.deepEqual(snapshot.internalRecords[1].imageUrls, [], "unreviewed media is not routed through the customer media proxy");
  assert.equal(snapshot.media.length, 3, "private media stays available only to the server-side authorization boundary");

  const missingCoverRows = structuredClone(mediaRows);
  missingCoverRows[1][4] = 2;
  assert.throws(
    () => parseGoogleStagingValues(vehicleRows, missingCoverRows),
    /google_staging_customer_cover_missing/,
    "approved customer media must reserve sort_order 1 for the reviewed cover",
  );
});

test("Google media proxy accepts bounded raster images and rejects active image content", async () => {
  assert.equal(normalizeCustomerImageContentType("image/jpeg; charset=binary"), "image/jpeg");
  assert.equal(normalizeCustomerImageContentType("image/jpg"), "image/jpeg");
  assert.equal(normalizeCustomerImageContentType("image/svg+xml"), "");
  assert.equal(normalizeCustomerImageContentType("text/html"), "");
  assert.deepEqual(await readBoundedResponseBytes(new Response(new Uint8Array([1, 2, 3])), 3), new Uint8Array([1, 2, 3]));
  await assert.rejects(() => readBoundedResponseBytes(new Response(new Uint8Array([1, 2, 3, 4])), 3), /google_media_too_large/);
});

test("customer presenter strips internal source and seller fields", () => {
  const customer = presentCustomerListing(source);
  assert.equal(customer.title, source.title);
  const serialized = JSON.stringify(customer);
  for (const secret of ["sellerName", "sellerPhone", "sourceUrl", "sourcePlatform", "exactLocation", "internalNotes", "Private Seller", "+66 81 222 3333"]) {
    assert.doesNotMatch(serialized, new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("browse filtering preserves explicit vehicle criteria", () => {
  const customer = presentCustomerListing(source);
  const second = { ...customer, id: "listing-2", brand: "Ford", model: "Ranger", title: "2020 Ford Ranger", year: 2020, transmission: "MT", drive: "2WD", body: "Extended Cab", observedPriceThb: 600000, mileageKm: 90000, generalLocation: "Rayong" };
  const matches = filterListings([customer, second], { ...DEFAULT_FILTERS, query: "Revo", yearFrom: "2021", priceMax: "950000", mileageMax: "50000", drive: "4WD", location: "Bangkok" });
  assert.deepEqual(matches.map((item) => item.id), ["listing-1"]);
  assert.deepEqual(filterListings([customer, second], { ...DEFAULT_FILTERS, transmission: "MT", location: "All Thailand" }).map((item) => item.id), ["listing-2"]);
  assert.deepEqual(filterListings([customer, second], { ...DEFAULT_FILTERS, body: "Double Cab", sort: "price-low" }).map((item) => item.id), ["listing-1"]);
});

test("browse defaults to Bangkok Metro and groups the approved nearby operating area", () => {
  const bangkok = presentCustomerListing(source);
  const nonthaburi = { ...bangkok, id: "listing-nonthaburi", generalLocation: "Nonthaburi" };
  const samutSakhon = { ...bangkok, id: "listing-samut-sakhon", generalLocation: "Samut Sakhon" };
  const chonBuri = { ...bangkok, id: "listing-chon-buri", generalLocation: "Chon Buri" };
  const rayong = { ...bangkok, id: "listing-rayong", generalLocation: "Rayong" };
  assert.equal(DEFAULT_FILTERS.location, "Bangkok Metro");
  assert.deepEqual(filterListings([bangkok, nonthaburi, samutSakhon, chonBuri, rayong]).map((item) => item.id), ["listing-1", "listing-nonthaburi", "listing-samut-sakhon"]);
  assert.deepEqual(filterListings([bangkok, nonthaburi, samutSakhon, chonBuri, rayong], { ...DEFAULT_FILTERS, location: "Nearby Provinces" }).map((item) => item.id), ["listing-chon-buri"]);
  assert.equal(filterListings([bangkok, nonthaburi, samutSakhon, chonBuri, rayong], { ...DEFAULT_FILTERS, location: "All Thailand" }).length, 5);
});

test("pricing splits NK fees into configurable 6% and 4% vehicle-price components", () => {
  const result = calculatePricing({ vehiclePriceThb: 500000, platformTransactionRate: 6, buyingServiceRate: 4, inspectionTravelThb: 3500, domesticTransportThb: 10000, repairModificationThb: 20000, exportShippingThb: 50000, otherAgreedThb: null });
  assert.equal(result.platformTransactionAmountThb, 30000);
  assert.equal(result.buyingServiceAmountThb, 20000);
  assert.equal(result.totalNkFeeAmountThb, 50000);
  assert.equal(result.knownSubtotalThb, 633_500);
  assert.equal(result.pendingCount, 1);
  assert.equal(result.lines.find((line) => line.key === "other")?.status, "Pending");
  assert.equal(result.lines.find((line) => line.key === "inspection")?.amountThb, 3500);
  assert.ok(result.lines.every((line) => !("label" in line)), "pricing engine returns structured keys, not customer labels or percentages");

  const configured = calculatePricing({ vehiclePriceThb: 500000, platformTransactionRate: 7, buyingServiceRate: 3, inspectionTravelThb: 100000, domesticTransportThb: null, repairModificationThb: null, exportShippingThb: null, otherAgreedThb: null });
  assert.equal(configured.platformTransactionAmountThb, 35000);
  assert.equal(configured.buyingServiceAmountThb, 15000);
  assert.equal(configured.lines.find((line) => line.key === "inspection")?.amountThb, 100000, "pass-through cost is not marked up");
});

test("quotation readiness blocks unverified facts and requires explicit zero-value cost confirmations", () => {
  const listing = presentCustomerListing(source);
  const vehicleCase = createVehicleCase(listing, [], "customer-1", "2026-08-26T12:00:00.000Z").caseRecord;
  const pending = assessQuotationReadiness(vehicleCase);
  assert.equal(pending.ready, false);
  assert.equal(pending.status, "Not Ready");
  assert.equal(pending.piStatus, "Blocked - Quotation Not Accepted");
  assert.equal(pending.items.find((item) => item.key === "inspection")?.ready, true);
  assert.equal(pending.pendingCount, 6);

  const verified = {
    ...vehicleCase,
    availability: "Verified Available",
    actualVehiclePurchasePriceThb: 880000,
    domesticTransportThb: 0,
    repairModificationThb: 0,
    exportShippingThb: 54000,
    otherAgreedThb: 0,
  };
  const ready = assessQuotationReadiness(verified);
  assert.equal(ready.ready, true);
  assert.equal(ready.status, "Ready for NK Review");
  assert.equal(ready.pendingCount, 0);
  assert.equal(ready.piStatus, "Blocked - Quotation Not Accepted", "PI remains gated even after pricing facts are ready");
});

test("quotation request records history without issuing a quote, PI, payment, or external message", () => {
  const listing = presentCustomerListing(source);
  const vehicleCase = createVehicleCase(listing, [], "customer-1", "2026-08-26T12:00:00.000Z").caseRecord;
  const requested = requestQuotation(vehicleCase, "2026-08-26T12:05:00.000Z", "th");
  assert.equal(requested.quotationRequest.status, "Requested - Awaiting NK Review");
  assert.equal(requested.timeline.at(-1).title, "Quotation requested");
  assert.match(requested.messages.at(-1).text, /PI/);
  assert.ok(requested.messages.every((message) => message.delivery !== "Prepared - not sent"), "no seller/customer channel send is prepared");
  assert.equal(requestQuotation(requested, "2026-08-26T12:06:00.000Z"), requested, "request is idempotent");
  assert.equal("piNumber" in requested, false);
  assert.equal("paymentStatus" in requested, false);
});

test("commercial readiness UI explains quotation before PI in all customer languages", async () => {
  const { readFile } = await import("node:fs/promises");
  const component = await readFile(new URL("../app/buying-browser/components/CommercialReadiness.tsx", import.meta.url), "utf8");
  assert.match(component, /Quotation readiness/);
  assert.match(component, /报价准备状态/);
  assert.match(component, /ความพร้อมของใบเสนอราคา/);
  assert.match(component, /Proforma Invoice \(PI\)/);
  assert.match(component, /Authorized Finance must confirm actual funds received/);
});

test("localization changes presentation without mutating authoritative listing data", () => {
  const listing = presentCustomerListing(source);
  const before = structuredClone(listing);
  assert.equal(normalizeLanguage("unsupported"), "en");
  assert.equal(translate("en", "vehiclePrice"), "Vehicle Price");
  assert.equal(translate("zh-CN", "vehiclePrice"), "车辆价格");
  assert.equal(translate("th", "vehiclePrice"), "ราคารถ");
  assert.equal(localizeAvailability("Availability Not Yet Confirmed", "zh-CN"), "可售状态尚未确认");
  assert.equal(detectSourceLanguage("รถสวย ไมล์น้อย"), "th");
  assert.equal(detectSourceLanguage("车辆状态很好"), "zh-CN");
  assert.match(localizeListingSummary(listing, "zh-CN"), /Toyota Hilux Revo/);
  assert.match(localizeListingSummary(listing, "th"), /Toyota Hilux Revo/);
  assert.deepEqual(listing, before);
});

test("customer USD display uses one deterministic preview FX rate", () => {
  assert.equal(CUSTOMER_FX_THB_PER_USD, 35);
  assert.equal(formatCustomerUsd(759000), "USD 21,686");
  assert.equal(customerUsdToThb("20000"), "700000");
  assert.equal(customerUsdToThb(""), "");
});

test("inspection quote uses deterministic configured location zones", () => {
  assert.deepEqual(inspectionQuoteForLocation("Bangkok, Thailand"), { region: "Bangkok Metro", baseFeeThb: 2900, travelFeeThb: 600, totalThb: 3500, status: "Quote Ready" });
  assert.deepEqual(inspectionQuoteForLocation("Nakhon Pathom, Thailand"), { region: "Bangkok Metro", baseFeeThb: 2900, travelFeeThb: 600, totalThb: 3500, status: "Quote Ready" });
  assert.equal(inspectionQuoteForLocation("Unknown province"), null);
});

test("Vehicle Case deduplicates save and records honest pending workflows", () => {
  const listing = presentCustomerListing(source);
  const created = createVehicleCase(listing, [], "customer-1", "2026-08-23T10:00:00.000Z");
  assert.equal(created.created, true);
  assert.equal(created.caseRecord.id, "NK-CASE-2026-001245");
  assert.equal(created.caseRecord.sourceCaptureId, null);
  assert.equal(created.caseRecord.availability, "Availability Not Yet Confirmed");
  assert.equal(created.caseRecord.platformTransactionRate, 6);
  assert.equal(created.caseRecord.buyingServiceRate, 4);
  const duplicate = createVehicleCase(listing, [created.caseRecord], "customer-1", "2026-08-23T10:01:00.000Z");
  assert.equal(duplicate.created, false);
  assert.equal(duplicate.caseRecord.id, created.caseRecord.id);

  const availability = requestAvailability(created.caseRecord, "2026-08-23T10:02:00.000Z");
  assert.equal(availability.availability, "Availability Check Requested");
  assert.match(availability.messages.at(-1).text, /No seller message has been sent/i);
  const inspection = requestInspection(availability, "2026-08-23T10:03:00.000Z");
  assert.equal(inspection.inspectionQuote.status, "Requested - Awaiting Provider");
  assert.match(inspection.messages.at(-1).text, /No provider is assigned or booked yet/i);
  const answered = addCaseQuestion(inspection, "Is this available?", "2026-08-23T10:04:00.000Z");
  assert.match(answered.messages.at(-1).text, /not confirmed|requested/i);
});

test("Chinese buyer question preserves original text and prepares a Thai seller translation without sending", () => {
  const listing = presentCustomerListing(source);
  const created = createVehicleCase(listing, [], "customer-1", "2026-08-23T10:00:00.000Z").caseRecord;
  const question = "这辆车还在吗？最低价格是多少？";
  const answered = addCaseQuestion(created, question, "2026-08-23T10:04:00.000Z", "zh-CN");
  assert.equal(answered.messages.at(-2).text, question);
  assert.match(answered.messages.at(-1).text, /尚未确认/);
  assert.equal(answered.translationHistory.at(-1).originalText, question);
  assert.equal(answered.translationHistory.at(-1).sourceLanguage, "zh-CN");
  assert.equal(answered.translationHistory.at(-1).translationLanguage, "th");
  assert.equal(answered.translationHistory.at(-1).status, "Prepared - not sent");
});

test("external Facebook handoff captures the source internally and links it to a customer-safe case", () => {
  const listing = { ...presentCustomerListing(source), demo: false };
  const capture = createExternalSourceCapture(listing, {
    submittedUrl: "https://www.facebook.com/share/1DF6CzLM1A/",
    canonicalUrl: "https://www.facebook.com/marketplace/item/1716607786274590/",
    sourcePlatform: "Facebook Marketplace",
    captureMethod: "external_share_link",
    importStatus: "partial",
    textEvidence: { originalText: "รถสวย ไมล์ 42,000", sourceLanguage: "th", normalizedText: "Vehicle evidence normalized for review.", translationLanguage: "en" },
  }, "2026-08-24T01:00:00.000Z");
  const created = createVehicleCase(listing, [], "customer-1", "2026-08-24T01:01:00.000Z", capture.id);
  assert.equal(capture.listingId, listing.id);
  assert.equal(capture.canonicalUrl, "https://www.facebook.com/marketplace/item/1716607786274590/");
  assert.equal(capture.textEvidence.originalText, "รถสวย ไมล์ 42,000");
  assert.equal(capture.textEvidence.translationLanguage, "en");
  assert.equal(created.caseRecord.sourceCaptureId, capture.id);
  assert.match(created.caseRecord.timeline[0].detail, /source link captured internally/i);
  assert.doesNotMatch(JSON.stringify(created.caseRecord.vehicle), /facebook\.com|1716607786274590/i);

  const legacyCase = createVehicleCase(listing, [], "customer-1", "2026-08-24T00:59:00.000Z").caseRecord;
  const linked = createVehicleCase(listing, [legacyCase], "customer-1", "2026-08-24T01:02:00.000Z", capture.id);
  assert.equal(linked.created, false);
  assert.equal(linked.caseRecord.sourceCaptureId, capture.id);
  assert.match(linked.caseRecord.timeline.at(-1).detail, /linked to this customer-safe Vehicle Case/i);
});

test("external source capture rejects non-HTTPS source references", () => {
  const listing = { ...presentCustomerListing(source), demo: false };
  assert.throws(() => createExternalSourceCapture(listing, {
    submittedUrl: "http://www.facebook.com/marketplace/item/1716607786274590/",
  }), /valid_source_url_required/);
});

test("renders additive Buying Browser routes without customer source leakage", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `buying-browser-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const routes = ["/buy", "/buy/browser", "/buy/browse", "/buy/saved", "/buy/paste", "/buy/share", "/buy/ask", "/buy/cases", "/buy/cases/NK-CASE-2026-000001", "/buy/inspections", "/buy/messages", "/buy/account", "/buy/vehicle/nk-market-2026-0825-01", "/buy/vehicle/nk-market-2026-0825-05"];
  for (const route of routes) {
    const response = await worker.fetch(new Request(`http://localhost${route}`, { headers: { accept: "text/html" } }), env, ctx);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    const textHtml = html.replaceAll("<!-- -->", "");
    assert.match(html, /data-buying-browser-v1/i, route);
    assert.doesNotMatch(html, /Siam Pickup Demo|\+66 81 000 0101|example\.invalid\/internal|Demo partner feed|Bang Kapi/i, route);
    assert.doesNotMatch(html, /facebook\.com\/marketplace\/item\/1716607786274590|1IXEZTH2EYcIeM6HQKJ2Qfk4LZYsVWu4ipNolXoTnxhw|1oR6RF0CZpokbnEcWQ7iMtWiplnskWEB1/i, route);
    assert.doesNotMatch(html, /4406225212934069|1078557808193843|Pranee Pra Jaideaw|080 632 3247/i, route);
    if (route === "/buy") {
      assert.match(html, /data-browse-marketplace-v2/i);
      assert.match(html, /data-vehicle-card-v2/i);
      assert.match(textHtml, /<b>6<\/b> vehicles/i);
      assert.match(html, /NK Selection/i);
      assert.doesNotMatch(html, /10 selected/i);
      assert.match(html, /USD 21,686/i);
      assert.doesNotMatch(html, /data-real-source-launch/i);
    }
    if (route === "/buy/browse") {
      assert.match(html, /data-browse-marketplace-v2/i);
      assert.match(html, /data-vehicle-card-v2/i);
      assert.match(html, /2020 Toyota Hilux Revo Rocco 2\.4 AT/i);
      assert.match(textHtml, /<b>6<\/b> vehicles/i);
      assert.match(html, /Bangkok Metro/i);
      assert.doesNotMatch(html, /10 selected/i);
      assert.doesNotMatch(html, /Explore customer-safe vehicle results|Demo market results|Primary Buying Browser actions/i);
    }
    if (route === "/buy/browser") {
      assert.match(html, /data-web-browser-companion/i);
      assert.match(html, /Open Facebook Marketplace/i);
      assert.match(html, /Save to NK/i);
      assert.doesNotMatch(html, /iframe/i);
    }
    if (route === "/buy/paste" || route === "/buy/share") {
      assert.match(html, /data-facebook-external-handoff/i);
      assert.match(html, /Open Facebook Marketplace/i);
      assert.match(html, /Facebook opens outside NK/i);
    }
    if (route === "/buy/vehicle/nk-market-2026-0825-01" || route === "/buy/vehicle/nk-market-2026-0825-05") {
      assert.match(html, /data-vehicle-detail-v2/i);
      assert.match(html, /data-vehicle-actions-v2/i);
      assert.match(html, /data-swipe-gallery/i);
      assert.match(textHtml, /1 of 6/i);
      assert.match(html, /aria-label="Next photo"/i);
      assert.match(html, /aria-label="Open photo 1 fullscreen"/i);
      assert.match(html, /Preview FX: THB 35\.00 = USD 1/i);
      const actionLabels = ["Save to NK", "Check Availability", "Ask NK AI", "Request Inspection", "Buy Through NK"];
      const actionPositions = actionLabels.map((label) => html.indexOf(label));
      assert.ok(actionPositions.every((position) => position >= 0), "all vehicle actions render");
      assert.deepEqual(actionPositions, [...actionPositions].sort((a, b) => a - b), "vehicle actions render in the approved order");
      assert.doesNotMatch(html, /Live Market Result/i);
    }
    if (route === "/buy/cases" || route === "/buy/cases/NK-CASE-2026-000001") {
      assert.match(html, /NK-CASE-2026-000001/i);
      assert.match(html, /2025 Toyota Hilux Revo 2\.8 4WD GR Sport Wide/i);
    }
  }
});

test("operating-system share target records its capture method and links the case atomically", () => {
  const listing = { ...presentCustomerListing(source), id: "shared-listing", demo: false };
  const capture = createExternalSourceCapture(listing, {
    submittedUrl: "https://www.facebook.com/share/1DF6CzLM1A/",
    canonicalUrl: "https://www.facebook.com/marketplace/item/1716607786274590/",
    captureMethod: "web_share_target",
    importStatus: "partial",
  }, "2026-08-24T02:00:00.000Z");
  const created = createVehicleCase(listing, [], "customer-1", "2026-08-24T02:01:00.000Z", capture.id);
  assert.equal(capture.captureMethod, "web_share_target");
  assert.equal(created.caseRecord.sourceCaptureId, capture.id);
});

test("Buying Browser exposes an installable operating-system share target", async () => {
  const manifest = JSON.parse(await import("node:fs/promises").then((fs) => fs.readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8")));
  assert.equal(manifest.share_target.action, "/buy/share");
  assert.equal(manifest.share_target.params.url, "url");
});

test("Google staging API fails closed without a runtime credential", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `google-fallback-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const statusResponse = await worker.fetch(new Request("http://localhost/api/buying-browser/sync-status"), env, ctx);
  assert.equal(statusResponse.status, 200);
  const status = await statusResponse.json();
  assert.deepEqual(status, {
    adapter: "google-sheet-drive",
    state: "not_connected",
    live: false,
    mode: "fallback",
    approvedVehicles: null,
    approvedMedia: null,
    synchronizedAt: null,
    fallbackActive: true,
  });
  assert.doesNotMatch(JSON.stringify(status), /1IXEZTH2|1TVQxbCQ|drive_file|source_url|seller/i);
  const mediaResponse = await worker.fetch(new Request("http://localhost/api/buying-browser/media/vehicle-approved/photo-01"), env, ctx);
  assert.equal(mediaResponse.status, 404);
});

test("renders captured and demo source records only in the owner view", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `buying-owner-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const anonymousResponse = await worker.fetch(new Request("http://localhost/buy/owner", { headers: { accept: "text/html" } }), env, ctx);
  assert.ok([302, 303, 307, 308].includes(anonymousResponse.status));
  assert.doesNotMatch(await anonymousResponse.text(), /NK-POC-2026-0001|facebook\.com\/marketplace\/item|Google Sheet|Evidence folder/i);
  const previousOwnerIds = process.env.NK_OWNER_ACCOUNT_IDS;
  process.env.NK_OWNER_ACCOUNT_IDS = "owner-account-id";
  const deniedResponse = await worker.fetch(new Request("http://localhost/buy/owner", { headers: { accept: "text/html", "oai-authenticated-user-id": "customer-account-id", "oai-authenticated-user-email": "customer@example.com" } }), env, ctx);
  assert.equal(deniedResponse.status, 404);
  const response = await worker.fetch(new Request("http://localhost/buy/owner", { headers: { accept: "text/html", "oai-authenticated-user-id": "owner-account-id", "oai-authenticated-user-email": "owner@example.com" } }), env, ctx);
  if (previousOwnerIds === undefined) delete process.env.NK_OWNER_ACCOUNT_IDS;
  else process.env.NK_OWNER_ACCOUNT_IDS = previousOwnerIds;
  assert.equal(response.status, 200);
  const html = await response.text();
  const textHtml = html.replaceAll("<!-- -->", "");
  assert.match(html, /data-buying-browser-owner-preview/i);
  assert.match(html, /Siam Pickup Demo/);
  assert.match(html, /NK-POC-2026-0001/);
  assert.match(html, /Google Sheet/);
  assert.match(html, /Eighteen original listing images/);
  assert.match(textHtml, /11 staged \/ 8 fallback demo/i);
  assert.match(html, /data-google-staging-status/i);
  assert.match(textHtml, /Google Sheet \+ Drive staging: Fallback active/i);
  assert.match(html, /NK-FB-2026-0825-01/);
  assert.match(html, /NK-FB-2026-0825-10/);
  assert.match(html, /Vehicle photo pending/i);
  assert.match(html, /Mileage conflict: 35,000 vs 36,000 km/i);
  assert.match(html, /Authenticated Owner access/i);
  assert.match(html, /Vehicle Case verification queue/i);
  assert.match(html, /No signed-in customer Vehicle Cases yet/i);
  assert.doesNotMatch(html, /\/vehicle-evidence\//i);
  assert.match(html, /NK fee settings/i);
  assert.match(html, /Platform &amp; Transaction component/i);
});

test("vehicle gallery provides an accessible swipeable fullscreen viewer", async () => {
  const { readFile } = await import("node:fs/promises");
  const component = await readFile(new URL("../app/buying-browser/screens/VehicleScreen.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/buying-browser/buying-browser.css", import.meta.url), "utf8");
  assert.match(component, /data-fullscreen-viewer/);
  assert.match(component, /role="dialog"/);
  assert.match(component, /aria-modal="true"/);
  assert.match(component, /Close fullscreen gallery/);
  assert.match(component, /event\.key === "Escape"/);
  assert.match(styles, /\.bb-photo-viewer\{[^}]*position:fixed/);
  assert.match(styles, /height:100dvh/);
  assert.match(styles, /\.bb-photo-viewer-track\{[^}]*scroll-snap-type:x mandatory/);
});

test("customer pricing component renders amount-only NK fee labels and inclusions", async () => {
  const { readFile } = await import("node:fs/promises");
  const component = await readFile(new URL("../app/buying-browser/components/PricingBreakdown.tsx", import.meta.url), "utf8");
  assert.match(component, /platformTransactionFee/);
  assert.match(component, /buyingServiceFee/);
  assert.match(component, /whatsIncluded/);
  assert.doesNotMatch(component, /commissionRate|% service fee|10%/i);
});

test("browser capture evidence remains private with ten real listings and 167 local images", async () => {
  const { readdir } = await import("node:fs/promises");
  const root = new URL("../private/vehicle-evidence/nk-capture-batch-2026-08-25/", import.meta.url);
  const listingFolders = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  const images = await Promise.all(listingFolders.map((entry) => readdir(new URL(`${entry.name}/`, root))));
  assert.equal(listingFolders.length, 10);
  assert.equal(images.flat().length, 167);
  assert.ok(images.every((files) => files.length >= 12));
});

test("customer marketplace exposes ten reviewed listings with only reviewed media", async () => {
  const { readFile, readdir } = await import("node:fs/promises");
  const moduleText = await readFile(new URL("../app/buying-browser/source-adapters/captured-customer-data.ts", import.meta.url), "utf8");
  const root = new URL("../public/vehicle-marketplace/owner-reviewed-2026-08-26/", import.meta.url);
  const listingFolders = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory() && entry.name.startsWith("nk-mkt-"));
  const images = await Promise.all(listingFolders.map((entry) => readdir(new URL(`${entry.name}/`, root))));

  assert.equal(listingFolders.length, 10);
  assert.equal(images.flat().length, 64);
  assert.equal(images.filter((files) => files.length === 7).length, 4);
  assert.equal(images.filter((files) => files.length === 6).length, 6);
  for (const secret of ["facebook.com", "sellerName", "sellerPhone", "sourceUrl", "nk-capture-batch-2026-08-25", "Pranee Pra Jaideaw", "080 632 3247"]) {
    assert.doesNotMatch(moduleText, new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});
