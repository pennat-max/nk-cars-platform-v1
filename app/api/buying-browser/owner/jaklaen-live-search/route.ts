import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_QUERY = "Toyota Hilux Revo";
const MAX_RESULTS = 6;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

function cleanText(value: unknown, fallback = "PENDING") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

async function runSearchRunner(input: Record<string, unknown>) {
  const scriptPath = path.join(process.cwd(), "scripts", "jaklaen-live-search-preview.mjs");
  const child = spawn(process.execPath, [scriptPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NK_CONNECTOR_PROFILE_IDS: "",
      NK_CONNECTOR_PROFILE_ID: process.env.NK_CONNECTOR_PROFILE_ID || "jaklaen-facebook",
      NK_CONNECTOR_HEADLESS: process.env.NK_CONNECTOR_HEADLESS || "true",
      NK_CONNECTOR_OPERATION_TIMEOUT_MS: process.env.NK_CONNECTOR_OPERATION_TIMEOUT_MS || "120000",
      NK_CONNECTOR_NAVIGATION_TIMEOUT_MS: process.env.NK_CONNECTOR_NAVIGATION_TIMEOUT_MS || "90000",
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  child.stdin.end(JSON.stringify(input));

  const exitCode = await new Promise<number | null>((resolve) => {
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      resolve(124);
    }, 35_000);
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve(code);
    });
  });

  if (exitCode !== 0) {
    const message = stderr.split(/\r?\n/).find(Boolean) || `search_runner_failed_${exitCode}`;
    throw new Error(message);
  }

  return JSON.parse(stdout);
}

type CachedCandidate = Record<string, unknown> & {
  images?: unknown;
  source?: Record<string, unknown>;
};

function safeCachedCandidate(candidate: CachedCandidate) {
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
    imageUrl: Array.isArray(candidate.images) ? candidate.images.find((image: string) => /^https?:\/\//.test(image)) || null : null,
    location: cleanText(candidate.source?.location, "PENDING"),
    sourcePlatform: cleanText(candidate.source?.platform, "facebook_marketplace"),
    sourceUrl: cleanText(candidate.source?.source_url, ""),
    foundAt: cleanText(candidate.source?.observed_at, new Date().toISOString()),
    reviewStatus: "NEEDS_REVIEW",
  };
}

async function readLatestLiveSearchCache(maxResults: number) {
  const cachePath = path.join(process.cwd(), "jaklaen-live-search-result.json");
  const raw = await readFile(cachePath, "utf8");
  const parsed = JSON.parse(raw);
  const result = parsed.result || parsed;
  const candidates = Array.isArray(result.candidates) ? result.candidates.slice(0, maxResults).map(safeCachedCandidate) : [];
  if (!candidates.length) throw new Error("live_search_cache_empty");
  return {
    status: "ok",
    searchedAt: parsed.searchedAt || result.searched_at || new Date().toISOString(),
    listingsFound: result.listings_found || candidates.length,
    candidates,
  };
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const query = cleanText(body.query, DEFAULT_QUERY);
  const maxResults = Math.min(Math.max(Number(body.maxResults) || 3, 1), MAX_RESULTS);

  try {
    return json(await runSearchRunner({ query, maxResults }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "jaklaen_search_failed";
    try {
      return json(await readLatestLiveSearchCache(maxResults));
    } catch (cacheError) {
      const cacheMessage = cacheError instanceof Error ? cacheError.message : "live_search_cache_failed";
      console.warn("Jaklaen live preview cache fallback failed", { message: cacheMessage });
    }
    console.warn("Jaklaen live preview search failed", { message });
    const blocked = /login|required|captcha|checkpoint|rate|blocked|session/i.test(message);
    return json(
      {
        status: blocked ? "blocked" : "error",
        message: blocked ? "จั๊กแล่นติด Facebook session หรือ checkpoint ต้องตรวจในเครื่องก่อนค้นต่อ" : "ค้นหาไม่สำเร็จ",
      },
      blocked ? 409 : 500,
    );
  }
}
