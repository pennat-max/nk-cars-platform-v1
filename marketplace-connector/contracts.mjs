import { createHash, randomUUID } from "node:crypto";

const MAX_TEXT_LENGTH = 500;
const MAX_KEYWORDS = 20;
const TRANSMISSIONS = new Set(["AT", "MT"]);
const DRIVE_TYPES = new Set(["2WD", "4WD"]);

function cleanText(value, max = MAX_TEXT_LENGTH) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function optionalInteger(value, minimum, maximum) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum) throw new Error("invalid_search_request");
  return number;
}

function keywordList(value) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\n]/) : [];
  return [...new Set(values.map((item) => cleanText(item, 100)).filter(Boolean))].slice(0, MAX_KEYWORDS);
}

function normalizedChoice(value, choices, aliases = {}) {
  const normalized = cleanText(value, 20).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!normalized) return undefined;
  const result = aliases[normalized] || (choices.has(normalized) ? normalized : undefined);
  if (!result) throw new Error("invalid_search_request");
  return result;
}

function normalizedDrive(value) {
  const normalized = cleanText(value, 20).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!normalized) return undefined;
  if (normalized === "4X4") return "4WD";
  if (normalized === "4X2") return "2WD";
  if (DRIVE_TYPES.has(normalized)) return normalized;
  throw new Error("invalid_search_request");
}

export function normalizeSearchRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("invalid_search_request");

  const request = {
    request_id: cleanText(input.request_id, 100) || randomUUID(),
    source_platform: "facebook_marketplace",
    query: cleanText(input.query, 300),
    keywords: keywordList(input.keywords),
    brand: cleanText(input.brand, 100),
    model: cleanText(input.model, 100),
    year_from: optionalInteger(input.year_from, 1950, 2100),
    year_to: optionalInteger(input.year_to, 1950, 2100),
    transmission: normalizedChoice(input.transmission, TRANSMISSIONS, {
      AUTO: "AT",
      AUTOMATIC: "AT",
      MANUAL: "MT",
    }),
    drive_type: normalizedDrive(input.drive_type),
    body_type: cleanText(input.body_type, 100),
    maximum_mileage_km: optionalInteger(input.maximum_mileage_km, 0, 5_000_000),
    maximum_source_price_thb: optionalInteger(input.maximum_source_price_thb, 0, 1_000_000_000),
    province_area: cleanText(input.province_area, 100),
    radius_km: optionalInteger(input.radius_km, 1, 2_000),
    required_keywords: keywordList(input.required_keywords),
    excluded_keywords: keywordList(input.excluded_keywords),
    max_results: optionalInteger(input.max_results, 1, 20) || 5,
  };

  if (request.year_from && request.year_to && request.year_from > request.year_to) {
    throw new Error("invalid_search_request");
  }

  if (!request.query && !request.keywords.length && !request.brand && !request.model) {
    throw new Error("search_terms_required");
  }

  return Object.freeze(request);
}

export function buildSearchTerms(request) {
  return [...new Set([
    request.query,
    ...request.keywords,
    request.brand,
    request.model,
    request.year_from && request.year_from === request.year_to ? String(request.year_from) : "",
    request.transmission,
    request.drive_type,
    request.body_type,
    ...request.required_keywords,
  ].filter(Boolean))].join(" ");
}

function numberFromMatch(text, pattern) {
  const match = text.match(pattern);
  return match ? Number(match[1].replace(/,/g, "")) : undefined;
}

function vehicleFacts(text) {
  const normalized = cleanText(text, 30_000);
  const upper = normalized.toUpperCase();
  const year = numberFromMatch(normalized, /\b((?:19|20)\d{2})\b/);
  const sourcePriceThb = numberFromMatch(
    normalized,
    /(?:THB|\u0e3f|\u0e23\u0e32\u0e04\u0e32)\s*:?[\s\u00a0]*(\d{1,3}(?:,\d{3})+|\d{5,9})/i,
  );
  const mileageKm = numberFromMatch(
    normalized,
    /(?:MILEAGE|ODO(?:METER)?|KM|\u0e44\u0e21\u0e25\u0e4c|\u0e40\u0e25\u0e02\u0e44\u0e21\u0e25\u0e4c)\s*:?[\s\u00a0]*(\d{1,3}(?:,\d{3})+|\d{3,7})/i,
  );
  const brand = ["Toyota", "Ford", "Isuzu", "Mitsubishi", "Nissan", "Mazda", "Honda"]
    .find((item) => upper.includes(item.toUpperCase()));
  const model = [
    ["Hilux Revo", /\b(?:HILUX\s+)?REVO\b/i],
    ["Hilux Vigo", /\b(?:HILUX\s+)?VIGO\b/i],
    ["Ranger", /\bRANGER\b/i],
    ["D-Max", /\bD[\s-]?MAX\b/i],
    ["Triton", /\bTRITON\b/i],
    ["Navara", /\bNAVARA\b/i],
    ["BT-50", /\bBT[\s-]?50\b/i],
  ].find(([, pattern]) => pattern.test(normalized))?.[0];
  const transmission = /\b(?:A\/?T|AUTO(?:MATIC)?)\b/i.test(normalized)
    ? "AT"
    : /\b(?:M\/?T|MANUAL)\b/i.test(normalized) ? "MT" : undefined;
  const driveType = /\b(?:4WD|4X4)\b/i.test(normalized)
    ? "4WD"
    : /\b(?:2WD|4X2)\b/i.test(normalized) ? "2WD" : undefined;
  const bodyType = /\b(?:DOUBLE\s+CAB|D\/?C)\b/i.test(normalized)
    ? "Double Cab"
    : /\b(?:SMART\s+CAB|EXTRA\s+CAB)\b/i.test(normalized)
      ? "Extended Cab"
      : /\bSINGLE\s+CAB\b/i.test(normalized) ? "Single Cab" : undefined;

  return {
    brand,
    model,
    year,
    transmission,
    drive_type: driveType,
    body_type: bodyType,
    mileage_km: mileageKm,
    source_price_thb: sourcePriceThb,
  };
}

function fieldConfidence(value, explicit = 90) {
  return value === undefined || value === "" ? undefined : explicit;
}

function customerSummary(facts) {
  const identity = [facts.year, facts.brand, facts.model].filter(Boolean).join(" ") || "Vehicle candidate";
  const details = [
    facts.transmission && `${facts.transmission} transmission`,
    facts.drive_type,
    facts.body_type,
    facts.mileage_km !== undefined && `${facts.mileage_km.toLocaleString("en-US")} km`,
  ].filter(Boolean);
  return `${identity}${details.length ? ` with ${details.join(", ")}` : ""}. Availability and final price require NK verification.`;
}

export function normalizeCandidate(listing, context = {}) {
  const sourceUrl = cleanText(listing.source_url || listing.canonical_url || listing.final_url, 3_000);
  const title = cleanText(listing.title, 500);
  const description = cleanText(listing.description, 30_000);
  const listingText = cleanText(listing.listing_text, 30_000) || [title, description].filter(Boolean).join(" ");
  const facts = vehicleFacts([title, description, listingText, listing.source_price].filter(Boolean).join(" "));
  const observedAt = cleanText(listing.observed_at, 100) || new Date().toISOString();
  const sourceListingId = cleanText(listing.source_listing_id, 200)
    || sourceUrl.match(/\/marketplace\/item\/(\d+)/i)?.[1]
    || "";
  const stableKey = sourceListingId || sourceUrl || `${title}:${observedAt}`;
  const candidateId = `cand_${createHash("sha256").update(stableKey).digest("hex").slice(0, 20)}`;
  const confidence = Object.fromEntries(Object.entries(facts)
    .map(([field, value]) => [field, fieldConfidence(value)])
    .filter(([, value]) => value !== undefined));

  return {
    candidate_id: candidateId,
    search_request_id: cleanText(context.search_request_id, 100),
    search_run_id: cleanText(context.search_run_id, 100),
    status: "found_unverified",
    ...facts,
    images: Array.isArray(listing.images) ? listing.images.slice(0, 30) : [],
    source: {
      platform: "facebook_marketplace",
      source_url: sourceUrl,
      source_listing_id: sourceListingId,
      title,
      listing_text: listingText,
      seller: cleanText(listing.seller, 500),
      location: cleanText(listing.location, 500),
      observed_at: observedAt,
      verified: false,
    },
    confidence,
    provenance: {
      adapter: cleanText(context.adapter, 100) || "facebook_playwright",
      evidence: [title && "listing_title", description && "listing_description", listingText && "listing_text"]
        .filter(Boolean),
    },
    customer_result: {
      candidate_id: candidateId,
      status: "Estimated / Unverified",
      brand: facts.brand,
      model: facts.model,
      year: facts.year,
      transmission: facts.transmission,
      drive_type: facts.drive_type,
      body_type: facts.body_type,
      mileage_km: facts.mileage_km,
      customer_price: null,
      summary_en: customerSummary(facts),
    },
  };
}

export function candidateMatchesRequest(candidate, request) {
  const failures = [];
  if (request.brand && candidate.brand && candidate.brand.toLowerCase() !== request.brand.toLowerCase()) failures.push("brand");
  if (request.model && candidate.model && !candidate.model.toLowerCase().includes(request.model.toLowerCase())) failures.push("model");
  if (request.year_from && candidate.year && candidate.year < request.year_from) failures.push("year_from");
  if (request.year_to && candidate.year && candidate.year > request.year_to) failures.push("year_to");
  if (request.transmission && candidate.transmission && candidate.transmission !== request.transmission) failures.push("transmission");
  if (request.drive_type && candidate.drive_type && candidate.drive_type !== request.drive_type) failures.push("drive_type");
  if (request.maximum_mileage_km && candidate.mileage_km && candidate.mileage_km > request.maximum_mileage_km) failures.push("maximum_mileage_km");
  if (request.maximum_source_price_thb && candidate.source_price_thb && candidate.source_price_thb > request.maximum_source_price_thb) failures.push("maximum_source_price_thb");
  const searchable = JSON.stringify(candidate).toLowerCase();
  for (const keyword of request.required_keywords) {
    if (!searchable.includes(keyword.toLowerCase())) failures.push(`required:${keyword}`);
  }
  for (const keyword of request.excluded_keywords) {
    if (searchable.includes(keyword.toLowerCase())) failures.push(`excluded:${keyword}`);
  }
  return { matches: failures.length === 0, failures };
}
