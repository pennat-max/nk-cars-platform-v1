import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_FILTERS,
  addCaseQuestion,
  calculatePricing,
  createExternalSourceCapture,
  createVehicleCase,
  filterListings,
  inspectionQuoteForLocation,
  presentCustomerListing,
  requestAvailability,
  requestInspection,
} from "../app/buying-browser/domain.mjs";

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
  assert.deepEqual(filterListings([customer, second], { ...DEFAULT_FILTERS, transmission: "MT" }).map((item) => item.id), ["listing-2"]);
  assert.deepEqual(filterListings([customer, second], { ...DEFAULT_FILTERS, body: "Double Cab", sort: "price-low" }).map((item) => item.id), ["listing-1"]);
});

test("pricing applies commission only to vehicle purchase price", () => {
  const result = calculatePricing({ vehiclePriceThb: 900000, commissionRate: 10, inspectionTravelThb: 3500, domesticTransportThb: 10000, repairModificationThb: 20000, exportShippingThb: 50000, otherAgreedThb: null });
  assert.equal(result.commissionAmountThb, 90000);
  assert.equal(result.knownSubtotalThb, 1_073_500);
  assert.equal(result.pendingCount, 1);
  assert.equal(result.lines.find((line) => line.key === "other")?.status, "Pending");
});

test("inspection quote uses deterministic configured location zones", () => {
  assert.deepEqual(inspectionQuoteForLocation("Bangkok, Thailand"), { region: "Bangkok Metro", baseFeeThb: 2900, travelFeeThb: 600, totalThb: 3500, status: "Quote Ready" });
  assert.equal(inspectionQuoteForLocation("Unknown province"), null);
});

test("Vehicle Case deduplicates save and records honest pending workflows", () => {
  const listing = presentCustomerListing(source);
  const created = createVehicleCase(listing, [], "customer-1", "2026-08-23T10:00:00.000Z");
  assert.equal(created.created, true);
  assert.equal(created.caseRecord.id, "NK-CASE-2026-001245");
  assert.equal(created.caseRecord.sourceCaptureId, null);
  assert.equal(created.caseRecord.availability, "Availability Not Yet Confirmed");
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

test("external Facebook handoff captures the source internally and links it to a customer-safe case", () => {
  const listing = { ...presentCustomerListing(source), demo: false };
  const capture = createExternalSourceCapture(listing, {
    submittedUrl: "https://www.facebook.com/share/1DF6CzLM1A/",
    canonicalUrl: "https://www.facebook.com/marketplace/item/1716607786274590/",
    sourcePlatform: "Facebook Marketplace",
    captureMethod: "external_share_link",
    importStatus: "partial",
  }, "2026-08-24T01:00:00.000Z");
  const created = createVehicleCase(listing, [], "customer-1", "2026-08-24T01:01:00.000Z", capture.id);
  assert.equal(capture.listingId, listing.id);
  assert.equal(capture.canonicalUrl, "https://www.facebook.com/marketplace/item/1716607786274590/");
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
  const routes = ["/buy", "/buy/browser", "/buy/browse", "/buy/saved", "/buy/paste", "/buy/share", "/buy/ask", "/buy/cases", "/buy/cases/NK-CASE-2026-000001", "/buy/inspections", "/buy/messages", "/buy/account", "/buy/vehicle/th-demo-001", "/buy/vehicle/nk-poc-2026-0001"];
  for (const route of routes) {
    const response = await worker.fetch(new Request(`http://localhost${route}`, { headers: { accept: "text/html" } }), env, ctx);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.match(html, /data-buying-browser-v1/i, route);
    assert.doesNotMatch(html, /Siam Pickup Demo|\+66 81 000 0101|example\.invalid\/internal|Demo partner feed|Bang Kapi/i, route);
    assert.doesNotMatch(html, /facebook\.com\/marketplace\/item\/1716607786274590|1IXEZTH2EYcIeM6HQKJ2Qfk4LZYsVWu4ipNolXoTnxhw|1oR6RF0CZpokbnEcWQ7iMtWiplnskWEB1/i, route);
    if (route === "/buy") {
      assert.match(html, /data-real-source-launch/i);
      assert.match(html, /Browse real Facebook Marketplace/i);
      assert.doesNotMatch(html, /data-vehicle-card-v2/i);
    }
    if (route === "/buy/browse") {
      assert.match(html, /data-browse-marketplace-v2/i);
      assert.match(html, /data-vehicle-card-v2/i);
      assert.match(html, /2025 Toyota Hilux Revo 2\.8 4WD GR Sport Wide/i);
      assert.match(html, /1 captured/i);
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
    if (route === "/buy/vehicle/th-demo-001" || route === "/buy/vehicle/nk-poc-2026-0001") {
      assert.match(html, /data-vehicle-detail-v2/i);
      assert.match(html, /data-vehicle-actions-v2/i);
      const actionLabels = [route.includes("nk-poc") ? "Saved" : "Save Vehicle", "Ask NK AI", "Check Availability", "Request Inspection", "Buy Through NK"];
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

test("renders captured and demo source records only in the owner view", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `buying-owner-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("http://localhost/buy/owner", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /data-buying-browser-owner-preview/i);
  assert.match(html, /Siam Pickup Demo/);
  assert.match(html, /NK-POC-2026-0001/);
  assert.match(html, /Google Sheet/);
  assert.match(html, /Eighteen original listing images/);
  assert.match(html, /Preview \/ not an auth boundary/i);
});
