import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const exportPath = path.join(root, ".migration-private", "google-sheet-export.json");
const outputPath = path.join(root, ".migration-private", "qnap-inventory-seed.json");
const sheet = JSON.parse(await fs.readFile(exportPath, "utf8"));

function rowsByHeader(range) {
  const [header, ...rows] = range.values;
  return rows.map((values) => Object.fromEntries(header.map((name, index) => [name, values[index] ?? null])));
}

function numberOrNull(value) {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function jsonArray(value) {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

async function fileRecord(filePath, fields) {
  const data = await fs.readFile(filePath);
  const relativePath = path.relative(root, filePath).split(path.sep).join("/");
  return {
    ...fields,
    relativePath,
    sha256: crypto.createHash("sha256").update(data).digest("hex"),
    sizeBytes: data.length,
    lifecycleStage: "Source",
  };
}

const vehicleRows = rowsByHeader(sheet.vehicles);
const mediaRows = rowsByHeader(sheet.media);
const mediaByVehicle = new Map();
for (const media of mediaRows) {
  const rows = mediaByVehicle.get(media.vehicle_id) || [];
  rows.push(media);
  mediaByVehicle.set(media.vehicle_id, rows);
}
for (const rows of mediaByVehicle.values()) rows.sort((a, b) => Number(a.sort_order) - Number(b.sort_order));

const vehicles = vehicleRows.map((row) => {
  const approved = row.publication_status === "Approved for Browse" && row.visibility === "CUSTOMER_VISIBLE";
  const imageUrls = (mediaByVehicle.get(row.vehicle_id) || [])
    .filter((media) => media.visibility === "CUSTOMER_VISIBLE" && typeof media.fallback_path === "string" && media.fallback_path.startsWith("/vehicle-marketplace/"))
    .map((media) => media.fallback_path);
  const internalRecord = {
    vehicleId: row.vehicle_id,
    sourceReference: row.source_reference,
    adapterId: row.adapter_id,
    publicationStatus: row.publication_status,
    visibility: row.visibility,
    title: row.title_en,
    summary: row.summary_en,
    brand: row.brand,
    model: row.model,
    year: numberOrNull(row.year),
    grade: row.grade,
    engine: row.engine,
    transmission: row.transmission,
    drive: row.drive,
    body: row.body,
    mileageKm: numberOrNull(row.mileage_km),
    color: row.color,
    observedPriceThb: numberOrNull(row.observed_price_thb),
    observedAt: row.observed_at,
    generalLocation: row.general_location,
    availability: row.availability_status,
    translationState: row.translation_state,
    evidenceLabels: jsonArray(row.evidence_labels_json),
    sourcePlatform: row.source_platform,
    sourceUrl: row.source_url,
    sellerName: row.seller_name,
    sellerPhone: row.seller_phone,
    exactLocation: row.exact_location,
    internalNotes: row.internal_notes,
    originalMediaCount: numberOrNull(row.original_media_count),
    driveFolderId: row.drive_folder_id,
    photosFolderId: row.photos_folder_id,
  };
  const customerRecord = approved ? {
    id: row.vehicle_id,
    adapterId: row.adapter_id,
    sourceReference: row.source_reference,
    title: row.title_en,
    summary: row.summary_en,
    brand: row.brand,
    model: row.model,
    year: numberOrNull(row.year),
    grade: row.grade,
    engine: row.engine,
    transmission: row.transmission,
    drive: row.drive,
    body: row.body,
    mileageKm: numberOrNull(row.mileage_km),
    color: row.color,
    observedPriceThb: numberOrNull(row.observed_price_thb),
    observedAt: row.observed_at,
    generalLocation: row.general_location,
    imageUrls,
    availability: row.availability_status,
    translationState: row.translation_state,
    evidenceLabels: jsonArray(row.evidence_labels_json),
    demo: false,
  } : null;
  return {
    vehicleId: row.vehicle_id,
    sourceReference: row.source_reference,
    publicationStatus: approved ? "APPROVED" : "NEEDS_REVIEW",
    customerRecord,
    internalRecord,
    sourceAdapter: row.adapter_id,
    observedAt: row.observed_at,
  };
});

const media = [];
for (const row of mediaRows) {
  let filePath;
  if (row.visibility === "CUSTOMER_VISIBLE" && typeof row.fallback_path === "string") {
    filePath = path.join(root, "public", ...row.fallback_path.split("/").filter(Boolean));
  } else {
    const extension = row.mime_type === "image/png" ? "png" : "jpg";
    filePath = path.join(root, ".migration-private", "google-drive-media", row.vehicle_id, `${String(row.sort_order).padStart(3, "0")}-${row.media_id}.${extension}`);
  }
  media.push(await fileRecord(filePath, {
    mediaId: `${row.vehicle_id}:${row.media_id}`,
    vehicleId: row.vehicle_id,
    visibility: row.visibility,
    source: "google-drive-registry",
  }));
}

const sourceUrlToVehicle = new Map(vehicles.map((vehicle) => {
  const match = vehicle.internalRecord.sourceUrl?.match(/\/item\/(\d+)/);
  return [match?.[1] || "", vehicle.vehicleId];
}));
const repositoryEvidenceRoot = path.join(root, "private", "vehicle-evidence");
async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(target));
    else if (entry.isFile()) result.push(target);
  }
  return result;
}

for (const filePath of await walk(repositoryEvidenceRoot)) {
  const sourceItemId = filePath.split(path.sep).find((part) => sourceUrlToVehicle.has(part));
  const vehicleId = sourceUrlToVehicle.get(sourceItemId || "") || null;
  const hash = crypto.createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
  media.push(await fileRecord(filePath, {
    mediaId: `repository:${hash.slice(0, 24)}`,
    vehicleId,
    visibility: "INTERNAL_ONLY",
    source: "repository-private-evidence",
  }));
}

const sourceVersion = process.env.NK_CARS_SOURCE_VERSION || "working-tree";
const seed = {
  schemaVersion: 1,
  sourceVersion,
  generatedAt: new Date().toISOString(),
  spreadsheetId: sheet.spreadsheetId,
  vehicles,
  media,
};
await fs.writeFile(outputPath, JSON.stringify(seed), { mode: 0o600 });
console.log(JSON.stringify({
  outputPath,
  vehicles: vehicles.length,
  approved: vehicles.filter((vehicle) => vehicle.publicationStatus === "APPROVED").length,
  needsReview: vehicles.filter((vehicle) => vehicle.publicationStatus === "NEEDS_REVIEW").length,
  media: media.length,
  customerMedia: media.filter((item) => item.visibility === "CUSTOMER_VISIBLE").length,
  internalMedia: media.filter((item) => item.visibility === "INTERNAL_ONLY").length,
}));
