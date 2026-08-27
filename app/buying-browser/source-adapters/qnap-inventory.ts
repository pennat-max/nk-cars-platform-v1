import type { CustomerListing, SourceAdapterStatus } from "../types";
import { parseQnapInventoryPayload } from "./qnap-inventory-parser.mjs";

type QnapInventoryResponse = {
  observedAt?: unknown;
  listings?: unknown;
};

export async function getQnapInventorySnapshot(): Promise<{ listings: CustomerListing[]; observedAt: string } | null> {
  const baseUrl = process.env.NK_QNAP_DATA_API_URL?.replace(/\/$/, "");
  const token = process.env.NK_INTERNAL_API_TOKEN;
  if (!baseUrl || !token) return null;

  const response = await fetch(`${baseUrl}/v1/public/listings`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error("qnap_inventory_unavailable");
  const payload = await response.json() as QnapInventoryResponse;
  return parseQnapInventoryPayload(payload) as { listings: CustomerListing[]; observedAt: string };
}

export async function getQnapInventoryStatus(): Promise<SourceAdapterStatus | null> {
  if (!process.env.NK_QNAP_DATA_API_URL || !process.env.NK_INTERNAL_API_TOKEN) return null;
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
      message: "QNAP inventory could not be reached. NK is using the verified repository snapshot.",
    };
  }
}
