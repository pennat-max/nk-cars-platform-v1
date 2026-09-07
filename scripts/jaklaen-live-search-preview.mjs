import { randomBytes } from "node:crypto";
import { normalizeCandidate, normalizeSearchRequest, candidateMatchesRequest } from "../marketplace-connector/contracts.mjs";
import { collectFacebookSearchCards } from "../marketplace-connector/facebook-page-reader.mjs";
import { buildFacebookSearchUrl } from "../marketplace-connector/source-adapter.mjs";
import { createDefaultRuntime } from "../marketplace-connector/server.mjs";

const DEFAULT_QUERY = "Toyota Hilux Revo";
const MAX_RESULTS = 6;

function readStdin() {
  return new Promise((resolve) => {
    let raw = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      raw += chunk;
    });
    process.stdin.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function cleanText(value, fallback = "PENDING") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function safeCandidate(candidate) {
  const titleParts = [candidate.year, candidate.brand, candidate.model].filter(Boolean);
  return {
    id: cleanText(candidate.candidate_id, `candidate-${Date.now()}`),
    title: titleParts.length ? titleParts.join(" ") : "Toyota Hilux Revo",
    make: cleanText(candidate.brand, "UNKNOWN"),
    model: cleanText(candidate.model, "UNKNOWN"),
    grade: cleanText(candidate.body_type, "UNKNOWN"),
    year: candidate.year || "UNKNOWN",
    transmission: cleanText(candidate.transmission, "UNKNOWN"),
    drive: cleanText(candidate.drive_type, "UNKNOWN"),
    mileageKm: typeof candidate.mileage_km === "number" ? candidate.mileage_km : null,
    priceThb: typeof candidate.source_price_thb === "number" ? candidate.source_price_thb : null,
    imageUrl: Array.isArray(candidate.images) ? candidate.images.find((image) => /^https?:\/\//.test(image)) || null : null,
    location: cleanText(candidate.source?.location, "PENDING"),
    sourcePlatform: cleanText(candidate.source?.platform, "facebook_marketplace"),
    sourceUrl: cleanText(candidate.source?.source_url, ""),
    foundAt: cleanText(candidate.source?.observed_at, new Date().toISOString()),
    reviewStatus: "NEEDS_REVIEW",
  };
}

const input = await readStdin();
const query = cleanText(input.query, DEFAULT_QUERY);
const maxResults = Math.min(Math.max(Number(input.maxResults) || 3, 1), MAX_RESULTS);

process.env.NK_CONNECTOR_TOKEN = process.env.NK_CONNECTOR_TOKEN || randomBytes(32).toString("hex");
process.env.NK_CONNECTOR_PROFILE_ID = process.env.NK_CONNECTOR_PROFILE_ID || "jaklaen-facebook";
process.env.NK_CONNECTOR_HEADLESS = process.env.NK_CONNECTOR_HEADLESS || "true";
process.env.NK_CONNECTOR_OPERATION_TIMEOUT_MS = process.env.NK_CONNECTOR_OPERATION_TIMEOUT_MS || "120000";
process.env.NK_CONNECTOR_NAVIGATION_TIMEOUT_MS = process.env.NK_CONNECTOR_NAVIGATION_TIMEOUT_MS || "90000";
delete process.env.NK_CONNECTOR_PROFILE_IDS;

const runtime = createDefaultRuntime();
const request = normalizeSearchRequest({
  request_id: `owner_preview_${Date.now()}`,
  query,
  make: "Toyota",
  model: "Hilux Revo",
  year_from: 2020,
  year_to: 2026,
  province_area: "Bangkok",
  max_results: maxResults,
});
const searchUrl = buildFacebookSearchUrl(request);
const searchPage = await runtime.profileManager.withPage(
  "jaklaen-facebook",
  (page) => collectFacebookSearchCards(page, searchUrl, {
    navigationTimeoutMs: 90_000,
    maxCards: Math.max(20, maxResults * 4),
  }),
);

if (searchPage.state === "login_required") throw new Error("facebook_login_required");

const candidates = [];
for (const card of searchPage.cards || []) {
  const candidate = normalizeCandidate(card, {
    search_request_id: request.request_id,
    adapter: "facebook_playwright_search_card",
  });
  if (!candidateMatchesRequest(candidate, request).matches) continue;
  candidates.push(safeCandidate(candidate));
  if (candidates.length >= maxResults) break;
}

process.stdout.write(JSON.stringify({
  status: "ok",
  searchedAt: new Date().toISOString(),
  listingsFound: searchPage.cards?.length || candidates.length,
  candidates,
}));
