import crypto from "node:crypto";
import http from "node:http";
import { pathToFileURL } from "node:url";
import { createPool } from "./db.mjs";
import {
  normalizeActor,
  normalizeCommand,
  normalizeCompletion,
  normalizeHeartbeat,
  normalizeRuleMutation,
  normalizeWorkerIdentity,
  publicError,
} from "./sourcing-domain.mjs";
import { PostgresSourcingRepository } from "./sourcing-repository.mjs";

const MAX_BODY_BYTES = 128_000;

function json(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

function tokenMatches(request, token) {
  const supplied = request.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
  const expected = Buffer.from(token);
  const actual = Buffer.from(supplied);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

async function readJson(request) {
  const contentLength = Number(request.headers["content-length"] || 0);
  if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > MAX_BODY_BYTES) throw new Error("invalid_request_body");
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("invalid_request_body");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("invalid_request_body");
  }
}

export function createDataService({ pool, apiToken, workerToken, sourcingRepository = null }) {
  if (apiToken.length < 32) throw new Error("NK_INTERNAL_API_TOKEN must contain at least 32 characters");
  if (workerToken && (workerToken.length < 32 || workerToken === apiToken)) throw new Error("NK_HERMES_WORKER_TOKEN must be distinct and contain at least 32 characters");
  const sourcing = sourcingRepository || new PostgresSourcingRepository(pool);

  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://internal.local");
      if (request.method === "GET" && url.pathname === "/health") {
        const result = await pool.query("SELECT 1 AS ok");
        return json(response, 200, { status: result.rows[0]?.ok === 1 ? "ok" : "degraded" });
      }

      if (url.pathname.startsWith("/v1/worker/sourcing")) {
        if (!workerToken) return json(response, 503, { error: "worker_not_configured" });
        if (!tokenMatches(request, workerToken)) return json(response, 401, { error: "authorization_required" });
        const workerId = normalizeWorkerIdentity(request.headers["x-nk-worker-id"]);
        if (request.method === "POST" && url.pathname === "/v1/worker/sourcing/commands/claim") {
          const command = await sourcing.claimNext(workerId);
          return json(response, 200, { command });
        }
        const workerMatch = url.pathname.match(/^\/v1\/worker\/sourcing\/commands\/([0-9a-f-]+)\/(heartbeat|complete)$/i);
        if (request.method === "POST" && workerMatch?.[2] === "heartbeat") {
          return json(response, 200, await sourcing.heartbeat(workerMatch[1], workerId, normalizeHeartbeat(await readJson(request))));
        }
        if (request.method === "POST" && workerMatch?.[2] === "complete") {
          return json(response, 200, await sourcing.complete(workerMatch[1], workerId, normalizeCompletion(await readJson(request))));
        }
        return json(response, 404, { error: "not_found" });
      }

      if (!tokenMatches(request, apiToken)) return json(response, 401, { error: "authorization_required" });

      if (request.method === "GET" && url.pathname === "/v1/public/listings") {
        const result = await pool.query(
          "SELECT customer_record FROM inventory_vehicles WHERE publication_status = 'APPROVED' AND customer_record IS NOT NULL ORDER BY observed_at DESC NULLS LAST, vehicle_id",
        );
        return json(response, 200, {
          source: "qnap-postgres",
          observedAt: new Date().toISOString(),
          listings: result.rows.map((row) => row.customer_record),
        });
      }

      if (request.method === "GET" && url.pathname === "/v1/admin/inventory-summary") {
        const vehicles = await pool.query(
          "SELECT publication_status, count(*)::int AS count FROM inventory_vehicles GROUP BY publication_status ORDER BY publication_status",
        );
        const media = await pool.query(
          "SELECT visibility, count(*)::int AS count, coalesce(sum(size_bytes), 0)::bigint::text AS bytes FROM vehicle_media GROUP BY visibility ORDER BY visibility",
        );
        return json(response, 200, { vehicles: vehicles.rows, media: media.rows });
      }

      if (url.pathname.startsWith("/v1/admin/sourcing")) {
        const actor = normalizeActor(request.headers);
        if (request.method === "GET" && url.pathname === "/v1/admin/sourcing") {
          return json(response, 200, await sourcing.snapshot());
        }
        if (request.method === "POST" && url.pathname === "/v1/admin/sourcing/rules") {
          const mutation = normalizeRuleMutation(await readJson(request));
          if (mutation.expectedRevision !== 0) throw new Error("sourcing_revision_conflict");
          return json(response, 201, await sourcing.createRule(mutation.rule, actor));
        }
        const ruleMatch = url.pathname.match(/^\/v1\/admin\/sourcing\/rules\/([0-9a-f-]+)$/i);
        if (request.method === "PUT" && ruleMatch) {
          const mutation = normalizeRuleMutation(await readJson(request));
          return json(response, 200, await sourcing.updateRule(ruleMatch[1], mutation.rule, mutation.expectedRevision, actor));
        }
        if (request.method === "POST" && url.pathname === "/v1/admin/sourcing/commands") {
          return json(response, 202, await sourcing.enqueueCommand(normalizeCommand(await readJson(request)), actor));
        }
        return json(response, 404, { error: "not_found" });
      }

      return json(response, 404, { error: "not_found" });
    } catch (error) {
      const failure = publicError(error);
      if (failure.status >= 500) console.error(error instanceof Error ? error.message : "unknown_error");
      return json(response, failure.status, { error: failure.code });
    }
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3001);
  const pool = createPool();
  const server = createDataService({
    pool,
    apiToken: process.env.NK_INTERNAL_API_TOKEN || "",
    workerToken: process.env.NK_HERMES_WORKER_TOKEN || "",
  });
  server.listen(port, "0.0.0.0", () => console.log(`NK Cars data service listening on ${port}`));
  async function shutdown(signal) {
    console.log(`Received ${signal}; shutting down`);
    server.close();
    await pool.end();
    process.exit(0);
  }
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
