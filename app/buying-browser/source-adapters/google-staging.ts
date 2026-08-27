import type { CustomerListing, SourceAdapterStatus } from "../types";
import type { InternalSourceRecord } from "./demo-internal-data";
import { normalizeCustomerImageContentType, parseGoogleStagingValues as parseGoogleStagingValuesRaw, readBoundedResponseBytes } from "./google-staging-parser.mjs";

const DEFAULT_SHEET_ID = "1IXEZTH2EYcIeM6HQKJ2Qfk4LZYsVWu4ipNolXoTnxhw";
const DEFAULT_VEHICLES_RANGE = "Vehicles!A1:AN500";
const DEFAULT_MEDIA_RANGE = "Media!A1:O5000";
const DEFAULT_CACHE_SECONDS = 300;
const MAX_SHEET_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_MEDIA_BYTES = 12 * 1024 * 1024;
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly";

type SheetValue = string | number | boolean | null;
type SheetRows = SheetValue[][];

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

export type StagedMedia = {
  mediaId: string;
  vehicleId: string;
  sourceReference: string;
  sortOrder: number;
  driveFileId: string;
  visibility: "CUSTOMER_VISIBLE" | "INTERNAL_ONLY";
  reviewStatus: "Approved" | "Needs Review" | "Rejected";
  kind: string;
  altText: string;
  mimeType: string;
  uploadedAt: string;
  fallbackPath: string;
};

export type GoogleStagingSnapshot = {
  listings: CustomerListing[];
  internalRecords: InternalSourceRecord[];
  media: StagedMedia[];
  observedAt: string;
  fetchedAt: string;
};

type GoogleStagingConfig = {
  sheetId: string;
  vehiclesRange: string;
  mediaRange: string;
  cacheSeconds: number;
  serviceAccount: ServiceAccount;
};

type CachedSnapshot = {
  expiresAt: number;
  promise: Promise<GoogleStagingSnapshot>;
};

let cachedSnapshot: CachedSnapshot | null = null;
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export function parseGoogleStagingValues(vehicleRows: SheetRows, mediaRows: SheetRows, fetchedAt = new Date().toISOString(), sheetId = DEFAULT_SHEET_ID): GoogleStagingSnapshot {
  return parseGoogleStagingValuesRaw(vehicleRows, mediaRows, fetchedAt, sheetId) as GoogleStagingSnapshot;
}

function base64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function privateKeyBytes(pem: string) {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  if (!base64) throw new Error("google_service_account_private_key_invalid");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signServiceAccountJwt(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1_000);
  const encodedHeader = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const encodedClaim = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: GOOGLE_SCOPE,
    aud: GOOGLE_TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3_600,
  }));
  const unsigned = `${encodedHeader}.${encodedClaim}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

async function googleAccessToken(config: GoogleStagingConfig) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.accessToken;
  const assertion = await signServiceAccountJwt(config.serviceAccount);
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await boundedJson<{ access_token?: string; expires_in?: number }>(response, 128 * 1024);
  if (!response.ok || !body.access_token) throw new Error("google_oauth_failed");
  cachedToken = {
    accessToken: body.access_token,
    expiresAt: Date.now() + Math.max(60, Math.min(Number(body.expires_in) || 3_600, 3_600)) * 1_000,
  };
  return cachedToken.accessToken;
}

async function boundedJson<T>(response: Response, maxBytes = MAX_SHEET_RESPONSE_BYTES) {
  const length = Number(response.headers.get("content-length") || 0);
  if (length > maxBytes) throw new Error("google_response_too_large");
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error("google_response_too_large");
  return JSON.parse(text) as T;
}

function stagingConfig(): GoogleStagingConfig | null {
  const rawAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!rawAccount) return null;
  let serviceAccount: ServiceAccount;
  try {
    const parsed = JSON.parse(rawAccount) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) return null;
    serviceAccount = { client_email: parsed.client_email, private_key: parsed.private_key };
  } catch {
    return null;
  }
  const cacheSeconds = Math.max(30, Math.min(Number(process.env.NK_GOOGLE_SYNC_TTL_SECONDS) || DEFAULT_CACHE_SECONDS, 3_600));
  return {
    sheetId: process.env.NK_GOOGLE_SHEET_ID?.trim() || DEFAULT_SHEET_ID,
    vehiclesRange: process.env.NK_GOOGLE_VEHICLES_RANGE?.trim() || DEFAULT_VEHICLES_RANGE,
    mediaRange: process.env.NK_GOOGLE_MEDIA_RANGE?.trim() || DEFAULT_MEDIA_RANGE,
    cacheSeconds,
    serviceAccount,
  };
}

export function googleStagingConfigured() {
  return Boolean(stagingConfig());
}

export function googleStagingMigrationBridgeEnabled() {
  return process.env.NK_ENABLE_GOOGLE_STAGING_FALLBACK === "true";
}

async function fetchGoogleStaging(config: GoogleStagingConfig) {
  const token = await googleAccessToken(config);
  const endpoint = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.sheetId)}/values:batchGet`);
  endpoint.searchParams.append("ranges", config.vehiclesRange);
  endpoint.searchParams.append("ranges", config.mediaRange);
  endpoint.searchParams.set("majorDimension", "ROWS");
  endpoint.searchParams.set("valueRenderOption", "UNFORMATTED_VALUE");
  const response = await fetch(endpoint, {
    headers: { authorization: `Bearer ${token}`, accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const body = await boundedJson<{ valueRanges?: Array<{ values?: SheetRows }> }>(response);
  if (!response.ok || !body.valueRanges || body.valueRanges.length < 2) throw new Error("google_sheets_read_failed");
  return parseGoogleStagingValues(body.valueRanges[0].values || [], body.valueRanges[1].values || [], new Date().toISOString(), config.sheetId);
}

export async function getGoogleStagingSnapshot(options: { force?: boolean } = {}) {
  const config = stagingConfig();
  if (!config) throw new Error("google_staging_not_configured");
  if (!options.force && cachedSnapshot && cachedSnapshot.expiresAt > Date.now()) return cachedSnapshot.promise;
  const promise = fetchGoogleStaging(config).catch((error) => {
    if (cachedSnapshot?.promise === promise) cachedSnapshot = null;
    throw error;
  });
  cachedSnapshot = { expiresAt: Date.now() + config.cacheSeconds * 1_000, promise };
  return promise;
}

export async function getGoogleStagingStatus(): Promise<SourceAdapterStatus> {
  if (!googleStagingConfigured()) {
    return {
      adapterId: "google-sheet-drive",
      label: "Google Sheet + Drive staging",
      mode: "fallback",
      live: false,
      state: "not_connected",
      message: "Google service account is not connected. NK is showing the last verified repository snapshot.",
    };
  }
  try {
    const snapshot = await getGoogleStagingSnapshot();
    return {
      adapterId: "google-sheet-drive",
      label: "Google Sheet + Drive staging",
      mode: "live",
      live: true,
      state: "ready",
      message: `${snapshot.listings.length} approved vehicles synchronized from Google staging at ${snapshot.fetchedAt}.`,
    };
  } catch {
    return {
      adapterId: "google-sheet-drive",
      label: "Google Sheet + Drive staging",
      mode: "fallback",
      live: false,
      state: "error",
      message: "Google staging could not be reached. NK is showing the last verified repository snapshot.",
    };
  }
}

export async function getDriveMedia(vehicleId: string, mediaId: string) {
  const config = stagingConfig();
  if (!config) throw new Error("google_staging_not_configured");
  const snapshot = await getGoogleStagingSnapshot();
  const media = snapshot.media.find((item) => item.vehicleId === vehicleId && item.mediaId === mediaId);
  if (!media || media.visibility !== "CUSTOMER_VISIBLE" || media.reviewStatus !== "Approved" || media.kind !== "photo") {
    throw new Error("google_media_not_customer_visible");
  }
  const token = await googleAccessToken(config);
  const endpoint = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(media.driveFileId)}`);
  endpoint.searchParams.set("alt", "media");
  endpoint.searchParams.set("supportsAllDrives", "true");
  const response = await fetch(endpoint, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const contentType = normalizeCustomerImageContentType(response.headers.get("content-type") || media.mimeType);
  if (!response.ok || !contentType) throw new Error("google_media_read_failed");
  const bytes = await readBoundedResponseBytes(response, MAX_MEDIA_BYTES);
  return { bytes, media, contentType, etag: response.headers.get("etag") };
}

export function resetGoogleStagingCacheForTests() {
  cachedSnapshot = null;
  cachedToken = null;
}
