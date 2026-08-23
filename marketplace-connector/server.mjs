import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import http from "node:http";
import { pathToFileURL } from "node:url";
import { BrowserProfileManager } from "./browser-profile-manager.mjs";
import { loadServerConfig } from "./config.mjs";
import { normalizeSearchRequest } from "./contracts.mjs";
import { SearchQueue } from "./search-queue.mjs";
import { FacebookPlaywrightSourceAdapter } from "./source-adapter.mjs";
import { boundedImageCount, uniqueFacebookImages, validateFacebookUrl } from "./url-policy.mjs";

const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

function tokenDigest(value) {
  return createHash("sha256").update(value).digest();
}

function isAuthorized(request, expectedToken) {
  const header = request.headers.authorization || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return timingSafeEqual(tokenDigest(supplied), tokenDigest(expectedToken));
}

async function readJson(request) {
  const contentType = request.headers["content-type"] || "";
  if (!/^application\/json(?:;|$)/i.test(contentType)) throw new Error("json_content_type_required");
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_REQUEST_BYTES) throw new Error("request_too_large");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("invalid_json");
  }
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  if (Buffer.byteLength(body) > MAX_RESPONSE_BYTES) {
    return sendJson(response, 500, { status: "failed", safe_reason_code: "response_too_large" });
  }
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  response.end(body);
}

function statusCode(errorCode) {
  if (["invalid_url", "invalid_json", "invalid_search_request", "search_terms_required", "json_content_type_required"].includes(errorCode)) return 400;
  if (errorCode === "request_too_large") return 413;
  if (errorCode === "profile_not_found") return 404;
  if (["facebook_login_required", "login_required"].includes(errorCode)) return 409;
  if (["profile_paused", "search_queue_full"].includes(errorCode)) return 423;
  return 422;
}

function safeErrorCode(error) {
  const message = error instanceof Error ? error.message : String(error || "connector_failed");
  return /^[a-z0-9_:-]{1,100}$/i.test(message) ? message : "connector_failed";
}

async function waitForTerminalRun(queue, runId, timeoutMs = 80_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const run = queue.getRun(runId);
    if (!run) throw new Error("search_run_not_found");
    if (["completed", "failed", "login_required", "cancelled", "timed_out"].includes(run.status)) return run;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  queue.cancel(runId);
  throw new Error("search_timed_out");
}

function listingResponse(listing, maxImages) {
  const images = uniqueFacebookImages(listing.images || [], maxImages);
  const count = Number(listing.expected_image_count) || undefined;
  const galleryComplete = Boolean(listing.gallery_complete && (!count || images.length >= Math.min(count, maxImages)));
  return {
    status: listing.listing_text && images.length && galleryComplete ? "imported" : "partial",
    canonical_url: listing.canonical_url,
    title: listing.title,
    description: listing.description,
    listing_text: listing.listing_text,
    source_price: listing.source_price,
    seller: listing.seller,
    location: listing.location,
    images,
    expected_image_count: count,
    gallery_complete: galleryComplete,
    cloud_status: galleryComplete ? "complete" : "partial",
    missing: [
      !listing.listing_text ? "Listing text" : "",
      !images.length ? "Listing images" : "",
      !galleryComplete && count ? `Listing gallery (${images.length} of ${count} images reached)` : "",
    ].filter(Boolean),
  };
}

export function createConnectorServer({ token, adapter, profileManager, queue, logger = console }) {
  if (!token || token.length < 32) throw new Error("connector_token_required");
  if (!adapter || !profileManager || !queue) throw new Error("connector_dependencies_required");

  return http.createServer(async (request, response) => {
    const requestId = randomUUID();
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      if (request.method === "GET" && url.pathname === "/health") {
        return sendJson(response, 200, { status: "ok", service: "nk-marketplace-connector" });
      }
      if (!url.pathname.startsWith("/v1/") || !isAuthorized(request, token)) {
        return sendJson(response, 401, { status: "unauthorized" });
      }

      if (request.method === "GET" && url.pathname === "/v1/profiles") {
        return sendJson(response, 200, { profiles: profileManager.listProfiles() });
      }

      const profileCheck = url.pathname.match(/^\/v1\/profiles\/([a-z0-9_-]+)\/check$/i);
      if (request.method === "POST" && profileCheck) {
        const status = await profileManager.checkSession(profileCheck[1]);
        return sendJson(response, 200, status);
      }

      const profileState = url.pathname.match(/^\/v1\/profiles\/([a-z0-9_-]+)\/state$/i);
      if (request.method === "POST" && profileState) {
        const body = await readJson(request);
        if (body.state !== "paused" && body.state !== "login_required") throw new Error("invalid_profile_state");
        const status = profileManager.setState(profileState[1], body.state, "operator_update");
        if (body.state === "paused") await profileManager.closeProfile(profileState[1]);
        return sendJson(response, 200, status);
      }

      if (request.method === "POST" && url.pathname === "/v1/search-runs") {
        const body = await readJson(request);
        const requestInput = normalizeSearchRequest(body.request || body);
        const profileId = typeof body.profile_id === "string" ? body.profile_id : adapter.profileId;
        if (profileId !== adapter.profileId) throw new Error("profile_not_found");
        const run = queue.enqueue({
          request: requestInput,
          profileId,
          execute: ({ signal, runId }) => adapter.search(requestInput, { signal, runId }),
        });
        return sendJson(response, 202, run);
      }

      const searchRun = url.pathname.match(/^\/v1\/search-runs\/(run_[a-f0-9-]+)$/i);
      if (searchRun && request.method === "GET") {
        const run = queue.getRun(searchRun[1]);
        return run ? sendJson(response, 200, run) : sendJson(response, 404, { status: "not_found" });
      }
      if (searchRun && request.method === "DELETE") {
        const cancelled = queue.cancel(searchRun[1]);
        return sendJson(response, cancelled ? 202 : 409, { status: cancelled ? "cancelling" : "not_cancelled" });
      }

      if (request.method === "POST" && url.pathname === "/v1/facebook/import") {
        const body = await readJson(request);
        const sourceUrl = validateFacebookUrl(body.source_url);
        const maxImages = boundedImageCount(body.max_images);
        const syntheticRequest = { request_id: `listing_${randomUUID()}` };
        const run = queue.enqueue({
          request: syntheticRequest,
          profileId: adapter.profileId,
          execute: async ({ signal }) => ({
            listings_found: 1,
            candidates: [],
            output: await adapter.openListing(sourceUrl, { signal, maxImages }),
          }),
        });
        const completed = await waitForTerminalRun(queue, run.run_id);
        if (completed.status !== "completed") {
          const code = completed.error_code || completed.status;
          return sendJson(response, statusCode(code), { status: completed.status, safe_reason_code: code });
        }
        return sendJson(response, 200, listingResponse(queue.getOutput(run.run_id), maxImages));
      }

      return sendJson(response, 404, { status: "not_found" });
    } catch (error) {
      const code = safeErrorCode(error);
      logger.warn?.("NK connector request failed", { request_id: requestId, safe_reason_code: code });
      return sendJson(response, statusCode(code), { status: "failed", safe_reason_code: code });
    }
  }).on("clientError", (_error, socket) => {
    socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
  });
}

export function createDefaultRuntime(env = process.env) {
  const config = loadServerConfig(env);
  const profileId = env.NK_CONNECTOR_PROFILE_ID?.trim() || "fb-buyer-01";
  const profileManager = new BrowserProfileManager({
    profiles: [{
      id: profileId,
      label: env.NK_CONNECTOR_PROFILE_LABEL?.trim() || "Facebook Buyer 01",
      directory: config.profileDirectory,
      channel: config.channel,
      headless: config.headless,
      navigationTimeoutMs: config.navigationTimeoutMs,
    }],
  });
  const adapter = new FacebookPlaywrightSourceAdapter({
    profileManager,
    profileId,
    navigationTimeoutMs: config.navigationTimeoutMs,
  });
  const queue = new SearchQueue({
    concurrency: 1,
    requestsPerMinute: config.requestsPerMinute,
    minimumIntervalMs: 5_000,
    runTimeoutMs: config.operationTimeoutMs,
  });
  return { config, profileManager, adapter, queue };
}

export async function startLocalConnector(env = process.env) {
  const runtime = createDefaultRuntime(env);
  const server = createConnectorServer({
    token: runtime.config.token,
    adapter: runtime.adapter,
    profileManager: runtime.profileManager,
    queue: runtime.queue,
  });
  server.requestTimeout = runtime.config.operationTimeoutMs + 10_000;
  server.headersTimeout = 10_000;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(runtime.config.port, runtime.config.host, resolve);
  });
  console.log(`NK Marketplace Connector listening on http://${runtime.config.host}:${runtime.config.port}`);
  console.log(`Profile: ${runtime.adapter.profileId} (manual Facebook login only)`);
  const close = async () => {
    await new Promise((resolve) => server.close(resolve));
    await runtime.profileManager.closeAll();
  };
  process.once("SIGINT", () => close().finally(() => process.exit(0)));
  process.once("SIGTERM", () => close().finally(() => process.exit(0)));
  return { ...runtime, server, close };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startLocalConnector().catch((error) => {
    console.error(`Unable to start NK Marketplace Connector: ${safeErrorCode(error)}`);
    process.exitCode = 1;
  });
}
