const UNKNOWN = Object.freeze({ value: "Unknown", source: "unknown", confidence: "low", status: "unknown" });

function evidence(value, source, confidence = "high", status = "confirmed", note) {
  return { value: String(value), source, confidence, status, ...(note ? { note } : {}) };
}

function firstMatch(text, patterns) {
  const candidates = Array.isArray(patterns) ? patterns : [patterns];
  for (const pattern of candidates) {
    const match = text.match(pattern);
    if (match) return match[1] || match[0];
  }
  return null;
}

/** @returns {import("./types").VehicleSpecEvidence[]} */
export function extractVehicleSpecs({ title = "", description = "", fields = {} } = {}) {
  const heading = String(title).replace(/\s+/g, " ").trim();
  const detail = String(description).replace(/\s+/g, " ").trim();
  const text = `${heading} ${detail}`;
  const year = fields.year || firstMatch(heading, /\b(19\d{2}|20\d{2})\b/);
  const engine = fields.engine || firstMatch(text, /\b(2\.[048]|3\.0)\s*(?:l|litre|liter|ดีเซล)?\b/i);
  const transmission = fields.transmission || (/\b(?:AT|A\/T|automatic)\b|เกียร์ออโต้|เกียร์อัตโนมัติ/i.test(text) ? "AT" : /\b(?:MT|M\/T|manual)\b|เกียร์ธรรมดา/i.test(text) ? "MT" : null);
  const drive = fields.drive || (/\b(?:4wd|4x4)\b|ขับสี่/i.test(text) ? "4WD" : /\b(?:2wd|4x2)\b/i.test(text) ? "2WD" : null);
  const mileage = fields.mileage || firstMatch(text, /(?:เลขไมล์|ไมล์|mileage|ขับไปแล้ว)\s*[:：]?\s*([0-9][0-9,]*)\s*(?:กม|km)/i);
  const body = fields.body || (/double\s*cab|4\s*ประตู|สี่ประตู/i.test(text) ? "Double Cab" : /smart\s*cab|แค็บ/i.test(text) ? "Smart Cab" : /single\s*cab|ตอนเดียว/i.test(text) ? "Single Cab" : null);
  const grade = fields.grade || firstMatch(text, /\b(Rocco|GR Sport|Prerunner|Z Edition|Entry|Mid)\b/i);
  const color = fields.color || null;
  const result = {
    year: year ? evidence(year, fields.year ? "listing_field" : "listing_title") : { ...UNKNOWN },
    engine: engine ? evidence(engine, fields.engine ? "listing_field" : "listing_description", fields.engine ? "high" : "medium", fields.engine ? "confirmed" : "inferred") : { ...UNKNOWN },
    transmission: transmission ? evidence(transmission, fields.transmission ? "listing_field" : "listing_description") : { ...UNKNOWN },
    drive: drive ? evidence(drive, fields.drive ? "listing_field" : "listing_description", fields.drive ? "high" : "medium", fields.drive ? "confirmed" : "inferred") : { ...UNKNOWN },
    body: body ? evidence(body, fields.body ? "listing_field" : "listing_description", fields.body ? "high" : "medium", fields.body ? "confirmed" : "inferred") : { ...UNKNOWN },
    mileage: mileage ? evidence(String(mileage).replace(/,/g, "") + " km", fields.mileage ? "listing_field" : "listing_description") : { ...UNKNOWN },
    color: color ? evidence(color, "listing_field") : { ...UNKNOWN },
    grade: grade ? evidence(grade, fields.grade ? "listing_field" : "listing_title", fields.grade ? "high" : "medium", fields.grade ? "confirmed" : "inferred") : { ...UNKNOWN },
  };
  return Object.entries(result).map(([field, item]) => ({ field, ...item }));
}

export function mergePhotoSpecEvidence(textEvidence, photoFacts = []) {
  const byField = new Map(textEvidence.map((item) => [item.field, { ...item }]));
  for (const photo of photoFacts) {
    if (!photo || !byField.has(photo.field) || !photo.value || photo.confidence === "low") continue;
    const current = byField.get(photo.field);
    if (current.status !== "unknown" && current.value.toLowerCase() !== String(photo.value).toLowerCase()) {
      byField.set(photo.field, { ...current, status: "conflict", note: `Listing evidence says ${current.value}; photo review suggests ${photo.value}.` });
    } else if (current.status === "unknown") {
      byField.set(photo.field, evidence(photo.value, "photo_review", photo.confidence || "medium", "inferred", photo.note));
      byField.get(photo.field).field = photo.field;
    }
  }
  return [...byField.values()];
}

/** @returns {{status: "passed" | "needs_review", checkedImages: number, note: string}} */
export function imageEvidenceGate({ imageCount = 0, duplicateCount = 0, unrelatedCount = 0, checkedImages = 0 } = {}) {
  const passed = imageCount >= 2 && duplicateCount === 0 && unrelatedCount === 0 && checkedImages >= Math.min(imageCount, 4);
  return { status: passed ? "passed" : "needs_review", checkedImages, note: passed ? "Image relevance and duplicate checks passed." : "Images need duplicate, relevance, or coverage review." };
}
