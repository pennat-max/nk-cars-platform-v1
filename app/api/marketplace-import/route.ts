import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ConnectorState = "imported" | "partial";
type ConnectorResult = {
  status: ConnectorState;
  canonical_url?: string;
  title?: string;
  description?: string;
  listing_text?: string;
  source_price?: string | number;
  seller?: string;
  location?: string;
  images?: string[];
  missing?: string[];
  conflicts?: string[];
};

interface MarketplaceConnector {
  importListing(sourceUrl: string): Promise<ConnectorResult>;
}

const MAX_CONNECTOR_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGES = 30;

function isFacebookHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com" || host.endsWith(".fb.com");
}

function validateMarketplaceUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !isFacebookHost(url.hostname) || url.username || url.password || url.port) {
    throw new Error("invalid_url");
  }
  return url.toString();
}

function cleanText(value: unknown, max = 30_000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanImageUrl(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

async function limitedJson(response: Response) {
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_CONNECTOR_RESPONSE_BYTES) throw new Error("connector_response_too_large");
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_CONNECTOR_RESPONSE_BYTES) throw new Error("connector_response_too_large");
  return JSON.parse(text) as ConnectorResult;
}

class ConfiguredMarketplaceConnector implements MarketplaceConnector {
  constructor(private endpoint: string, private token: string) {}

  async importListing(sourceUrl: string) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ source_url: sourceUrl, max_images: MAX_IMAGES }),
    });
    if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) {
      throw new Error("connector_unavailable");
    }
    return limitedJson(response);
  }
}

function configuredConnector(): MarketplaceConnector | null {
  const endpoint = process.env.MARKETPLACE_CONNECTOR_URL?.trim();
  const token = process.env.MARKETPLACE_CONNECTOR_TOKEN?.trim();
  if (!endpoint || !token) return null;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return null;
  } catch {
    return null;
  }
  return new ConfiguredMarketplaceConnector(endpoint, token);
}

function connectorRequired() {
  return NextResponse.json({
    status: "connector_required",
    message: "Unable to import this listing automatically",
    connector: "Marketplace connector required",
  }, { status: 422, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let sourceUrl = "";
  try {
    const body = await request.json() as { url?: unknown };
    sourceUrl = validateMarketplaceUrl(typeof body.url === "string" ? body.url.trim() : "");
  } catch {
    return NextResponse.json({
      status: "invalid_url",
      message: "Paste a Facebook Marketplace listing link.",
    }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const connector = configuredConnector();
  if (!connector) return connectorRequired();

  try {
    const result = await connector.importListing(sourceUrl);
    if (result.status !== "imported" && result.status !== "partial") return connectorRequired();
    const images = Array.isArray(result.images)
      ? [...new Set(result.images.map(cleanImageUrl).filter(Boolean))].slice(0, MAX_IMAGES)
      : [];
    const title = cleanText(result.title, 500);
    const description = cleanText(result.description);
    const listingText = cleanText(result.listing_text) || [title, description].filter(Boolean).join("\n\n");
    const price = String(result.source_price ?? "").replace(/[^0-9.]/g, "").slice(0, 20);
    const meaningful = Boolean(title || description || listingText || price || images.length);
    if (!meaningful) return connectorRequired();

    return NextResponse.json({
      status: result.status,
      source_url: sourceUrl,
      canonical_url: cleanText(result.canonical_url, 3_000),
      source_platform: "Facebook Marketplace",
      title,
      description,
      listing_text: listingText,
      source_price: price,
      seller: cleanText(result.seller, 500),
      location: cleanText(result.location, 500),
      images,
      missing: Array.isArray(result.missing) ? result.missing.map((item) => cleanText(item, 100)).filter(Boolean).slice(0, 30) : [],
      conflicts: Array.isArray(result.conflicts) ? result.conflicts.map((item) => cleanText(item, 500)).filter(Boolean).slice(0, 30) : [],
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Marketplace connector import failed", error instanceof Error ? error.message : "unknown");
    return connectorRequired();
  }
}
