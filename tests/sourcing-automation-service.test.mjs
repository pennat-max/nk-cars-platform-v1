import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { createDataService } from "../deploy/qnap/data-service/server.mjs";
import {
  normalizeCommand,
  normalizeCompletion,
  normalizeHeartbeat,
  normalizeSourcingRule,
} from "../deploy/qnap/data-service/sourcing-domain.mjs";
import { allowedQnapIngressPath, qnapIngressAuthorized } from "../app/buying-browser/qnap-ingress.ts";

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
  };
  const pool = { query: async () => ({ rows: [{ ok: 1 }] }) };
  const server = createDataService({ pool, apiToken, workerToken, sourcingRepository: repository });
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
  assert.equal(allowedQnapIngressPath("/v1/worker/sourcing/commands/claim"), false);
  assert.equal(allowedQnapIngressPath("/v1/admin/media/internal-secret"), false);
  assert.equal(allowedQnapIngressPath("/v1/admin/sourcing/../media"), false);
  assert.equal(qnapIngressAuthorized(`Bearer ${apiToken}`, apiToken), true);
  assert.equal(qnapIngressAuthorized(`Bearer ${workerToken}`, apiToken), false);
});

test("QNAP sourcing schema is append-only and deployment migrates existing volumes", async () => {
  const [schema, compose, deployment] = await Promise.all([
    fs.readFile(new URL("../deploy/qnap/postgres/init/020_sourcing_automation.sql", import.meta.url), "utf8"),
    fs.readFile(new URL("../deploy/qnap/docker-compose.full.yml", import.meta.url), "utf8"),
    fs.readFile(new URL("../deploy/qnap/deploy-full.sh", import.meta.url), "utf8"),
  ]);
  assert.match(schema, /sourcing_rule_audit_events/);
  assert.match(schema, /sourcing_command_events/);
  assert.match(schema, /ON DELETE RESTRICT/);
  assert.match(schema, /REVOKE DELETE/);
  assert.doesNotMatch(schema, /GRANT ALL/);
  assert.match(compose, /NK_HERMES_WORKER_TOKEN:\s+"\$\{NK_HERMES_WORKER_TOKEN:-\}"/);
  assert.doesNotMatch(compose, /NK_HERMES_WORKER_TOKEN:\s+[A-Za-z0-9_-]{32}/);
  assert.match(deployment, /020_sourcing_automation\.sql/);
  assert.match(deployment, /psql -v ON_ERROR_STOP=1/);
  assert.doesNotMatch(deployment, /PASSWORD=/);
});
