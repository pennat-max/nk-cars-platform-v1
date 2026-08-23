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
  expected_image_count?: number;
  gallery_complete?: boolean;
  cloud_status?: string;
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
  seller?: string;
  location?: string;
  images?: string[];
  expected_image_count?: number;
  gallery_complete?: boolean;
};

interface MarketplaceConnector {
  importListing(sourceUrl: string): Promise<ConnectorResult>;
}

const MAX_CONNECTOR_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGES = 30;
const BROWSERLESS_DEFAULT_ORIGIN = "https://production-sfo.browserless.io";
const FACEBOOK_MOBILE_USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1 NKCars/1.0";

// Standard Chromium only: no stealth mode, CAPTCHA solving, proxy rotation, or login automation.
const BROWSERLESS_FUNCTION = String.raw`
export default async ({ page, context }) => {
  const sourceUrl = context.sourceUrl;
  await page.setViewport({ width: 1365, height: 1000, deviceScaleFactor: 1 });
  await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 40000 });
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const readPage = async () => page.evaluate(() => {
    const text = (value) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
    const meta = (key) => text(
      document.querySelector('meta[property="' + key + '"]')?.getAttribute("content") ||
      document.querySelector('meta[name="' + key + '"]')?.getAttribute("content") || ""
    );
    const rawBodyText = document.body?.innerText || "";
    const bodyText = text(rawBodyText).slice(0, 30000);
    const finalUrl = location.href;
    const title = meta("og:title") || text(document.querySelector("h1")?.textContent || "") || text(document.title);
    const description = meta("og:description") || meta("description");
    const titleWords = title.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
    const candidates = [];
    const addImage = (value, width = 0, height = 0, top = 99999, alt = "", force = false) => {
      if (!value || !/^https:\/\//i.test(value)) return;
      const trusted = /fbcdn\.net|fbsbx\.com/i.test(value);
      const altText = text(alt).toLowerCase();
      const titleMatch = titleWords.some((word) => altText.includes(word));
      const listingMedia = width >= 420 && height >= 260 && (top < window.innerHeight * 1.8 || titleMatch);
      if (force || (trusted && listingMedia)) candidates.push(value);
    };
    addImage(meta("og:image"), 1200, 630, 0, title, true);
    document.querySelectorAll("img").forEach((node) => {
      const image = node;
      const rect = image.getBoundingClientRect();
      addImage(image.currentSrc || image.src, image.naturalWidth, image.naturalHeight, rect.top, image.alt || "");
    });
    document.querySelectorAll("video[poster]").forEach((node) => addImage(node.getAttribute("poster"), 1200, 630, 0, title, true));

    const priceMeta = meta("product:price:amount") || meta("og:price:amount");
    const visiblePrice = bodyText.match(/(?:฿|THB\s*)[\d,]+(?:\.\d{1,2})?/i)?.[0] || "";
    const sourcePrice = text(priceMeta || visiblePrice);
    const counters = [...bodyText.matchAll(/\b\d{1,2}\s*(?:of|\/)\s*(\d{1,2})\b/gi)]
      .map((match) => Number(match[1]))
      .filter((count) => count > 1 && count <= 60);
    const expectedImageCount = counters.length ? Math.max(...counters) : 0;
    const relatedMarker = bodyText.search(/(?:Today's picks|More from this seller|Related listings)/i);
    const primaryText = relatedMarker > 200 ? bodyText.slice(0, relatedMarker) : bodyText;
    const seller = text(rawBodyText.match(/(?:Seller|ผู้ขาย)\s*\n+([^\n]+)/i)?.[1] || "");
    const listedLocation = text(rawBodyText.match(/Listed[^\n]*[·•]\s*([^\n]+)/i)?.[1] || "");
    const loginPath = /\/(login|checkpoint|recover|two_factor)(\/|\?|$)/i.test(location.pathname);
    const loginForm = Boolean(document.querySelector('input[name="email"], input[name="pass"], form[action*="login"], form[action*="checkpoint"]'));
    const securityText = /log in to facebook|เข้าสู่ระบบ facebook|security check|required to continue/i.test(bodyText.slice(0, 4000));
    const hasListingEvidence = Boolean(title || description || sourcePrice || candidates.length);
    const listingText = [title, description, primaryText].filter(Boolean).join("\n\n").slice(0, 30000);
    return {
      state: (loginPath || ((securityText || loginForm) && !hasListingEvidence))
        ? "login_required"
        : (listingText || candidates.length ? "ok" : "unavailable"),
      final_url: finalUrl,
      title,
      description,
      listing_text: listingText,
      source_price: sourcePrice,
      seller,
      location: listedLocation,
      images: [...new Set(candidates)].slice(0, 60),
      expected_image_count: expectedImageCount || undefined,
    };
  });

  const snapshots = [await readPage()];
  if (snapshots[0].state === "login_required") {
    return { data: snapshots[0], type: "application/json" };
  }

  for (let step = 0; step < 4; step += 1) {
    await page.evaluate(() => window.scrollBy(0, Math.max(650, window.innerHeight * 0.8)));
    await new Promise((resolve) => setTimeout(resolve, 650));
    snapshots.push(await readPage());
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((resolve) => setTimeout(resolve, 400));

  const openGallery = await page.evaluate(() => {
    const images = [...document.querySelectorAll("img")]
      .map((image) => ({ image, area: image.naturalWidth * image.naturalHeight, rect: image.getBoundingClientRect() }))
      .filter(({ image, area, rect }) => area >= 420 * 260 && rect.top < window.innerHeight * 1.5 && /fbcdn\.net|fbsbx\.com/i.test(image.currentSrc || image.src))
      .sort((a, b) => b.area - a.area);
    const action = images[0]?.image.closest('a, button, [role="button"]');
    if (!action) return false;
    action.click();
    return true;
  });
  if (openGallery) await new Promise((resolve) => setTimeout(resolve, 900));

  let repeated = 0;
  let lastImage = "";
  for (let step = 0; step < 30; step += 1) {
    snapshots.push(await readPage());
    const currentImage = await page.evaluate(() => {
      const images = [...document.querySelectorAll("img")]
        .filter((image) => image.naturalWidth >= 600 && image.naturalHeight >= 350)
        .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));
      return images[0]?.currentSrc || images[0]?.src || "";
    });
    repeated = currentImage && currentImage === lastImage ? repeated + 1 : 0;
    lastImage = currentImage || lastImage;
    if (repeated >= 2) break;

    const clicked = await page.evaluate(() => {
      const label = (element) => [element.getAttribute("aria-label"), element.getAttribute("title"), element.textContent]
        .filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      const nextPattern = /^(?:next(?: photo| image)?|ถัดไป|รูปถัดไป)(?:\s+\d+)?$/i;
      const elements = [...document.querySelectorAll('button, [role="button"], [aria-label], [title]')];
      const target = elements.find((element) => {
        const rect = element.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
        return visible && nextPattern.test(label(element));
      });
      if (!target) return false;
      target.click();
      return true;
    });
    if (!clicked) break;
    await new Promise((resolve) => setTimeout(resolve, 650));
  }

  const best = snapshots.reduce((selected, item) => {
    const selectedScore = (selected.listing_text?.length || 0) + (selected.images?.length || 0) * 500;
    const itemScore = (item.listing_text?.length || 0) + (item.images?.length || 0) * 500;
    return itemScore > selectedScore ? item : selected;
  }, snapshots[0]);
  const allImages = [...new Set(snapshots.flatMap((item) => item.images || []))].slice(0, 60);
  const expectedImageCount = Math.max(...snapshots.map((item) => item.expected_image_count || 0));
  const result = {
    ...best,
    images: allImages,
    expected_image_count: expectedImageCount || undefined,
    gallery_complete: Boolean(expectedImageCount && allImages.length >= expectedImageCount),
  };

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
  const match = tag.match(new RegExp(`\\s${name}=(["'])([\\s\\S]*?)\\1`, "i"));
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
  const openGraphUrl = metaContent(html, ["og:url"]);
  if (openGraphUrl) return openGraphUrl;
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
  const fields: DraftFields = {
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
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => {
    const normalized = value?.trim().toLowerCase();
    return normalized && normalized !== "unknown" && normalized !== "need review";
  })) as DraftFields;
}

function priceFromText(text: string) {
  const normalized = text.replace(/,/g, "");
  return normalized.match(/(?:THB|฿|PRICE|ราคา)\s*:?\s*(\d{5,8})(?!\d)/i)?.[1] || "";
}

async function importPublicMetadata(sourceUrl: string): Promise<ConnectorResult | null> {
  const response = await fetch(sourceUrl, {
    method: "GET",
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(25_000),
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
      "User-Agent": FACEBOOK_MOBILE_USER_AGENT,
    },
  });
  if (!response.ok || !(response.headers.get("content-type") || "").includes("text/html")) return null;
  const finalUrl = validateMarketplaceUrl(response.url);
  const html = await boundedText(response);
  const title = metaContent(html, ["og:title", "twitter:title"]);
  const description = metaContent(html, ["og:description", "description", "twitter:description"]);
  const image = cleanImageUrl(metaContent(html, ["og:image", "twitter:image"]));
  const priceMetadata = metaContent(html, ["product:price:amount", "og:price:amount"]);
  const canonical = validateMarketplaceUrl(canonicalUrl(html, finalUrl));
  const listingText = [title, description].filter(Boolean).join("\n\n");
  const price = (priceMetadata.replace(/[^0-9.]/g, "") || priceFromText(listingText)).slice(0, 20);
  if (!title && !description && !image) return null;
  return {
    status: "partial",
    canonical_url: canonical,
    title,
    description,
    listing_text: listingText,
    source_price: price,
    images: image ? [image] : [],
    gallery_complete: false,
    cloud_status: "not_configured",
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
    const expectedImageCount = imageCount(page.expected_image_count);
    const galleryComplete = Boolean(
      page.gallery_complete
      && (!expectedImageCount || images.length >= expectedImageCount),
    ) || Boolean(expectedImageCount && images.length >= expectedImageCount);
    return {
      status: listingText && images.length && galleryComplete ? "imported" : "partial",
      canonical_url: page.final_url,
      title: page.title,
      description: page.description,
      listing_text: listingText,
      source_price: page.source_price,
      seller: page.seller,
      location: page.location,
      images,
      expected_image_count: expectedImageCount,
      gallery_complete: galleryComplete,
      cloud_status: galleryComplete ? "complete" : "partial",
      missing: [
        !listingText ? "Listing text" : "",
        !images.length ? "Listing images" : "",
        !galleryComplete && expectedImageCount ? `Listing gallery (${images.length} of ${expectedImageCount} images reached)` : "",
      ].filter(Boolean),
      draft_fields: draftFieldsFromText(listingText),
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
  const configured = configuredConnector();
  if (!configured) {
    if (publicResult) {
      return importedResponse({ ...publicResult, cloud_status: "not_configured" }, sourceUrl, "Facebook public metadata");
    }
    return safeFailure("unavailable", 422);
  }

  try {
    const result = await configured.connector.importListing(sourceUrl);
    if (result.status !== "imported" && result.status !== "partial") return safeFailure("unavailable", 422, configured.provider);
    return importedResponse(
      mergeConnectorResults(publicResult, result, result.cloud_status || "complete"),
      sourceUrl,
      publicResult ? `Facebook public metadata + ${configured.provider}` : configured.provider,
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    const cloudStatus = code === "cloud_setup_required"
      ? "setup_required"
      : code === "facebook_login_required" ? "login_required" : "unavailable";
    if (publicResult) {
      return importedResponse(
        { ...publicResult, cloud_status: cloudStatus },
        sourceUrl,
        `Facebook public metadata + ${configured.provider}`,
      );
    }
    if (code === "cloud_setup_required") return safeFailure("cloud_setup_required", 503, configured.provider);
    if (code === "facebook_login_required") return safeFailure("login_required", 401, configured.provider);
    console.error("Marketplace import failed", code);
    return safeFailure("unavailable", 422, configured.provider);
  }
}

function uniqueImages(values: unknown[]) {
  const seen = new Set<string>();
  const images: string[] = [];
  for (const value of values) {
    const image = cleanImageUrl(value);
    if (!image) continue;
    const url = new URL(image);
    const identity = `${url.hostname.toLowerCase()}${url.pathname}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    images.push(image);
    if (images.length >= MAX_IMAGES) break;
  }
  return images;
}

function imageCount(value: unknown) {
  const count = Number(value);
  return Number.isInteger(count) && count > 1 && count <= 60 ? count : undefined;
}

function mergeConnectorResults(publicResult: ConnectorResult | null, connectorResult: ConnectorResult, cloudStatus: string) {
  const expectedImageCount = Math.max(
    imageCount(publicResult?.expected_image_count) || 0,
    imageCount(connectorResult.expected_image_count) || 0,
  ) || undefined;
  const images = uniqueImages([
    ...(connectorResult.images || []),
    ...(publicResult?.images || []),
  ]);
  const galleryComplete = Boolean(
    connectorResult.gallery_complete
    && (!expectedImageCount || images.length >= expectedImageCount),
  ) || Boolean(expectedImageCount && images.length >= expectedImageCount);
  const title = cleanText(connectorResult.title) || cleanText(publicResult?.title);
  const description = cleanText(connectorResult.description) || cleanText(publicResult?.description);
  const listingText = cleanText(connectorResult.listing_text)
    || cleanText(publicResult?.listing_text)
    || [title, description].filter(Boolean).join("\n\n");
  const seller = cleanText(connectorResult.seller) || cleanText(publicResult?.seller);
  const location = cleanText(connectorResult.location) || cleanText(publicResult?.location);
  const missing = new Set([...(publicResult?.missing || []), ...(connectorResult.missing || [])].filter(Boolean));
  missing.delete("Full photo gallery");
  missing.delete("Listing images");
  missing.delete("Listing text");
  missing.delete("Seller/contact");
  missing.delete("Location");
  missing.delete("Source price");
  if (!galleryComplete) {
    missing.add(expectedImageCount
      ? `Listing gallery (${images.length} of ${expectedImageCount} images reached)`
      : "Full photo gallery");
  }
  if (!listingText) missing.add("Listing text");
  if (!images.length) missing.add("Listing images");
  if (!seller) missing.add("Seller/contact");
  if (!location) missing.add("Location");
  const sourcePrice = connectorResult.source_price || publicResult?.source_price;
  if (!sourcePrice) missing.add("Source price");

  return {
    status: listingText && images.length && galleryComplete ? "imported" : "partial",
    canonical_url: connectorResult.canonical_url || publicResult?.canonical_url,
    title,
    description,
    listing_text: listingText,
    source_price: sourcePrice,
    seller,
    location,
    images,
    expected_image_count: expectedImageCount,
    gallery_complete: galleryComplete,
    cloud_status: cloudStatus,
    missing: [...missing],
    conflicts: [...(publicResult?.conflicts || []), ...(connectorResult.conflicts || [])],
    draft_fields: {
      ...(publicResult?.draft_fields || {}),
      ...(connectorResult.draft_fields || draftFieldsFromText(listingText)),
    },
  } satisfies ConnectorResult;
}

function importedResponse(result: ConnectorResult, sourceUrl: string, provider: string) {
  const images = uniqueImages(Array.isArray(result.images) ? result.images : []);
  const title = cleanText(result.title, 500);
  const description = cleanText(result.description);
  const listingText = cleanText(result.listing_text) || [title, description].filter(Boolean).join("\n\n");
  const price = String(result.source_price ?? "").replace(/[^0-9.]/g, "").slice(0, 20);
  const meaningful = Boolean(title || description || listingText || price || images.length);
  if (!meaningful) return safeFailure("unavailable", 422, provider);
  const expectedImageCount = imageCount(result.expected_image_count);
  const galleryComplete = Boolean(
    result.gallery_complete
    && (!expectedImageCount || images.length >= expectedImageCount),
  ) || Boolean(expectedImageCount && images.length >= expectedImageCount);

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
    expected_image_count: expectedImageCount,
    gallery_complete: galleryComplete,
    cloud_status: cleanText(result.cloud_status, 100),
    missing: Array.isArray(result.missing) ? result.missing.map((item) => cleanText(item, 100)).filter(Boolean).slice(0, 30) : [],
    conflicts: Array.isArray(result.conflicts) ? result.conflicts.map((item) => cleanText(item, 500)).filter(Boolean).slice(0, 30) : [],
    draft_fields: result.draft_fields || draftFieldsFromText(listingText),
  }, { headers: { "Cache-Control": "no-store" } });
}
