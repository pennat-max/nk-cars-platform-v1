import { NextResponse } from "next/server";
import { extractVehicle } from "../../lib/domain";

export const runtime = "nodejs";

type ConnectorState = "imported" | "partial";
type DraftFields = {
  brand?: string;
  model?: string;
  year?: string;
  grade?: string;
  engine?: string;
  transmission?: string;
  drive?: string;
  body?: string;
  mileage?: string;
  color?: string;
};
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
  draft_fields?: DraftFields;
};

type CloudBrowserResult = {
  state?: "ok" | "login_required" | "unavailable";
  final_url?: string;
  title?: string;
  description?: string;
  listing_text?: string;
  source_price?: string;
  images?: string[];
};

interface MarketplaceConnector {
  importListing(sourceUrl: string): Promise<ConnectorResult>;
}

const MAX_CONNECTOR_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGES = 30;
const BROWSERLESS_DEFAULT_ORIGIN = "https://production-sfo.browserless.io";

// Standard Chromium only: no stealth mode, CAPTCHA solving, proxy rotation, or login automation.
const BROWSERLESS_FUNCTION = String.raw`
export default async ({ page, context }) => {
  const sourceUrl = context.sourceUrl;
  await page.setViewport({ width: 1365, height: 1000, deviceScaleFactor: 1 });
  await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 40000 });
  await new Promise((resolve) => setTimeout(resolve, 2500));

  for (let step = 0; step < 4; step += 1) {
    await page.evaluate(() => window.scrollBy(0, Math.max(650, window.innerHeight * 0.8)));
    await new Promise((resolve) => setTimeout(resolve, 650));
  }
  await page.evaluate(() => window.scrollTo(0, 0));

  const result = await page.evaluate(() => {
    const text = (value) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
    const meta = (key) => text(
      document.querySelector('meta[property="' + key + '"]')?.getAttribute("content") ||
      document.querySelector('meta[name="' + key + '"]')?.getAttribute("content") || ""
    );
    const bodyText = text(document.body?.innerText || "").slice(0, 30000);
    const finalUrl = location.href;
    const loginPath = /\/(login|checkpoint|recover|two_factor)(\/|\?|$)/i.test(location.pathname);
    const loginForm = Boolean(
      document.querySelector('input[name="email"], input[name="pass"], form[action*="login"], form[action*="checkpoint"]')
    );
    const securityText = /log in to facebook|เข้าสู่ระบบ facebook|security check|required to continue/i.test(bodyText.slice(0, 4000));
    if (loginPath || loginForm || securityText) {
      return { state: "login_required", final_url: finalUrl };
    }

    const candidates = [];
    const addImage = (value, width = 0, height = 0) => {
      if (!value || !/^https:\/\//i.test(value)) return;
      if ((width >= 220 && height >= 150) || /fbcdn\.net|fbsbx\.com/i.test(value)) candidates.push(value);
    };
    addImage(meta("og:image"), 1200, 630);
    document.querySelectorAll("img").forEach((node) => {
      const image = node;
      addImage(image.currentSrc || image.src, image.naturalWidth, image.naturalHeight);
    });
    document.querySelectorAll("video[poster]").forEach((node) => addImage(node.getAttribute("poster"), 1200, 630));

    const title = meta("og:title") || text(document.querySelector("h1")?.textContent || "") || text(document.title);
    const description = meta("og:description") || meta("description");
    const priceMeta = meta("product:price:amount") || meta("og:price:amount");
    const visiblePrice = bodyText.match(/(?:฿|THB\s*)[\d,]+(?:\.\d{1,2})?/i)?.[0] || "";
    const sourcePrice = text(priceMeta || visiblePrice);
    const images = [...new Set(candidates)].slice(0, 60);
    const listingText = [title, description, bodyText].filter(Boolean).join("\n\n").slice(0, 30000);
    return {
      state: listingText || images.length ? "ok" : "unavailable",
      final_url: finalUrl,
      title,
      description,
      listing_text: listingText,
      source_price: sourcePrice,
      images,
    };
  });

  return { data: result, type: "application/json" };
};`;

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

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number: string) => String.fromCodePoint(Number.parseInt(number, 10)))
    .replace(/&quot;/g, "\"")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tagAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\s${name}=(["'])(.*?)\\1`, "i"));
  return match ? decodeHtml(match[2]) : "";
}

function metaContent(html: string, keys: string[]) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const property = tagAttribute(tag, "property") || tagAttribute(tag, "name");
    if (keys.some((key) => property.toLowerCase() === key.toLowerCase())) {
      return cleanText(tagAttribute(tag, "content"));
    }
  }
  return "";
}

function canonicalUrl(html: string, fallback: string) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (tagAttribute(tag, "rel").toLowerCase() === "canonical") {
      const href = tagAttribute(tag, "href");
      if (href) return href;
    }
  }
  return fallback;
}

async function boundedText(response: Response) {
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_CONNECTOR_RESPONSE_BYTES) throw new Error("metadata_response_too_large");
  const reader = response.body?.getReader();
  if (!reader) return response.text();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_CONNECTOR_RESPONSE_BYTES) throw new Error("metadata_response_too_large");
    chunks.push(value);
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function draftFieldsFromText(text: string): DraftFields {
  const extracted = extractVehicle(text);
  return {
    brand: extracted.brand,
    model: extracted.model,
    year: String(extracted.year),
    grade: extracted.grade,
    engine: extracted.engine,
    transmission: extracted.transmission,
    drive: extracted.drive,
    body: extracted.body,
    mileage: extracted.mileage,
    color: extracted.color,
  };
}

async function importPublicMetadata(sourceUrl: string): Promise<ConnectorResult | null> {
  const response = await fetch(sourceUrl, {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(25_000),
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 (compatible; NKCarsMetadataImport/1.0)",
    },
  });
  if (!response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return null;
  const finalUrl = validateMarketplaceUrl(response.url);
  const html = await boundedText(response);
  const title = metaContent(html, ["og:title", "twitter:title"]);
  const description = metaContent(html, ["og:description", "description", "twitter:description"]);
  const image = cleanImageUrl(metaContent(html, ["og:image", "twitter:image"]));
  const price = metaContent(html, ["product:price:amount", "og:price:amount"]).replace(/[^0-9.]/g, "").slice(0, 20);
  const canonical = validateMarketplaceUrl(canonicalUrl(html, finalUrl));
  const listingText = [title, description].filter(Boolean).join("\n\n");
  if (!title && !description && !image) return null;
  return {
    status: image ? "partial" : "partial",
    canonical_url: canonical,
    title,
    description,
    listing_text: listingText,
    source_price: price,
    images: image ? [image] : [],
    missing: [
      "Full photo gallery",
      "Seller/contact",
      "Location",
      price ? "" : "Source price",
      "Current availability",
    ].filter(Boolean),
    conflicts: [],
    draft_fields: draftFieldsFromText(listingText),
  };
}

function cleanImageUrl(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const trustedImageHost = host === "fbcdn.net" || host.endsWith(".fbcdn.net")
      || host === "fbsbx.com" || host.endsWith(".fbsbx.com")
      || isFacebookHost(host);
    return url.protocol === "https:" && trustedImageHost ? url.toString() : "";
  } catch {
    return "";
  }
}

async function limitedJson<T>(response: Response) {
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_CONNECTOR_RESPONSE_BYTES) throw new Error("connector_response_too_large");
  const responseText = await response.text();
  if (new TextEncoder().encode(responseText).byteLength > MAX_CONNECTOR_RESPONSE_BYTES) throw new Error("connector_response_too_large");
  return JSON.parse(responseText) as T;
}

function browserlessOrigin() {
  const value = process.env.BROWSERLESS_API_URL?.trim() || BROWSERLESS_DEFAULT_ORIGIN;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash) return null;
    if (host !== "browserless.io" && !host.endsWith(".browserless.io")) return null;
    return url.origin;
  } catch {
    return null;
  }
}

class BrowserlessMarketplaceConnector implements MarketplaceConnector {
  constructor(private origin: string, private token: string, private profile: string) {}

  async importListing(sourceUrl: string) {
    const endpoint = new URL("/function", this.origin);
    endpoint.searchParams.set("token", this.token);
    endpoint.searchParams.set("profile", this.profile);
    endpoint.searchParams.set("timeout", "50000");

    const response = await fetch(endpoint, {
      method: "POST",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ code: BROWSERLESS_FUNCTION, context: { sourceUrl } }),
    });
    if (response.status === 401 || response.status === 403 || response.status === 404) throw new Error("cloud_setup_required");
    if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) {
      throw new Error("connector_unavailable");
    }

    const page = await limitedJson<CloudBrowserResult>(response);
    if (page.state === "login_required") throw new Error("facebook_login_required");
    if (page.state !== "ok") throw new Error("connector_unavailable");
    const listingText = cleanText(page.listing_text);
    const images = Array.isArray(page.images) ? page.images : [];
    return {
      status: listingText && images.length ? "imported" : "partial",
      canonical_url: page.final_url,
      title: page.title,
      description: page.description,
      listing_text: listingText,
      source_price: page.source_price,
      images,
      missing: [!listingText ? "Listing text" : "", !images.length ? "Listing images" : ""].filter(Boolean),
    } as ConnectorResult;
  }
}

class ConfiguredMarketplaceConnector implements MarketplaceConnector {
  constructor(private endpoint: string, private token: string) {}

  async importListing(sourceUrl: string) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(55_000),
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
    return limitedJson<ConnectorResult>(response);
  }
}

function configuredConnector(): { connector: MarketplaceConnector; provider: string } | null {
  const browserlessToken = process.env.BROWSERLESS_TOKEN?.trim();
  const browserlessProfile = process.env.BROWSERLESS_PROFILE?.trim();
  const origin = browserlessOrigin();
  if (browserlessToken && browserlessProfile && origin) {
    return {
      connector: new BrowserlessMarketplaceConnector(origin, browserlessToken, browserlessProfile),
      provider: "Browserless Cloud Browser",
    };
  }

  const endpoint = process.env.MARKETPLACE_CONNECTOR_URL?.trim();
  const token = process.env.MARKETPLACE_CONNECTOR_TOKEN?.trim();
  if (!endpoint || !token) return null;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return null;
  } catch {
    return null;
  }
  return { connector: new ConfiguredMarketplaceConnector(endpoint, token), provider: "Marketplace connector" };
}

function safeFailure(
  status: "cloud_setup_required" | "login_required" | "unavailable",
  httpStatus = 422,
  provider = "Facebook public metadata",
) {
  const details = {
    cloud_setup_required: {
      message: "Cloud Browser setup required",
      action: "Connect a Browserless token and authenticated Facebook profile, or upload screenshots/photos.",
    },
    login_required: {
      message: "Facebook login required in Cloud Browser",
      action: "Refresh the saved Facebook profile in Browserless, then try again.",
    },
    unavailable: {
      message: "Unable to import this listing automatically",
      action: "Upload screenshots/photos or paste the listing text to continue.",
    },
  }[status];
  return NextResponse.json({
    status,
    ...details,
    provider,
    setup_url: "https://www.browserless.io/account",
  }, { status: httpStatus, headers: { "Cache-Control": "no-store" } });
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

  const publicResult = await importPublicMetadata(sourceUrl).catch(() => null);
  if (publicResult) {
    return importedResponse(publicResult, sourceUrl, "Facebook public metadata");
  }

  const configured = configuredConnector();
  if (!configured) return safeFailure("unavailable", 422);

  try {
    const result = await configured.connector.importListing(sourceUrl);
    if (result.status !== "imported" && result.status !== "partial") return safeFailure("unavailable", 422, configured.provider);
    return importedResponse(result, sourceUrl, configured.provider);
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    if (code === "cloud_setup_required") return safeFailure("cloud_setup_required", 503);
    if (code === "facebook_login_required") return safeFailure("login_required", 401);
    console.error("Marketplace import failed", code);
    return safeFailure("unavailable", 422, configured.provider);
  }
}

function importedResponse(result: ConnectorResult, sourceUrl: string, provider: string) {
  const images = Array.isArray(result.images)
    ? [...new Set(result.images.map(cleanImageUrl).filter(Boolean))].slice(0, MAX_IMAGES)
    : [];
  const title = cleanText(result.title, 500);
  const description = cleanText(result.description);
  const listingText = cleanText(result.listing_text) || [title, description].filter(Boolean).join("\n\n");
  const price = String(result.source_price ?? "").replace(/[^0-9.]/g, "").slice(0, 20);
  const meaningful = Boolean(title || description || listingText || price || images.length);
  if (!meaningful) return safeFailure("unavailable", 422, provider);

  return NextResponse.json({
    status: result.status,
    provider,
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
    draft_fields: result.draft_fields || draftFieldsFromText(listingText),
  }, { headers: { "Cache-Control": "no-store" } });
}
