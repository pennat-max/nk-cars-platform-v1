const AVAILABILITY = new Set([
  "Availability Not Yet Confirmed",
  "Availability Check Requested",
  "Verified Available",
  "Price Changed",
  "Possibly Unavailable",
]);
const TRANSLATION_STATES = new Set(["Normalized", "Translation Pending", "Need Review"]);
const TRANSMISSIONS = new Set(["AT", "MT", "Unknown"]);
const DRIVES = new Set(["2WD", "4WD", "Unknown"]);

function text(value, maxLength = 2_000) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) throw new Error("qnap_inventory_invalid_listing");
  return value;
}

function nullableNumber(value) {
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0) throw new Error("qnap_inventory_invalid_listing");
  return value;
}

function customerMediaPath(value) {
  return typeof value === "string"
    && value.length <= 500
    && (/^\/vehicle-marketplace\/[a-zA-Z0-9_./-]+$/.test(value)
      || /^\/api\/buying-browser\/qnap-media\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(?:(?::|%3A)[a-zA-Z0-9_-]+)*$/i.test(value))
    && !value.includes("..");
}

export function parseQnapCustomerListing(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("qnap_inventory_invalid_listing");
  if (value.year !== null && (!Number.isSafeInteger(value.year) || value.year < 1900 || value.year > 2100)) throw new Error("qnap_inventory_invalid_listing");
  if (!TRANSMISSIONS.has(value.transmission) || !DRIVES.has(value.drive)) throw new Error("qnap_inventory_invalid_listing");
  if (!AVAILABILITY.has(value.availability) || !TRANSLATION_STATES.has(value.translationState)) throw new Error("qnap_inventory_invalid_listing");
  if (!Array.isArray(value.imageUrls) || value.imageUrls.length < 1 || value.imageUrls.length > 60 || !value.imageUrls.every(customerMediaPath)) {
    throw new Error("qnap_inventory_invalid_listing");
  }
  if (!Array.isArray(value.evidenceLabels) || value.evidenceLabels.length > 20 || !value.evidenceLabels.every((label) => typeof label === "string" && label.length <= 160)) {
    throw new Error("qnap_inventory_invalid_listing");
  }
  if (value.demo !== false) throw new Error("qnap_inventory_invalid_listing");

  // Build a new allowlisted DTO. Unknown/internal source fields are never passed through.
  return {
    id: text(value.id, 180),
    adapterId: "qnap-postgres",
    sourceReference: text(value.sourceReference, 180),
    title: text(value.title, 500),
    summary: text(value.summary, 4_000),
    brand: text(value.brand, 120),
    model: text(value.model, 160),
    year: value.year,
    grade: text(value.grade, 160),
    engine: text(value.engine, 160),
    transmission: value.transmission,
    drive: value.drive,
    body: text(value.body, 160),
    mileageKm: nullableNumber(value.mileageKm),
    color: text(value.color, 120),
    observedPriceThb: nullableNumber(value.observedPriceThb),
    observedAt: text(value.observedAt, 80),
    generalLocation: text(value.generalLocation, 180),
    imageUrls: [...value.imageUrls],
    availability: value.availability,
    translationState: value.translationState,
    evidenceLabels: [...value.evidenceLabels],
    demo: false,
  };
}

export function parseQnapInventoryPayload(payload, now = new Date()) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.listings)) throw new Error("qnap_inventory_invalid");
  return {
    listings: payload.listings.map(parseQnapCustomerListing),
    observedAt: typeof payload.observedAt === "string" ? payload.observedAt : now.toISOString(),
  };
}
