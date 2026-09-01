import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { createDataService } from "../deploy/qnap/data-service/server.mjs";
import { candidateMatchesRule, normalizeCandidateSubmission } from "../deploy/qnap/data-service/candidate-domain.mjs";
import { QnapMediaStore } from "../deploy/qnap/data-service/media-store.mjs";
import { normalizeJaklaenJobCompletion, normalizeJaklaenSearchRequest } from "../deploy/qnap/data-service/jaklaen-search-domain.mjs";
import {
  normalizeCommand,
  normalizeCompletion,
  normalizeHeartbeat,
  normalizeSourcingRule,
} from "../deploy/qnap/data-service/sourcing-domain.mjs";
import { allowedQnapIngressPath, qnapIngressAuthorized } from "../app/buying-browser/qnap-ingress.ts";
import { runQnapWorkerOnce } from "../marketplace-connector/qnap-worker.mjs";

const apiToken = "admin-token-that-is-at-least-32-characters-long";
const workerToken = "worker-token-that-is-different-and-32-characters";
const validRule = {
  name: "Toyota pickup 2020+ - Bangkok Metro",
  active: true,
  brand: "Toyota",
  model: "",
  bodyType: "pickup",
  yearFrom: 2020,
  yearTo: 2026,
  maxSourcePriceThb: 900000,
  dailyLimit: 10,
  priority: "normal",
  locations: ["Bangkok", "Nonthaburi"],
  requiredKeywords: ["pickup"],
  excludedKeywords: ["sold"],
  sourceAdapter: "facebook_marketplace",
  schedule: { timezone: "Asia/Bangkok", weekdays: ["mon", "tue"], startHour: 8, endHour: 20 },
};

const snapshot = {
  connected: true,
  hermesState: "ready",
  browserProfileState: "ready",
  queueDepth: 0,
  processedToday: 0,
  lastRunAt: null,
  lastHeartbeatAt: "2026-08-27T02:00:00.000Z",
  message: "Ready",
  rules: [],
};

const commandId = "775ba56b-c781-4c87-ae0c-a9c12164c6cf";
const ruleId = "423fd244-cf3c-4a3d-a63e-e702b5ca52a2";
const candidatePayload = {
  commandId,
  ruleId,
  candidate: {
    candidate_id: "cand_0123456789abcdef0123",
    brand: "Toyota",
    model: "Hilux Revo",
    year: 2022,
    transmission: "AT",
    drive_type: "2WD",
    body_type: "Double Cab pickup",
    mileage_km: 65000,
    source_price_thb: 765000,
    images: ["https://scontent.fbcdn.net/revo.jpg"],
    screenshots: ["https://www.facebook.com/photo.php?fbid=987654321"],
    confidence: 82,
    missing_fields: ["grade", "engine"],
    candidate_status: "NEEDS_REVIEW",
    source: {
      platform: "facebook_marketplace",
      source_url: "https://www.facebook.com/marketplace/item/123456789/",
      source_listing_id: "123456789",
      title: "2022 Toyota Hilux Revo pickup",
      listing_text: "Toyota Revo pickup Bangkok",
      seller: "Marketplace seller",
      location: "Bangkok, Thailand",
      observed_at: "2026-08-27T02:00:00.000Z",
    },
  },
};

function ownerHeaders(token = apiToken) {
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    "x-nk-actor-id": "owner-1",
    "x-nk-actor-email": "owner@example.com",
    "x-nk-actor-roles": "OWNER",
  };
}

async function withService(run) {
  const calls = [];
  const repository = {
    snapshot: async () => snapshot,
    createRule: async (rule, actor) => { calls.push({ method: "createRule", rule, actor }); return snapshot; },
    updateRule: async (id, rule, revision, actor) => { calls.push({ method: "updateRule", id, rule, revision, actor }); return snapshot; },
    enqueueCommand: async (command, actor) => { calls.push({ method: "enqueueCommand", command, actor }); return { ...snapshot, queueDepth: 1 }; },
    claimNext: async (workerId) => { calls.push({ method: "claimNext", workerId }); return null; },
    heartbeat: async (id, workerId, heartbeat) => { calls.push({ method: "heartbeat", id, workerId, heartbeat }); return { accepted: true }; },
    complete: async (id, workerId, completion) => { calls.push({ method: "complete", id, workerId, completion }); return { accepted: true }; },
    ingestCandidate: async (id, workerId, candidate) => { calls.push({ method: "ingestCandidate", id, workerId, candidate }); return { status: "retained", vehicleId: candidate.vehicleId, idempotent: false }; },
    attachCandidateMedia: async (vehicleId, media) => { calls.push({ method: "attachCandidateMedia", vehicleId, media }); return { stored: media.length }; },
    listJaklaenSearchRequests: async () => ({ observedAt: "2026-09-01T02:00:00.000Z", requests: [], jobs: [] }),
    createJaklaenSearchRequest: async (request, actor) => { calls.push({ method: "createJaklaenSearchRequest", request, actor }); return { accepted: true, requestId: "srch_test", queuedJobId: request.requestType === "SEARCH_NOW" ? commandId : null, published: false }; },
    claimNextJaklaenJob: async (workerId) => { calls.push({ method: "claimNextJaklaenJob", workerId }); return { id: commandId, requestId: "srch_test", jobType: "SEARCH_NOW", status: "CLAIMED" }; },
    completeJaklaenJob: async (jobId, workerId, completion) => { calls.push({ method: "completeJaklaenJob", jobId, workerId, completion }); return { accepted: true, published: false }; },
  };
  const pool = { query: async () => ({ rows: [{ ok: 1 }] }) };
  const mediaStore = { retainCandidateImages: async () => ({ media: [], failures: [{ index: 1, code: "image_unavailable" }] }) };
  const server = createDataService({ pool, apiToken, workerToken, sourcingRepository: repository, mediaStore });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await run({ baseUrl, calls });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("sourcing domain enforces approved scope and deterministic daily limits", () => {
  assert.deepEqual(normalizeSourcingRule(validRule), validRule);
  assert.deepEqual(normalizeSourcingRule({ ...validRule, locations: ["Phetchaburi"] }).locations, ["Phetchaburi"]);
  assert.throws(() => normalizeSourcingRule({ ...validRule, dailyLimit: 51 }), /invalid_daily_limit/);
  assert.throws(() => normalizeSourcingRule({ ...validRule, locations: ["Chiang Mai"] }), /invalid_locations/);
  assert.throws(() => normalizeSourcingRule({ ...validRule, sourceAdapter: "hidden_scraper" }), /invalid_source_rule_scope/);
  assert.throws(() => normalizeSourcingRule({ ...validRule, requiredKeywords: ["sold"], excludedKeywords: ["sold"] }), /conflicting_keywords/);
});

test("sourcing command and worker payloads reject unsupported actions and unsafe states", () => {
  const idempotencyKey = "df73ef9f-b5e0-4f12-91a4-30a2f70c95d8";
  assert.deepEqual(normalizeCommand({ action: "run_now", ruleId: null, idempotencyKey }), { action: "run_now", ruleId: null, idempotencyKey });
  assert.throws(() => normalizeCommand({ action: "bypass_login", idempotencyKey }), /invalid_hermes_action/);
  assert.deepEqual(normalizeHeartbeat({ browserProfileState: "login_required", processedIncrement: 0, message: "Facebook login is required." }), { browserProfileState: "login_required", processedIncrement: 0, message: "Facebook login is required." });
  assert.throws(() => normalizeCompletion({ state: "published", browserProfileState: "ready", message: "Done" }), /invalid_hermes_state/);
});

test("candidate ingestion normalizes confidential review data and enforces the active sourcing rule", () => {
  const candidate = normalizeCandidateSubmission(candidatePayload);
  assert.equal(candidate.vehicleId, "nk-auto-370aa049ce212e1ce994");
  assert.equal(candidate.internalRecord.visibility, "INTERNAL_ONLY");
  assert.equal(candidate.internalRecord.publicationStatus, "Needs Review");
  assert.equal(candidate.candidateStatus, "NEEDS_REVIEW");
  assert.deepEqual(candidate.missingFields, ["GRADE", "ENGINE"]);
  assert.equal(candidate.screenshots.length, 1);
  assert.equal(candidate.internalRecord.screenshotCount, 1);
  assert.equal(candidate.internalRecord.sourceUrl, candidatePayload.candidate.source.source_url);
  assert.deepEqual(candidateMatchesRule(candidate, validRule), { matches: true, failures: [] });
  assert.equal(candidateMatchesRule({ ...candidate, location: "Chiang Mai" }, validRule).matches, false);
  assert.equal(candidateMatchesRule({ ...candidate, location: "Phetchaburi, Thailand" }, { ...validRule, locations: ["Phetchaburi"] }).matches, true);
  assert.throws(() => normalizeCandidateSubmission({ ...candidatePayload, candidate: { ...candidatePayload.candidate, source: { ...candidatePayload.candidate.source, source_url: "https://example.com/marketplace/item/1" } } }), /invalid_candidate_source_url/);
  assert.throws(() => normalizeCandidateSubmission({ ...candidatePayload, candidate: { ...candidatePayload.candidate, candidate_status: "PUBLISHED" } }), /candidate_auto_publish_forbidden/);
});

test("Jaklaen Search Request domain separates SEARCH_NOW, STANDING_SEARCH, and Customer permissions", () => {
  const actor = { id: "owner-1", email: "owner@example.com", roles: ["OWNER"] };
  const payload = {
    requestType: "SEARCH_NOW",
    idempotencyKey: "search-now-test-001",
    priority: "high",
    customerCaseReference: "CASE-001",
    criteria: {
      make: "Toyota",
      model: "Hilux Revo",
      grade: "",
      yearFrom: 2020,
      yearTo: 2026,
      transmission: "AT",
      engineFuel: "",
      driveType: "4WD",
      color: "",
      maxPriceThb: 850000,
      maxMileageKm: 120000,
      location: "Bangkok Metro",
      radiusKm: 120,
      quantityRequired: 3,
      sources: ["facebook_marketplace", "facebook_group"],
    },
  };
  const normalized = normalizeJaklaenSearchRequest(payload, actor);
  assert.equal(normalized.requestType, "SEARCH_NOW");
  assert.equal(normalized.criteria.grade, "UNKNOWN");
  assert.equal(normalized.criteria.engineFuel, "PENDING");
  assert.equal(normalized.requestedBy.role, "OWNER");
  assert.throws(() => normalizeJaklaenSearchRequest({ ...payload, requestType: "STANDING_SEARCH" }, { id: "customer-1", email: "buyer@example.com", roles: ["CUSTOMER"] }), /customer_standing_search_forbidden/);
  assert.deepEqual(normalizeJaklaenJobCompletion({ status: "BLOCKED", blockedReason: "CAPTCHA", listingsFound: 0, candidatesReturned: 0, message: "CAPTCHA encountered; stopped." }).blockedReason, "CAPTCHA");
});

test("admin sourcing API requires the server token and an independent Owner role", async () => {
  await withService(async ({ baseUrl }) => {
    assert.equal((await fetch(`${baseUrl}/v1/admin/sourcing`)).status, 401);
    const customer = await fetch(`${baseUrl}/v1/admin/sourcing`, { headers: { ...ownerHeaders(), "x-nk-actor-roles": "CUSTOMER" } });
    assert.equal(customer.status, 403);
    assert.deepEqual(await customer.json(), { error: "owner_role_required" });
    const owner = await fetch(`${baseUrl}/v1/admin/sourcing`, { headers: ownerHeaders() });
    assert.equal(owner.status, 200);
    assert.equal((await owner.json()).connected, true);
  });
});

test("admin rule and command endpoints pass normalized records to the repository", async () => {
  await withService(async ({ baseUrl, calls }) => {
    const created = await fetch(`${baseUrl}/v1/admin/sourcing/rules`, { method: "POST", headers: ownerHeaders(), body: JSON.stringify({ rule: validRule, expectedRevision: 0 }) });
    assert.equal(created.status, 201);
    const idempotencyKey = "df73ef9f-b5e0-4f12-91a4-30a2f70c95d8";
    const queued = await fetch(`${baseUrl}/v1/admin/sourcing/commands`, { method: "POST", headers: ownerHeaders(), body: JSON.stringify({ action: "run_now", ruleId: null, idempotencyKey }) });
    assert.equal(queued.status, 202);
    assert.equal((await queued.json()).queueDepth, 1);
    assert.equal(calls[0].method, "createRule");
    assert.equal(calls[0].actor.id, "owner-1");
    assert.equal(calls[1].method, "enqueueCommand");
    assert.equal(calls[1].command.action, "run_now");
  });
});

test("Data API serves strict Owner inventory records and visibility-gated media", async () => {
  const pool = {
    query: async (sql, params = []) => {
      if (sql.includes("FROM inventory_vehicles ORDER BY")) return { rows: [{ vehicle_id: "nk-auto-test", source_reference: "FB-MKT-1", publication_status: "NEEDS_REVIEW", customer_record: null, internal_record: { vehicleId: "nk-auto-test" }, source_adapter: "facebook_marketplace_worker", observed_at: new Date("2026-08-27T02:00:00Z") }] };
      if (sql.includes("FROM vehicle_media WHERE vehicle_id IS NOT NULL")) return { rows: [{ media_id: "nk-auto-test:auto-001", vehicle_id: "nk-auto-test", visibility: "INTERNAL_ONLY" }] };
      if (sql.includes("FROM vehicle_media m")) {
        const requestedVisibility = params[2];
        if (requestedVisibility === "CUSTOMER_VISIBLE") return { rows: [] };
        return { rows: [{ relative_path: "automated/nk-auto-test/001.jpg", visibility: "INTERNAL_ONLY", sha256: "a".repeat(64) }] };
      }
      return { rows: [{ ok: 1 }] };
    },
  };
  const mediaStore = { read: async () => Buffer.from([0xff, 0xd8, 0xff, 0xd9]) };
  const server = createDataService({ pool, apiToken, workerToken, sourcingRepository: {}, mediaStore });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const records = await fetch(`${baseUrl}/v1/admin/inventory-records`, { headers: { authorization: `Bearer ${apiToken}` } });
    assert.equal(records.status, 200);
    const payload = await records.json();
    assert.equal(payload.records[0].publicationStatus, "NEEDS_REVIEW");
    assert.deepEqual(payload.records[0].media, [{ mediaId: "nk-auto-test:auto-001", visibility: "INTERNAL_ONLY" }]);
    const customerMedia = await fetch(`${baseUrl}/v1/public/media/nk-auto-test/nk-auto-test%3Aauto-001`, { headers: { authorization: `Bearer ${apiToken}` } });
    assert.equal(customerMedia.status, 404, "internal evidence never crosses the customer media endpoint");
    const ownerMedia = await fetch(`${baseUrl}/v1/admin/media/nk-auto-test/nk-auto-test%3Aauto-001`, { headers: { authorization: `Bearer ${apiToken}` } });
    assert.equal(ownerMedia.status, 200);
    assert.equal(ownerMedia.headers.get("cache-control"), "private, no-store");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("worker endpoints use a distinct token and never accept Owner credentials", async () => {
  await withService(async ({ baseUrl, calls }) => {
    const rejected = await fetch(`${baseUrl}/v1/worker/sourcing/commands/claim`, { method: "POST", headers: { authorization: `Bearer ${apiToken}`, "x-nk-worker-id": "hermes-qnap" } });
    assert.equal(rejected.status, 401);
    const claimed = await fetch(`${baseUrl}/v1/worker/sourcing/commands/claim`, { method: "POST", headers: { authorization: `Bearer ${workerToken}`, "x-nk-worker-id": "hermes-qnap" } });
    assert.equal(claimed.status, 200);
    assert.deepEqual(await claimed.json(), { command: null });
    assert.deepEqual(calls[0], { method: "claimNext", workerId: "hermes-qnap" });
  });
});

test("worker candidate endpoint retains only a review record and reports partial media safely", async () => {
  await withService(async ({ baseUrl, calls }) => {
    const response = await fetch(`${baseUrl}/v1/worker/sourcing/candidates`, {
      method: "POST",
      headers: { authorization: `Bearer ${workerToken}`, "content-type": "application/json", "x-nk-worker-id": "hermes-qnap" },
      body: JSON.stringify(candidatePayload),
    });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.status, "retained");
    assert.deepEqual(payload.media, { stored: 0, failed: 1, failures: [{ index: 1, code: "image_unavailable" }] });
    assert.equal(calls[0].method, "ingestCandidate");
    assert.equal(calls[0].candidate.internalRecord.visibility, "INTERNAL_ONLY");
    assert.equal(calls[1].method, "attachCandidateMedia");
  });
});

test("Jaklaen app queue API creates SEARCH_NOW jobs and lets the worker claim and complete them", async () => {
  await withService(async ({ baseUrl, calls }) => {
    const searchRequest = {
      requestType: "SEARCH_NOW",
      idempotencyKey: "search-now-test-002",
      priority: "high",
      customerCaseReference: "CASE-REVO-002",
      criteria: {
        make: "Toyota",
        model: "Hilux Revo",
        grade: "UNKNOWN",
        yearFrom: 2020,
        yearTo: 2026,
        transmission: "AT",
        engineFuel: "Diesel",
        driveType: "4WD",
        color: "Any",
        maxPriceThb: 850000,
        maxMileageKm: 120000,
        location: "Bangkok Metro",
        radiusKm: 120,
        quantityRequired: 3,
        sources: ["facebook_marketplace"],
      },
    };
    const created = await fetch(`${baseUrl}/v1/admin/jaklaen/search-requests`, { method: "POST", headers: ownerHeaders(), body: JSON.stringify(searchRequest) });
    assert.equal(created.status, 201);
    assert.equal((await created.json()).queuedJobId, commandId);
    const claimed = await fetch(`${baseUrl}/v1/worker/jaklaen/jobs/claim`, { method: "POST", headers: { authorization: `Bearer ${workerToken}`, "x-nk-worker-id": "jaklaen-hermes" } });
    assert.equal(claimed.status, 200);
    assert.equal((await claimed.json()).job.status, "CLAIMED");
    const completed = await fetch(`${baseUrl}/v1/worker/jaklaen/jobs/${commandId}/complete`, {
      method: "POST",
      headers: { authorization: `Bearer ${workerToken}`, "content-type": "application/json", "x-nk-worker-id": "jaklaen-hermes" },
      body: JSON.stringify({ status: "COMPLETED", listingsFound: 4, candidatesReturned: 1, message: "One candidate returned for NEEDS_REVIEW." }),
    });
    assert.equal(completed.status, 200);
    assert.equal((await completed.json()).published, false);
    assert.equal(calls.find((call) => call.method === "createJaklaenSearchRequest").request.requestType, "SEARCH_NOW");
    assert.equal(calls.find((call) => call.method === "claimNextJaklaenJob").workerId, "jaklaen-hermes");
    assert.equal(calls.find((call) => call.method === "completeJaklaenJob").completion.candidatesReturned, 1);
  });
});

test("Jaklaen worker alias and Owner review endpoint keep candidates internal-only", async () => {
  await withService(async ({ baseUrl, calls }) => {
    const received = await fetch(`${baseUrl}/v1/worker/jaklaen/candidates`, {
      method: "POST",
      headers: { authorization: `Bearer ${workerToken}`, "content-type": "application/json", "x-nk-worker-id": "jaklaen-hermes" },
      body: JSON.stringify(candidatePayload),
    });
    assert.equal(received.status, 201);
    assert.equal(calls[0].method, "ingestCandidate");
    assert.equal(calls[0].workerId, "jaklaen-hermes");
    assert.equal(calls[0].candidate.internalRecord.candidateStatus, "NEEDS_REVIEW");
  });

  const calls = [];
  const repository = {
    listJaklaenCandidates: async () => ({ observedAt: "2026-09-01T01:00:00.000Z", records: [] }),
    reviewJaklaenCandidate: async (vehicleId, mutation, actor) => {
      calls.push({ vehicleId, mutation, actor });
      return { vehicleId, publicationStatus: "NEEDS_REVIEW", candidateStatus: mutation.action, published: false };
    },
  };
  const pool = { query: async () => ({ rows: [{ ok: 1 }] }) };
  const server = createDataService({ pool, apiToken, workerToken, sourcingRepository: repository });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    const listed = await fetch(`http://127.0.0.1:${address.port}/v1/admin/jaklaen/candidates`, { headers: ownerHeaders() });
    assert.equal(listed.status, 200);
    const reviewed = await fetch(`http://127.0.0.1:${address.port}/v1/admin/jaklaen/candidates/nk-auto-test/review`, {
      method: "POST",
      headers: ownerHeaders(),
      body: JSON.stringify({ action: "APPROVED", note: "Owner approved candidate for next internal workflow only." }),
    });
    assert.equal(reviewed.status, 200);
    assert.deepEqual(await reviewed.json(), { vehicleId: "nk-auto-test", publicationStatus: "NEEDS_REVIEW", candidateStatus: "APPROVED", published: false });
    assert.equal(calls[0].mutation.action, "APPROVED");
    assert.equal(calls[0].actor.id, "owner-1");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("QNAP media store re-encodes permitted source images into the internal-only root", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "nk-media-test-"));
  try {
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#123456" } }).png().toBuffer();
    const store = new QnapMediaStore({
      customerRoot: path.join(root, "customer"),
      internalRoot: path.join(root, "internal"),
      fetchImpl: async () => new Response(png, { status: 200, headers: { "content-type": "image/png" } }),
    });
    const candidate = normalizeCandidateSubmission(candidatePayload);
    const retained = await store.retainCandidateImages(candidate);
    assert.equal(retained.media.length, 2);
    assert.equal(retained.media[0].visibility, "INTERNAL_ONLY");
    assert.match(retained.media[0].relativePath, /^automated\/nk-auto-/);
    assert.equal(retained.media[1].lifecycleStage, "Evidence");
    assert.equal((await store.read(retained.media[0].relativePath, "INTERNAL_ONLY")).subarray(0, 2).toString("hex"), "ffd8");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("deterministic QNAP worker bridge claims, searches, retains candidates, and completes without external messages", async () => {
  const calls = [];
  let runPolls = 0;
  const fetchImpl = async (url, options = {}) => {
    const pathname = new URL(url).pathname;
    calls.push({ pathname, method: options.method || "GET", body: options.body ? JSON.parse(options.body) : null });
    if (pathname.endsWith("/commands/claim")) return Response.json({ command: { id: commandId, action: "run_now", ruleId, rule: validRule } });
    if (pathname.endsWith("/v1/search-runs") && options.method === "POST") return Response.json({ run_id: "run_775ba56b-c781-4c87-ae0c-a9c12164c6cf", status: "queued" }, { status: 202 });
    if (pathname.endsWith("/heartbeat")) return Response.json({ accepted: true });
    if (pathname.includes("/v1/search-runs/run_")) {
      runPolls += 1;
      return Response.json({ status: "completed", listings_found: 3, candidate_count: 1, rejected: 2, candidates: [candidatePayload.candidate] });
    }
    if (pathname.endsWith("/sourcing/candidates")) return Response.json({ status: "retained", vehicleId: "nk-auto-test", media: { stored: 1, failed: 0 } }, { status: 201 });
    if (pathname.endsWith("/complete")) return Response.json({ accepted: true });
    return Response.json({ error: "unexpected_request" }, { status: 500 });
  };
  const config = { qnapUrl: "http://qnap.internal", qnapToken: workerToken, connectorUrl: "http://127.0.0.1:4317", connectorToken: "connector-token-that-is-at-least-32-characters", workerId: "hermes-qnap", profileId: "fb-buyer-01", pollIntervalMs: 30_000 };
  const result = await runQnapWorkerOnce(config, fetchImpl);
  assert.deepEqual(result, {
    status: "completed",
    commandId,
    retained: 1,
    duplicates: 0,
    listingsFound: 3,
    connectorCandidates: 1,
    rejected: 2,
    retainedVehicleIds: ["nk-auto-test"],
  });
  assert.equal(runPolls, 1);
  assert.equal(calls.find((call) => call.pathname.endsWith("/sourcing/candidates")).body.ruleId, ruleId);
  const completion = calls.find((call) => call.pathname.endsWith("/complete")).body;
  assert.equal(completion.processedIncrement, 0, "candidate retention is the sole daily counter authority");
  assert.match(completion.message, /3 listings inspected, 1 connector candidates/);
});

test("Data API can deploy before worker authorization without exposing worker endpoints", async () => {
  const pool = { query: async () => ({ rows: [{ ok: 1 }] }) };
  const server = createDataService({ pool, apiToken, workerToken: "", sourcingRepository: {} });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/worker/sourcing/commands/claim`, { method: "POST" });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "worker_not_configured" });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("QNAP HTTPS ingress exposes only the bounded Data API allowlist", () => {
  assert.equal(allowedQnapIngressPath("/v1/public/listings"), true);
  assert.equal(allowedQnapIngressPath("/v1/admin/sourcing"), true);
  assert.equal(allowedQnapIngressPath("/v1/admin/sourcing/rules/df73ef9f-b5e0-4f12-91a4-30a2f70c95d8"), true);
  assert.equal(allowedQnapIngressPath("/v1/admin/jaklaen/candidates"), true);
  assert.equal(allowedQnapIngressPath("/v1/admin/jaklaen/candidates/nk-auto-test/review"), true);
  assert.equal(allowedQnapIngressPath("/v1/admin/jaklaen/search-requests"), true);
  assert.equal(allowedQnapIngressPath("/v1/worker/sourcing/commands/claim"), false);
  assert.equal(allowedQnapIngressPath("/v1/worker/jaklaen/jobs/claim"), false);
  assert.equal(allowedQnapIngressPath("/v1/worker/jaklaen/candidates"), false);
  assert.equal(allowedQnapIngressPath("/v1/admin/media/internal-secret"), false);
  assert.equal(allowedQnapIngressPath("/v1/admin/sourcing/../media"), false);
  assert.equal(qnapIngressAuthorized(`Bearer ${apiToken}`, apiToken), true);
  assert.equal(qnapIngressAuthorized(`Bearer ${workerToken}`, apiToken), false);
});

test("QNAP sourcing schema is append-only and deployment migrates existing volumes", async () => {
  const [schema, candidateSchema, jaklaenReviewSchema, jaklaenQueueSchema, compose, deployment] = await Promise.all([
    fs.readFile(new URL("../deploy/qnap/postgres/init/020_sourcing_automation.sql", import.meta.url), "utf8"),
    fs.readFile(new URL("../deploy/qnap/postgres/init/030_candidate_ingestion.sql", import.meta.url), "utf8"),
    fs.readFile(new URL("../deploy/qnap/postgres/init/040_jaklaen_candidate_review.sql", import.meta.url), "utf8"),
    fs.readFile(new URL("../deploy/qnap/postgres/init/050_jaklaen_search_queue.sql", import.meta.url), "utf8"),
    fs.readFile(new URL("../deploy/qnap/docker-compose.full.yml", import.meta.url), "utf8"),
    fs.readFile(new URL("../deploy/qnap/deploy-full.sh", import.meta.url), "utf8"),
  ]);
  assert.match(schema, /sourcing_rule_audit_events/);
  assert.match(schema, /sourcing_command_events/);
  assert.match(schema, /ON DELETE RESTRICT/);
  assert.match(schema, /REVOKE DELETE/);
  assert.doesNotMatch(schema, /GRANT ALL/);
  assert.match(candidateSchema, /sourcing_candidate_ingestions/);
  assert.match(candidateSchema, /outcome IN \('RETAINED', 'DUPLICATE'\)/);
  assert.match(candidateSchema, /REVOKE DELETE, UPDATE/);
  assert.match(jaklaenReviewSchema, /jaklaen_candidate_review_events/);
  assert.match(jaklaenReviewSchema, /REVOKE DELETE, UPDATE/);
  assert.match(jaklaenQueueSchema, /jaklaen_search_requests/);
  assert.match(jaklaenQueueSchema, /jaklaen_search_jobs/);
  assert.match(jaklaenQueueSchema, /jaklaen_search_audit_events/);
  assert.match(jaklaenQueueSchema, /CUSTOMER/);
  assert.match(jaklaenQueueSchema, /ON DELETE RESTRICT/);
  assert.match(jaklaenQueueSchema, /REVOKE DELETE/);
  assert.match(compose, /NK_HERMES_WORKER_TOKEN:\s+"\$\{NK_HERMES_WORKER_TOKEN:-\}"/);
  assert.match(compose, /internal-only:\/data\/media\/internal-only/);
  assert.match(compose, /customer-visible:\/data\/media\/customer-visible:ro/);
  assert.doesNotMatch(compose, /NK_HERMES_WORKER_TOKEN:\s+[A-Za-z0-9_-]{32}/);
  assert.match(deployment, /020_sourcing_automation\.sql/);
  assert.match(deployment, /030_candidate_ingestion\.sql/);
  assert.match(deployment, /040_jaklaen_candidate_review\.sql/);
  assert.match(deployment, /050_jaklaen_search_queue\.sql/);
  assert.match(deployment, /psql -v ON_ERROR_STOP=1/);
  assert.doesNotMatch(deployment, /PASSWORD=/);
});
