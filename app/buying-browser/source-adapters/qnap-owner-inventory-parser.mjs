import { parseQnapCustomerListing } from "./qnap-inventory-parser.mjs";

const PUBLICATION_STATUS = new Map([
  ["APPROVED", "Approved for Browse"],
  ["NEEDS_REVIEW", "Needs Review"],
  ["REJECTED", "Rejected"],
  ["ARCHIVED", "Archived"],
]);
const TRANSMISSIONS = new Set(["AT", "MT", "Unknown"]);
const DRIVES = new Set(["2WD", "4WD", "Unknown"]);
const AVAILABILITY = new Set([
  "Availability Not Yet Confirmed",
  "Availability Check Requested",
  "Verified Available",
  "Price Changed",
  "Possibly Unavailable",
]);
const TRANSLATION_STATES = new Set(["Normalized", "Translation Pending", "Need Review"]);

function requiredText(value, maxLength = 2_000) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) throw new Error("qnap_owner_inventory_invalid_record");
  return value;
}

function nullableNumber(value) {
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0) throw new Error("qnap_owner_inventory_invalid_record");
  return value;
}

function sourceUrl(value) {
  const raw = requiredText(value, 3_000);
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("qnap_owner_inventory_invalid_record");
  }
  if (parsed.protocol !== "https:") throw new Error("qnap_owner_inventory_invalid_record");
  return raw;
}

function evidenceLabels(value) {
  if (!Array.isArray(value) || value.length > 20 || !value.every((label) => typeof label === "string" && label.length <= 160)) {
    throw new Error("qnap_owner_inventory_invalid_record");
  }
  return [...value];
}

function normalizedTransmission(value) {
  if (TRANSMISSIONS.has(value)) return value;
  if (value === "Conflict") return "Unknown";
  throw new Error("qnap_owner_inventory_invalid_record");
}

function normalizedTranslationState(value) {
  if (TRANSLATION_STATES.has(value)) return value;
  if (value === "Conflict") return "Need Review";
  throw new Error("qnap_owner_inventory_invalid_record");
}

function originalMediaCount(value) {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || value < 0 || value > 1_000) throw new Error("qnap_owner_inventory_invalid_record");
  return value;
}

function internalNotes(value) {
  if (typeof value !== "string" || value.length > 10_000) throw new Error("qnap_owner_inventory_invalid_record");
  return value;
}

function ownerMediaPaths(record, customerRecord) {
  if (record.media === undefined) return customerRecord ? [...customerRecord.imageUrls] : [];
  if (!Array.isArray(record.media) || record.media.length > 100) throw new Error("qnap_owner_inventory_invalid_media");
  const mediaIds = record.media.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("qnap_owner_inventory_invalid_media");
    const mediaId = requiredText(item.mediaId, 180);
    if (!/^[a-zA-Z0-9_-]+(?::[a-zA-Z0-9_-]+)*$/.test(mediaId) || !new Set(["CUSTOMER_VISIBLE", "INTERNAL_ONLY"]).has(item.visibility)) {
      throw new Error("qnap_owner_inventory_invalid_media");
    }
    return mediaId;
  });
  if (new Set(mediaIds).size !== mediaIds.length) throw new Error("qnap_owner_inventory_invalid_media");
  return mediaIds.map((mediaId) => `/api/buying-browser/owner/media/${encodeURIComponent(record.vehicleId)}/${encodeURIComponent(mediaId)}`);
}

function internalListing(record, internalRecord, customerRecord) {
  const id = requiredText(record.vehicleId, 180);
  const sourceReference = requiredText(record.sourceReference, 180);
  if (internalRecord.vehicleId !== id || internalRecord.sourceReference !== sourceReference) throw new Error("qnap_owner_inventory_identity_mismatch");
  if (customerRecord && (customerRecord.id !== id || customerRecord.sourceReference !== sourceReference)) throw new Error("qnap_owner_inventory_identity_mismatch");
  if (internalRecord.year !== null && (!Number.isSafeInteger(internalRecord.year) || internalRecord.year < 1900 || internalRecord.year > 2100)) {
    throw new Error("qnap_owner_inventory_invalid_record");
  }
  const transmission = normalizedTransmission(internalRecord.transmission);
  const translationState = normalizedTranslationState(internalRecord.translationState);
  const labels = [
    ...evidenceLabels(internalRecord.evidenceLabels),
    ...(internalRecord.transmission === "Conflict" ? ["Transmission conflict - Owner review required"] : []),
    ...(internalRecord.translationState === "Conflict" ? ["Conflicting source evidence - Owner review required"] : []),
  ];
  if (labels.length > 20) throw new Error("qnap_owner_inventory_invalid_record");
  if (!DRIVES.has(internalRecord.drive) || !AVAILABILITY.has(internalRecord.availability)) {
    throw new Error("qnap_owner_inventory_invalid_record");
  }
  const publicationStatus = PUBLICATION_STATUS.get(record.publicationStatus);
  if (!publicationStatus) throw new Error("qnap_owner_inventory_invalid_record");
  if (!new Set(["CUSTOMER_VISIBLE", "INTERNAL_ONLY"]).has(internalRecord.visibility)) throw new Error("qnap_owner_inventory_invalid_record");
  const visibility = internalRecord.visibility;
  if (record.publicationStatus === "APPROVED" && (!customerRecord || visibility !== "CUSTOMER_VISIBLE")) {
    throw new Error("qnap_owner_inventory_invalid_record");
  }
  if (record.publicationStatus !== "APPROVED" && visibility !== "INTERNAL_ONLY") throw new Error("qnap_owner_inventory_invalid_record");
  const mediaCount = originalMediaCount(internalRecord.originalMediaCount);

  return {
    id,
    adapterId: "qnap-postgres",
    sourceReference,
    title: requiredText(internalRecord.title, 500),
    summary: requiredText(internalRecord.summary, 4_000),
    brand: requiredText(internalRecord.brand, 120),
    model: requiredText(internalRecord.model, 160),
    year: internalRecord.year,
    grade: requiredText(internalRecord.grade, 160),
    engine: requiredText(internalRecord.engine, 160),
    transmission,
    drive: internalRecord.drive,
    body: requiredText(internalRecord.body, 160),
    mileageKm: nullableNumber(internalRecord.mileageKm),
    color: requiredText(internalRecord.color, 120),
    observedPriceThb: nullableNumber(internalRecord.observedPriceThb),
    observedAt: requiredText(internalRecord.observedAt || record.observedAt, 80),
    generalLocation: requiredText(internalRecord.generalLocation, 180),
    imageUrls: ownerMediaPaths(record, customerRecord),
    availability: internalRecord.availability,
    translationState,
    evidenceLabels: labels,
    demo: false,
    publicationStatus,
    visibility,
    sourcePlatform: requiredText(internalRecord.sourcePlatform, 200),
    sourceUrl: sourceUrl(internalRecord.sourceUrl),
    sellerName: requiredText(internalRecord.sellerName, 500),
    sellerPhone: requiredText(internalRecord.sellerPhone, 200),
    exactLocation: requiredText(internalRecord.exactLocation, 500),
    internalNotes: internalNotes(internalRecord.internalNotes),
    ...(mediaCount === undefined ? {} : { originalMediaCount: mediaCount }),
  };
}

function ownerRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("qnap_owner_inventory_invalid_record");
  if (!value.internalRecord || typeof value.internalRecord !== "object" || Array.isArray(value.internalRecord)) {
    throw new Error("qnap_owner_inventory_invalid_record");
  }
  const customerRecord = value.customerRecord === null || value.customerRecord === undefined
    ? null
    : parseQnapCustomerListing(value.customerRecord);
  return internalListing(value, value.internalRecord, customerRecord);
}

export function parseQnapOwnerInventoryPayload(payload, now = new Date()) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.records) || payload.records.length > 500) {
    throw new Error("qnap_owner_inventory_invalid");
  }
  const internalRecords = payload.records.map(ownerRecord);
  const ids = internalRecords.map((record) => record.id);
  const sourceReferences = internalRecords.map((record) => record.sourceReference);
  if (new Set(ids).size !== ids.length || new Set(sourceReferences).size !== sourceReferences.length) {
    throw new Error("qnap_owner_inventory_duplicate_identity");
  }
  return {
    internalRecords,
    observedAt: typeof payload.observedAt === "string" ? payload.observedAt : now.toISOString(),
  };
}
