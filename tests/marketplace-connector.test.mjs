import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { BrowserProfileManager } from "../marketplace-connector/browser-profile-manager.mjs";
import {
  candidateMatchesRequest,
  normalizeCandidate,
  normalizeSearchRequest,
} from "../marketplace-connector/contracts.mjs";
import { SearchQueue } from "../marketplace-connector/search-queue.mjs";
import { createConnectorServer } from "../marketplace-connector/server.mjs";
import { validateFacebookUrl } from "../marketplace-connector/url-policy.mjs";

const token = "test-connector-token-0123456789-abcdef";

test("validates Facebook-only source URLs", () => {
  assert.equal(
    validateFacebookUrl("https://www.facebook.com/share/abc/?mibextid=test#fragment"),
    "https://www.facebook.com/share/abc/?mibextid=test",
  );
  assert.throws(() => validateFacebookUrl("http://www.facebook.com/marketplace/item/1"), /invalid_url/);
  assert.throws(() => validateFacebookUrl("https://facebook.com.example.com/marketplace/item/1"), /invalid_url/);
  assert.throws(() => validateFacebookUrl("https://user:pass@facebook.com/marketplace/item/1"), /invalid_url/);
});

test("normalizes hard search requirements and customer-safe candidates", () => {
  const request = normalizeSearchRequest({
    query: "Toyota Revo for export",
    brand: "Toyota",
    model: "Hilux Revo",
    year_from: 2020,
    year_to: 2023,
    transmission: "A/T",
    drive_type: "4x4",
    maximum_source_price_thb: 800_000,
    required_keywords: ["Rocco"],
    excluded_keywords: ["sold"],
  });
  assert.equal(request.transmission, "AT");
  assert.equal(request.drive_type, "4WD");
  assert.equal(request.year_from, 2020);
  assert.throws(() => normalizeSearchRequest({ query: "Revo", transmission: "CVT" }), /invalid_search_request/);

  const candidate = normalizeCandidate({
    source_url: "https://www.facebook.com/marketplace/item/123456789/",
    title: "2023 Toyota Hilux Revo Rocco 2.4 A/T 4WD Double Cab",
    listing_text: "Mileage 65,454. THB 765,000. Rocco. Seller phone 081-234-5678",
    seller: "Internal Seller",
    location: "Bangkok",
    images: ["https://scontent.fbcdn.net/revo.jpg"],
  }, { search_request_id: request.request_id, search_run_id: "run_test" });

  assert.equal(candidate.brand, "Toyota");
  assert.equal(candidate.model, "Hilux Revo");
  assert.equal(candidate.year, 2023);
  assert.equal(candidate.transmission, "AT");
  assert.equal(candidate.drive_type, "4WD");
  assert.equal(candidate.source_price_thb, 765000);
  assert.equal(candidate.source.seller, "Internal Seller");
  const customerJson = JSON.stringify(candidate.customer_result);
  assert.doesNotMatch(customerJson, /Internal Seller|facebook|081-234-5678|765000|Bangkok/i);
  assert.match(customerJson, /Availability and final price require NK verification/);
  assert.deepEqual(candidateMatchesRequest(candidate, request), { matches: true, failures: [] });

  const canonicalOnly = normalizeCandidate({
    canonical_url: "https://www.facebook.com/marketplace/item/987654321/",
    title: "2022 Toyota Hilux Revo pickup",
    listing_text: "Toyota Revo pickup",
  });
  assert.equal(canonicalOnly.source.source_url, "https://www.facebook.com/marketplace/item/987654321/");
});

test("runs searches one at a time and records safe telemetry", async () => {
  const queue = new SearchQueue({ minimumIntervalMs: 0, requestsPerMinute: 60, runTimeoutMs: 2_000 });
  let active = 0;
  let maximumActive = 0;
  const executionOrder = [];
  const execute = (name) => async () => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    executionOrder.push(name);
    await new Promise((resolve) => setTimeout(resolve, 20));
    active -= 1;
    return { listings_found: 1, candidates: [{ candidate_id: `cand_${name}` }] };
  };

  const first = queue.enqueue({ request: { request_id: "req_1" }, profileId: "fb-buyer-01", execute: execute("first") });
  const second = queue.enqueue({ request: { request_id: "req_2" }, profileId: "fb-buyer-01", execute: execute("second") });
  await queue.waitForIdle();

  assert.equal(maximumActive, 1);
  assert.deepEqual(executionOrder, ["first", "second"]);
  assert.equal(queue.getRun(first.run_id).status, "completed");
  assert.equal(queue.getRun(second.run_id).candidate_count, 1);
});

test("stops a queue run when Facebook requires login", async () => {
  const queue = new SearchQueue({ minimumIntervalMs: 0, requestsPerMinute: 60, runTimeoutMs: 2_000 });
  const run = queue.enqueue({
    request: { request_id: "req_login" },
    profileId: "fb-buyer-01",
    execute: async () => { throw new Error("facebook_login_required"); },
  });
  await queue.waitForIdle();
  assert.equal(queue.getRun(run.run_id).status, "login_required");
  assert.equal(queue.getRun(run.run_id).error_code, "facebook_login_required");
});

test("tracks authorized browser profile state without exposing session data", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "nk-profile-manager-test-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const page = { close: async () => undefined };
  const context = {
    cookies: async () => [{ name: "c_user", value: "secret" }, { name: "xs", value: "secret" }],
    newPage: async () => page,
    close: async () => undefined,
    on() {},
    setDefaultNavigationTimeout() {},
    setDefaultTimeout() {},
  };
  const manager = new BrowserProfileManager({
    profiles: [{ id: "fb-buyer-01", directory, channel: "chrome" }],
    browserType: { launchPersistentContext: async () => context },
  });

  const checked = await manager.checkSession("fb-buyer-01");
  assert.equal(checked.state, "ready");
  assert.doesNotMatch(JSON.stringify(checked), /secret|cookie|directory/i);

  await assert.rejects(
    () => manager.withPage("fb-buyer-01", async () => ({ state: "login_required" })),
    /facebook_login_required/,
  );
  assert.equal(manager.getStatus("fb-buyer-01").state, "login_required");
});

test("reuses an authorized loopback CDP browser without copying or closing its profile", async () => {
  let connectedTo = "";
  let closed = false;
  const page = { close: async () => undefined };
  const context = {
    cookies: async () => [{ name: "c_user", value: "not-returned" }, { name: "xs", value: "not-returned" }],
    newPage: async () => page,
    close: async () => { closed = true; },
    setDefaultNavigationTimeout() {},
    setDefaultTimeout() {},
  };
  const manager = new BrowserProfileManager({
    profiles: [{ id: "fb-buyer-01", directory: os.tmpdir(), cdpEndpoint: "http://127.0.0.1:9223" }],
    browserType: {
      connectOverCDP: async (endpoint) => {
        connectedTo = endpoint;
        return { contexts: () => [context] };
      },
    },
  });

  assert.equal((await manager.checkSession("fb-buyer-01")).state, "ready");
  assert.equal(connectedTo, "http://127.0.0.1:9223");
  await manager.withPage("fb-buyer-01", async () => ({ state: "ok" }));
  await manager.closeAll();
  assert.equal(closed, false);
});

test("protects the local connector and supports search plus legacy listing import", async (t) => {
  const profileManager = {
    listProfiles: () => [{ profile_id: "fb-buyer-01", state: "ready" }],
    addProfile: (profile) => ({ profile_id: profile.id, label: profile.label, state: "login_required" }),
    checkSession: async () => ({ profile_id: "fb-buyer-01", state: "ready" }),
    getStatus: (id) => ({ profile_id: id, state: "login_required" }),
    setState: (_id, state) => ({ profile_id: "fb-buyer-01", state }),
    closeProfile: async () => undefined,
    openInteractiveLogin: async () => ({ waitForSession: async () => ({ profile_id: "fb-buyer-01", state: "ready" }) }),
  };
  const candidate = normalizeCandidate({
    source_url: "https://www.facebook.com/marketplace/item/123456789/",
    title: "2023 Toyota Hilux Revo A/T 4WD",
    listing_text: "THB 765,000",
  });
  const adapter = {
    profileId: "fb-buyer-01",
    search: async (request) => ({ listings_found: 4, rejected: 1, duplicates: 1, candidates: [{ ...candidate, search_request_id: request.request_id }] }),
    openListing: async () => ({
      state: "ok",
      canonical_url: "https://www.facebook.com/marketplace/item/123456789/",
      title: "2023 Toyota Hilux Revo",
      listing_text: "2023 Toyota Hilux Revo A/T 4WD",
      source_price: "765000",
      seller: "Internal Seller",
      location: "Bangkok",
      images: [
        "https://scontent.fbcdn.net/revo-1.jpg",
        "https://scontent.fbcdn.net/revo-2.jpg",
      ],
      expected_image_count: 2,
      gallery_complete: true,
    }),
  };
  const queue = new SearchQueue({ minimumIntervalMs: 0, requestsPerMinute: 60, runTimeoutMs: 2_000 });
  const server = createConnectorServer({ token, adapter, profileManager, queue, logger: { warn() {} } });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "ok");

  const unauthorized = await fetch(`${baseUrl}/v1/profiles`);
  assert.equal(unauthorized.status, 401);

  const addedProfile = await fetch(`${baseUrl}/v1/profiles`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ profile_id: "fb-buyer-02", label: "Facebook Buyer 02" }),
  });
  assert.equal(addedProfile.status, 201);
  assert.equal((await addedProfile.json()).profile_id, "fb-buyer-02");

  const rejectedCredential = await fetch(`${baseUrl}/v1/profiles/fb-buyer-01/login`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ password: "never-send-this" }),
  });
  assert.equal(rejectedCredential.status, 422);
  assert.equal((await rejectedCredential.json()).safe_reason_code, "credential_entry_not_supported");

  const openedLogin = await fetch(`${baseUrl}/v1/profiles/fb-buyer-01/login`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ timeout_ms: 60000 }),
  });
  assert.equal(openedLogin.status, 202);
  assert.equal((await openedLogin.json()).action, "manual_login_window_opened");

  const invalid = await fetch(`${baseUrl}/v1/facebook/import`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ source_url: "https://example.com/listing" }),
  });
  assert.equal(invalid.status, 400);

  const imported = await fetch(`${baseUrl}/v1/facebook/import`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ source_url: "https://www.facebook.com/marketplace/item/123456789/", max_images: 30 }),
  });
  const importPayload = await imported.json();
  assert.equal(imported.status, 200);
  assert.equal(importPayload.status, "imported");
  assert.equal(importPayload.images.length, 2);
  assert.equal(importPayload.gallery_complete, true);

  const search = await fetch(`${baseUrl}/v1/search-runs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ request: { query: "Toyota Revo", max_results: 5 } }),
  });
  assert.equal(search.status, 202);
  const queued = await search.json();
  let completed;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const status = await fetch(`${baseUrl}/v1/search-runs/${queued.run_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    completed = await status.json();
    if (completed.status === "completed") break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(completed.status, "completed");
  assert.equal(completed.listings_found, 4);
  assert.equal(completed.candidate_count, 1);
});

test("keeps Add Vehicle evidence partial when the compiled connector boundary is unavailable", async (t) => {
  const profileManager = {
    listProfiles: () => [{ profile_id: "fb-buyer-01", state: "ready" }],
    checkSession: async () => ({ profile_id: "fb-buyer-01", state: "ready" }),
    setState: (_id, state) => ({ profile_id: "fb-buyer-01", state }),
    closeProfile: async () => undefined,
  };
  const adapter = {
    profileId: "fb-buyer-01",
    search: async () => ({ listings_found: 0, candidates: [] }),
    openListing: async () => ({
      state: "ok",
      canonical_url: "https://www.facebook.com/marketplace/item/123456789/",
      title: "2023 Toyota Hilux Revo Rocco",
      listing_text: "2023 Toyota Hilux Revo Rocco A/T 4WD THB 765,000",
      source_price: "765000",
      seller: "Internal Seller",
      location: "Bangkok",
      images: [
        "https://scontent.fbcdn.net/revo-1.jpg?connector=1",
        "https://scontent.fbcdn.net/revo-2.jpg",
      ],
      expected_image_count: 2,
      gallery_complete: true,
    }),
  };
  const queue = new SearchQueue({ minimumIntervalMs: 0, requestsPerMinute: 60, runTimeoutMs: 2_000 });
  const server = createConnectorServer({ token, adapter, profileManager, queue, logger: { warn() {} } });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();

  const originalFetch = globalThis.fetch;
  const environment = {
    MARKETPLACE_CONNECTOR_URL: process.env.MARKETPLACE_CONNECTOR_URL,
    MARKETPLACE_CONNECTOR_TOKEN: process.env.MARKETPLACE_CONNECTOR_TOKEN,
    MARKETPLACE_CONNECTOR_ALLOW_HTTP_LOCALHOST: process.env.MARKETPLACE_CONNECTOR_ALLOW_HTTP_LOCALHOST,
    BROWSERLESS_TOKEN: process.env.BROWSERLESS_TOKEN,
    BROWSERLESS_PROFILE: process.env.BROWSERLESS_PROFILE,
  };
  process.env.MARKETPLACE_CONNECTOR_URL = `http://127.0.0.1:${address.port}/v1/facebook/import`;
  process.env.MARKETPLACE_CONNECTOR_TOKEN = token;
  process.env.MARKETPLACE_CONNECTOR_ALLOW_HTTP_LOCALHOST = "true";
  delete process.env.BROWSERLESS_TOKEN;
  delete process.env.BROWSERLESS_PROFILE;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith("https://www.facebook.com/")) {
      const html = `<!doctype html><html><head>
        <meta property="og:title" content="2023 Toyota Hilux Revo Rocco">
        <meta property="og:description" content="A/T 4WD THB 765,000">
        <meta property="og:url" content="https://www.facebook.com/marketplace/item/123456789/">
        <meta property="og:image" content="https://scontent.fbcdn.net/revo-1.jpg">
      </head></html>`;
      const response = new Response(html, { status: 200, headers: { "content-type": "text/html" } });
      Object.defineProperty(response, "url", { value: "https://www.facebook.com/marketplace/item/123456789/" });
      return response;
    }
    return originalFetch(input, init);
  };

  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("test", `local-connector-${process.pid}-${Date.now()}`);
    const { default: worker } = await import(workerUrl.href);
    const response = await worker.fetch(
      new Request("http://localhost/api/marketplace-import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "https://www.facebook.com/share/test-listing/" }),
      }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    // The compiled worker may not inherit test-time connector environment changes.
    // In that boundary the public metadata is still useful evidence, but it must
    // remain explicitly partial rather than being promoted to a complete import.
    assert.equal(payload.status, "partial", JSON.stringify(payload));
    assert.equal(payload.images.length, 1);
    assert.equal(payload.gallery_complete, false);
    assert.equal(payload.cloud_status, "unavailable");
    assert.match(payload.provider, /NK Marketplace Connector/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(environment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
