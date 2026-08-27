import crypto from "node:crypto";

const FACEBOOK_HOSTS = new Set(["facebook.com", "fb.com"]);
const IMAGE_HOSTS = new Set(["fbcdn.net", "fbsbx.com"]);
const TRANSMISSIONS = new Set(["AT", "MT"]);
const DRIVES = new Set(["2WD", "4WD"]);

function cleanText(value, max = 500) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function requiredText(value, label, max) {
  const normalized = cleanText(value, max);
  if (!normalized) throw new Error(`invalid_${label}`);
  return normalized;
}

function optionalInteger(value, min, max) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error("invalid_candidate");
  return parsed;
}

function uuid(value, label) {
  const normalized = requiredText(value, label, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
    throw new Error(`invalid_${label}`);
  }
  return normalized;
}

function trustedHost(hostname, roots) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return [...roots].some((root) => host === root || host.endsWith(`.${root}`));
}

function safeHttpsUrl(value, roots, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`invalid_${label}`);
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port || !trustedHost(url.hostname, roots)) {
    throw new Error(`invalid_${label}`);
  }
  url.hash = "";
  return url.toString();
}

function normalizedImages(value) {
  if (!Array.isArray(value) || value.length > 30) throw new Error("invalid_candidate_images");
  const seen = new Set();
  const images = [];
  for (const item of value) {
    const image = safeHttpsUrl(item, new Set([...FACEBOOK_HOSTS, ...IMAGE_HOSTS]), "candidate_image");
    const parsed = new URL(image);
    const identity = `${parsed.hostname.toLowerCase()}${parsed.pathname}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    images.push(image);
  }
  return images;
}

function observedAt(value) {
  const parsed = new Date(value || Date.now());
  if (Number.isNaN(parsed.valueOf()) || parsed > new Date(Date.now() + 5 * 60_000)) throw new Error("invalid_candidate_observed_at");
  return parsed.toISOString();
}

function summary(candidate) {
  const identity = [candidate.year, candidate.brand, candidate.model].filter(Boolean).join(" ") || "Vehicle candidate";
  const facts = [candidate.transmission, candidate.driveType, candidate.bodyType, candidate.mileageKm !== null ? `${candidate.mileageKm.toLocaleString("en-US")} km` : ""].filter(Boolean);
  return `${identity}${facts.length ? ` with ${facts.join(", ")}` : ""}. Availability, condition, and final price require NK verification.`;
}

export function normalizeCandidateSubmission(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !value.candidate || typeof value.candidate !== "object" || Array.isArray(value.candidate)) {
    throw new Error("invalid_candidate_submission");
  }
  const raw = value.candidate;
  const source = raw.source;
  if (!source || typeof source !== "object" || Array.isArray(source) || source.platform !== "facebook_marketplace") {
    throw new Error("invalid_candidate_source");
  }
  const candidateId = requiredText(raw.candidate_id, "candidate_id", 100);
  if (!/^cand_[a-f0-9]{12,64}$/i.test(candidateId)) throw new Error("invalid_candidate_id");
  const sourceUrl = safeHttpsUrl(source.source_url, FACEBOOK_HOSTS, "candidate_source_url");
  const listingId = cleanText(source.source_listing_id, 200) || new URL(sourceUrl).pathname.match(/\/marketplace\/item\/(\d+)/i)?.[1] || "";
  const sourceKey = listingId || crypto.createHash("sha256").update(sourceUrl).digest("hex").slice(0, 24);
  const sourceReference = `FB-MKT-${sourceKey}`.slice(0, 180);
  const vehicleId = `nk-auto-${crypto.createHash("sha256").update(sourceReference).digest("hex").slice(0, 20)}`;
  const title = cleanText(source.title, 500) || "Vehicle candidate awaiting review";
  const brand = cleanText(raw.brand, 120) || "Need Review";
  const model = cleanText(raw.model, 160) || "Need Review";
  const year = optionalInteger(raw.year, 1900, 2100);
  const transmission = TRANSMISSIONS.has(raw.transmission) ? raw.transmission : "Unknown";
  const driveType = DRIVES.has(raw.drive_type) ? raw.drive_type : "Unknown";
  const bodyType = cleanText(raw.body_type, 160) || "Pickup";
  const mileageKm = optionalInteger(raw.mileage_km, 0, 5_000_000);
  const sourcePriceThb = optionalInteger(raw.source_price_thb, 0, 1_000_000_000);
  const seenAt = observedAt(source.observed_at);
  const location = cleanText(source.location, 500) || "Location requires review";
  const seller = cleanText(source.seller, 500) || "Seller details require review";
  const listingText = cleanText(source.listing_text, 9_000);
  const images = normalizedImages(raw.images || []);
  const normalized = {
    candidateId,
    commandId: uuid(value.commandId, "command_id"),
    ruleId: uuid(value.ruleId, "rule_id"),
    vehicleId,
    sourceReference,
    sourceUrl,
    sourceListingId: listingId,
    brand,
    model,
    year,
    transmission,
    driveType,
    bodyType,
    mileageKm,
    sourcePriceThb,
    observedAt: seenAt,
    title,
    location,
    seller,
    listingText,
    images,
  };
  normalized.internalRecord = {
    vehicleId,
    sourceReference,
    adapterId: "facebook_marketplace_worker",
    publicationStatus: "Needs Review",
    visibility: "INTERNAL_ONLY",
    title,
    summary: summary(normalized),
    brand,
    model,
    year,
    grade: "Need Review",
    engine: "Need Review",
    transmission,
    drive: driveType,
    body: bodyType,
    mileageKm,
    color: "Need Review",
    observedPriceThb: sourcePriceThb,
    observedAt: seenAt,
    generalLocation: location.slice(0, 180),
    availability: "Availability Not Yet Confirmed",
    translationState: "Need Review",
    evidenceLabels: ["Facebook listing title", listingText ? "Facebook listing text" : "Listing text missing", images.length ? `${images.length} source image URLs` : "Source images missing"],
    sourcePlatform: "Facebook Marketplace",
    sourceUrl,
    sellerName: seller,
    sellerPhone: "Not provided",
    exactLocation: location,
    internalNotes: `Automatically retained for Owner review. No availability claim or seller contact has been made.${listingText ? ` Source text: ${listingText}` : ""}`.slice(0, 10_000),
    originalMediaCount: images.length,
  };
  return normalized;
}

const LOCATION_ALIASES = new Map([
  ["Bangkok", ["bangkok", "กรุงเทพ"]],
  ["Nonthaburi", ["nonthaburi", "นนทบุรี"]],
  ["Pathum Thani", ["pathum thani", "ปทุมธานี"]],
  ["Samut Prakan", ["samut prakan", "สมุทรปราการ"]],
  ["Samut Sakhon", ["samut sakhon", "สมุทรสาคร"]],
  ["Nakhon Pathom", ["nakhon pathom", "นครปฐม"]],
]);

export function candidateMatchesRule(candidate, rule) {
  const failures = [];
  if (candidate.brand !== "Need Review" && candidate.brand.toLowerCase() !== rule.brand.toLowerCase()) failures.push("brand");
  if (rule.model && candidate.model !== "Need Review" && !candidate.model.toLowerCase().includes(rule.model.toLowerCase())) failures.push("model");
  if (candidate.year !== null && (candidate.year < rule.yearFrom || candidate.year > rule.yearTo)) failures.push("year");
  if (rule.maxSourcePriceThb !== null && candidate.sourcePriceThb !== null && candidate.sourcePriceThb > rule.maxSourcePriceThb) failures.push("price");
  const searchable = `${candidate.title} ${candidate.listingText} ${candidate.bodyType}`.toLowerCase();
  if (!/(pickup|truck|cab|กระบะ|revo|hilux)/i.test(searchable)) failures.push("body_type");
  for (const keyword of rule.requiredKeywords) if (!searchable.includes(keyword.toLowerCase())) failures.push(`required:${keyword}`);
  for (const keyword of rule.excludedKeywords) if (searchable.includes(keyword.toLowerCase())) failures.push(`excluded:${keyword}`);
  const locationText = candidate.location.toLowerCase();
  const locationMatch = rule.locations.some((name) => (LOCATION_ALIASES.get(name) || [name.toLowerCase()]).some((alias) => locationText.includes(alias)));
  if (!locationMatch) failures.push("location");
  return { matches: failures.length === 0, failures };
}
