import { pathToFileURL } from "node:url";

const TERMINAL = new Set(["completed", "failed", "login_required", "cancelled", "timed_out"]);

function required(value, label, min = 1) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length < min) throw new Error(`missing_${label}`);
  return normalized;
}

function safeBaseUrl(value, label) {
  const url = new URL(required(value, label));
  if (!new Set(["http:", "https:"]).has(url.protocol) || url.username || url.password) throw new Error(`invalid_${label}`);
  return url.toString().replace(/\/$/, "");
}

export function loadQnapWorkerConfig(env = process.env) {
  const qnapToken = required(env.NK_HERMES_WORKER_TOKEN, "worker_token", 32);
  const connectorToken = required(env.NK_CONNECTOR_TOKEN, "connector_token", 32);
  return {
    qnapUrl: safeBaseUrl(env.NK_QNAP_DATA_API_URL, "qnap_url"),
    qnapToken,
    connectorUrl: safeBaseUrl(env.NK_CONNECTOR_URL || "http://127.0.0.1:4317", "connector_url"),
    connectorToken,
    workerId: required(env.NK_HERMES_WORKER_ID || "hermes-qnap", "worker_id").slice(0, 100),
    profileId: required(env.NK_CONNECTOR_PROFILE_ID || "fb-buyer-01", "profile_id").slice(0, 100),
    pollIntervalMs: Math.max(5_000, Math.min(300_000, Number(env.NK_HERMES_POLL_INTERVAL_MS) || 30_000)),
  };
}

async function jsonRequest(fetchImpl, url, token, options = {}) {
  const response = await fetchImpl(url, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    signal: options.signal || AbortSignal.timeout(130_000),
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    throw new Error("invalid_service_response");
  }
  if (!response.ok) {
    const code = payload.error || payload.safe_reason_code || "service_request_failed";
    const error = new Error(/^[a-z0-9_:-]{1,100}$/i.test(code) ? code : "service_request_failed");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function ruleEntries(command) {
  if (command.ruleId && command.rule && !Array.isArray(command.rule)) return [{ id: command.ruleId, rule: command.rule }];
  if (!Array.isArray(command.rule)) return [];
  return command.rule.map((entry) => entry?.id && entry?.rule ? entry : null).filter(Boolean);
}

function searchRequest(rule) {
  return {
    query: [rule.brand, rule.model, "pickup"].filter(Boolean).join(" "),
    brand: rule.brand,
    model: rule.model,
    year_from: rule.yearFrom,
    year_to: rule.yearTo,
    body_type: "pickup",
    maximum_source_price_thb: rule.maxSourcePriceThb ?? undefined,
    province_area: rule.locations.join(", "),
    required_keywords: rule.requiredKeywords,
    excluded_keywords: rule.excludedKeywords,
    max_results: Math.min(20, rule.dailyLimit),
  };
}

async function heartbeat(fetchImpl, config, commandId, message) {
  return jsonRequest(fetchImpl, `${config.qnapUrl}/v1/worker/sourcing/commands/${encodeURIComponent(commandId)}/heartbeat`, config.qnapToken, {
    method: "POST",
    headers: { "x-nk-worker-id": config.workerId },
    body: JSON.stringify({ browserProfileState: "ready", processedIncrement: 0, message }),
  });
}

async function waitForRun(fetchImpl, config, runId, commandId) {
  const deadline = Date.now() + 125_000;
  let lastHeartbeat = 0;
  while (Date.now() < deadline) {
    if (Date.now() - lastHeartbeat >= 15_000) {
      await heartbeat(fetchImpl, config, commandId, "Authorized Marketplace search is running.");
      lastHeartbeat = Date.now();
    }
    const run = await jsonRequest(fetchImpl, `${config.connectorUrl}/v1/search-runs/${encodeURIComponent(runId)}`, config.connectorToken, { method: "GET" });
    if (TERMINAL.has(run.status)) return run;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("search_timed_out");
}

async function complete(fetchImpl, config, commandId, completion) {
  return jsonRequest(fetchImpl, `${config.qnapUrl}/v1/worker/sourcing/commands/${encodeURIComponent(commandId)}/complete`, config.qnapToken, {
    method: "POST",
    headers: { "x-nk-worker-id": config.workerId },
    body: JSON.stringify(completion),
  });
}

async function profileState(fetchImpl, config) {
  return jsonRequest(fetchImpl, `${config.connectorUrl}/v1/profiles/${encodeURIComponent(config.profileId)}/check`, config.connectorToken, { method: "POST", body: "{}" });
}

export async function runQnapWorkerOnce(config, fetchImpl = fetch) {
  const claimed = await jsonRequest(fetchImpl, `${config.qnapUrl}/v1/worker/sourcing/commands/claim`, config.qnapToken, {
    method: "POST",
    headers: { "x-nk-worker-id": config.workerId },
    body: "{}",
  });
  const command = claimed.command;
  if (!command) return { status: "idle" };

  try {
    if (command.action === "pause") {
      await jsonRequest(fetchImpl, `${config.connectorUrl}/v1/profiles/${encodeURIComponent(config.profileId)}/state`, config.connectorToken, { method: "POST", body: JSON.stringify({ state: "paused" }) });
      await complete(fetchImpl, config, command.id, { state: "paused", browserProfileState: "paused", processedIncrement: 0, message: "Sourcing is paused." });
      return { status: "paused", commandId: command.id };
    }
    if (command.action === "resume") {
      const profile = await profileState(fetchImpl, config);
      const ready = profile.state === "ready";
      await complete(fetchImpl, config, command.id, { state: ready ? "ready" : "login_required", browserProfileState: ready ? "ready" : "login_required", processedIncrement: 0, message: ready ? "Browser profile is ready." : "Facebook login is required on the authorized browser profile.", safeErrorCode: ready ? null : "facebook_login_required" });
      return { status: ready ? "ready" : "login_required", commandId: command.id };
    }

    const entries = ruleEntries(command);
    if (!entries.length) throw new Error("command_rule_snapshot_missing");
    let retained = 0;
    let duplicates = 0;
    let listingsFound = 0;
    let connectorCandidates = 0;
    let rejected = 0;
    const retainedVehicleIds = [];
    for (const entry of entries) {
      const queued = await jsonRequest(fetchImpl, `${config.connectorUrl}/v1/search-runs`, config.connectorToken, {
        method: "POST",
        body: JSON.stringify({ profile_id: config.profileId, request: searchRequest(entry.rule) }),
      });
      const run = await waitForRun(fetchImpl, config, queued.run_id, command.id);
      if (run.status === "login_required") throw new Error("facebook_login_required");
      if (run.status !== "completed") throw new Error(run.error_code || `search_${run.status}`);
      listingsFound += Number(run.listings_found) || 0;
      connectorCandidates += Number(run.candidate_count) || (Array.isArray(run.candidates) ? run.candidates.length : 0);
      rejected += Number(run.rejected) || 0;
      for (const candidate of run.candidates || []) {
        try {
          const ingested = await jsonRequest(fetchImpl, `${config.qnapUrl}/v1/worker/sourcing/candidates`, config.qnapToken, {
            method: "POST",
            headers: { "x-nk-worker-id": config.workerId },
            body: JSON.stringify({ commandId: command.id, ruleId: entry.id, candidate }),
          });
          if (ingested.status === "retained") {
            retained += 1;
            if (typeof ingested.vehicleId === "string" && ingested.vehicleId) retainedVehicleIds.push(ingested.vehicleId);
          }
          if (ingested.status === "duplicate") duplicates += 1;
        } catch (error) {
          if (error instanceof Error && error.message === "daily_limit_reached") break;
          if (error instanceof Error && error.message === "candidate_rule_mismatch") continue;
          throw error;
        }
      }
    }
    await complete(fetchImpl, config, command.id, {
      state: "ready",
      browserProfileState: "ready",
      processedIncrement: 0,
      message: `Sourcing completed: ${retained} retained for review, ${duplicates} duplicates skipped. ${listingsFound} listings inspected, ${connectorCandidates} connector candidates.`,
      safeErrorCode: null,
    });
    return { status: "completed", commandId: command.id, retained, duplicates, listingsFound, connectorCandidates, rejected, retainedVehicleIds };
  } catch (error) {
    const code = error instanceof Error && /^[a-z0-9_:-]{1,100}$/i.test(error.message) ? error.message : "worker_failed";
    const loginRequired = code === "facebook_login_required" || code === "login_required";
    await complete(fetchImpl, config, command.id, {
      state: loginRequired ? "login_required" : "error",
      browserProfileState: loginRequired ? "login_required" : "error",
      processedIncrement: 0,
      message: loginRequired ? "Facebook login is required on the authorized browser profile." : "Sourcing stopped safely and requires review.",
      safeErrorCode: code,
    });
    return { status: loginRequired ? "login_required" : "error", commandId: command.id, safeErrorCode: code };
  }
}

export async function runQnapWorker(config = loadQnapWorkerConfig(), fetchImpl = fetch) {
  while (true) {
    const result = await runQnapWorkerOnce(config, fetchImpl);
    if (result.status !== "idle") process.stdout.write(`${JSON.stringify(result)}\n`);
    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runQnapWorker();
}
