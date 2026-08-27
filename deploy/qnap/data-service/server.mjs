import crypto from "node:crypto";
import http from "node:http";
import { createPool } from "./db.mjs";

const port = Number(process.env.PORT || 3001);
const apiToken = process.env.NK_INTERNAL_API_TOKEN || "";
if (apiToken.length < 32) throw new Error("NK_INTERNAL_API_TOKEN must contain at least 32 characters");

const pool = createPool();

function json(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

function authorized(request) {
  const supplied = request.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
  const expected = Buffer.from(apiToken);
  const actual = Buffer.from(supplied);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://internal.local");
    if (request.method === "GET" && url.pathname === "/health") {
      const result = await pool.query("SELECT 1 AS ok");
      return json(response, 200, { status: result.rows[0]?.ok === 1 ? "ok" : "degraded" });
    }

    if (!authorized(request)) return json(response, 401, { error: "authorization_required" });

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

    return json(response, 404, { error: "not_found" });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "unknown_error");
    return json(response, 500, { error: "internal_error" });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`NK Cars data service listening on ${port}`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}; shutting down`);
  server.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
