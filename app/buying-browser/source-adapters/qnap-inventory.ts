import type { CustomerListing, SourceAdapterStatus } from "../types";
import type { InternalSourceRecord } from "./demo-internal-data";
import { normalizeCustomerImageContentType, readBoundedResponseBytes } from "./google-staging-parser.mjs";
import { parseQnapInventoryPayload } from "./qnap-inventory-parser.mjs";
import { parseQnapOwnerInventoryPayload } from "./qnap-owner-inventory-parser.mjs";

const MAX_MEDIA_BYTES = 12 * 1024 * 1024;

type QnapInventoryResponse = {
  observedAt?: unknown;
  listings?: unknown;
};

type QnapOwnerInventoryResponse = {
  observedAt?: unknown;
  records?: unknown;
};

export function qnapInventoryConfigured() {
  return Boolean(process.env.NK_QNAP_DATA_API_URL && process.env.NK_INTERNAL_API_TOKEN);
}

function qnapConfig() {
  const baseUrl = process.env.NK_QNAP_DATA_API_URL?.replace(/\/$/, "");
  const token = process.env.NK_INTERNAL_API_TOKEN;
  return baseUrl && token ? { baseUrl, token } : null;
}

export async function getQnapInventorySnapshot(): Promise<{ listings: CustomerListing[]; observedAt: string } | null> {
  const config = qnapConfig();
  if (!config) return null;

  const response = await fetch(`${config.baseUrl}/v1/public/listings`, {
    headers: { authorization: `Bearer ${config.token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error("qnap_inventory_unavailable");
  const payload = await response.json() as QnapInventoryResponse;
  return parseQnapInventoryPayload(payload) as { listings: CustomerListing[]; observedAt: string };
}

export async function getQnapOwnerInventorySnapshot(): Promise<{ internalRecords: InternalSourceRecord[]; observedAt: string } | null> {
  const config = qnapConfig();
  if (!config) return null;

  const response = await fetch(`${config.baseUrl}/v1/admin/inventory-records`, {
    headers: { authorization: `Bearer ${config.token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error("qnap_owner_inventory_unavailable");
  const payload = await response.json() as QnapOwnerInventoryResponse;
  return parseQnapOwnerInventoryPayload(payload) as { internalRecords: InternalSourceRecord[]; observedAt: string };
}

export async function getQnapCustomerMedia(vehicleId: string, mediaId: string) {
  return getQnapMedia(`/v1/public/media/${encodeURIComponent(vehicleId)}/${encodeURIComponent(mediaId)}`);
}

export async function getQnapOwnerMedia(vehicleId: string, mediaId: string) {
  return getQnapMedia(`/v1/admin/media/${encodeURIComponent(vehicleId)}/${encodeURIComponent(mediaId)}`);
}

async function getQnapMedia(path: string) {
  const config = qnapConfig();
  if (!config) throw new Error("qnap_inventory_not_configured");
  const response = await fetch(`${config.baseUrl}${path}`, {
    headers: { authorization: `Bearer ${config.token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const contentType = normalizeCustomerImageContentType(response.headers.get("content-type") || "");
  if (!response.ok || !contentType) throw new Error("qnap_media_unavailable");
  const bytes = await readBoundedResponseBytes(response, MAX_MEDIA_BYTES);
  return { bytes, contentType, etag: response.headers.get("etag") };
}

export async function getQnapInventoryStatus(): Promise<SourceAdapterStatus | null> {
  if (!qnapInventoryConfigured()) return null;
  try {
    const snapshot = await getQnapInventorySnapshot();
    return snapshot ? {
      adapterId: "qnap-postgres",
      mode: "live",
      label: "QNAP PostgreSQL",
      live: true,
      state: "ready",
      message: `${snapshot.listings.length} approved vehicles synchronized from QNAP PostgreSQL.`,
    } : null;
  } catch {
    return {
      adapterId: "qnap-postgres",
      mode: "fallback",
      label: "QNAP PostgreSQL unavailable",
      live: false,
      state: "error",
      message: "QNAP inventory could not be reached.",
    };
  }
}
