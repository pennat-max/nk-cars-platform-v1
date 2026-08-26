const DEFAULT_SHEET_ID = "1IXEZTH2EYcIeM6HQKJ2Qfk4LZYsVWu4ipNolXoTnxhw";
const CUSTOMER_IMAGE_TYPES = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);

export function normalizeCustomerImageContentType(value) {
  const contentType = cleanString(value, 100).split(";", 1)[0].toLowerCase();
  if (contentType === "image/jpg") return "image/jpeg";
  return CUSTOMER_IMAGE_TYPES.has(contentType) ? contentType : "";
}

export async function readBoundedResponseBytes(response, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error("google_media_limit_invalid");
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > maxBytes) throw new Error("google_media_too_large");
  if (!response.body) throw new Error("google_media_body_missing");
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new Error("google_media_too_large");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function cleanString(value, max = 30_000) {
  return typeof value === "string" ? value.trim().slice(0, max) : String(value ?? "").trim().slice(0, max);
}

function requiredString(row, key, max = 3_000) {
  const value = cleanString(row[key], max);
  if (!value) throw new Error(`google_staging_missing_${key}`);
  return value;
}

function optionalNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function requiredPositiveInteger(row, key) {
  const value = Number(row[key]);
  if (!Number.isInteger(value) || value < 1) throw new Error(`google_staging_invalid_${key}`);
  return value;
}

function parseJsonStringArray(value) {
  try {
    const parsed = JSON.parse(cleanString(value, 10_000));
    return Array.isArray(parsed) ? parsed.map((item) => cleanString(item, 200)).filter(Boolean).slice(0, 30) : [];
  } catch {
    return [];
  }
}

function rowsByHeader(rows) {
  const [headerRow, ...dataRows] = rows;
  if (!headerRow?.length) throw new Error("google_staging_header_missing");
  const headers = headerRow.map((value) => cleanString(value, 100));
  if (new Set(headers).size !== headers.length || headers.some((value) => !value)) {
    throw new Error("google_staging_header_invalid");
  }
  return dataRows
    .filter((row) => row.some((value) => value !== "" && value !== null && value !== undefined))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

function validTransmission(value) {
  return value === "AT" || value === "MT" ? value : "Unknown";
}

function validDrive(value) {
  return value === "2WD" || value === "4WD" ? value : "Unknown";
}

function validAvailability(value) {
  const allowed = ["Availability Not Yet Confirmed", "Availability Check Requested", "Verified Available", "Price Changed", "Possibly Unavailable"];
  return allowed.includes(value) ? value : "Availability Not Yet Confirmed";
}

function validTranslation(value) {
  if (value === "Normalized" || value === "Need Review") return value;
  return "Translation Pending";
}

function mediaProxyUrl(vehicleId, mediaId) {
  return `/api/buying-browser/media/${encodeURIComponent(vehicleId)}/${encodeURIComponent(mediaId)}`;
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) throw new Error(`google_staging_duplicate_${label}`);
}

export function parseGoogleStagingValues(vehicleRows, mediaRows, fetchedAt = new Date().toISOString(), sheetId = DEFAULT_SHEET_ID) {
  const vehicles = rowsByHeader(vehicleRows);
  const parsedMedia = rowsByHeader(mediaRows).map((row) => ({
    mediaId: requiredString(row, "media_id", 120),
    vehicleId: requiredString(row, "vehicle_id", 160),
    sourceReference: requiredString(row, "source_reference", 160),
    sortOrder: requiredPositiveInteger(row, "sort_order"),
    driveFileId: requiredString(row, "drive_file_id", 200),
    visibility: cleanString(row.visibility) === "CUSTOMER_VISIBLE" ? "CUSTOMER_VISIBLE" : "INTERNAL_ONLY",
    reviewStatus: cleanString(row.review_status) === "Approved" ? "Approved" : cleanString(row.review_status) === "Rejected" ? "Rejected" : "Needs Review",
    kind: cleanString(row.kind, 50) || "photo",
    altText: cleanString(row.alt_text_en, 500),
    mimeType: cleanString(row.mime_type, 100) || "image/jpeg",
    uploadedAt: cleanString(row.uploaded_at, 100),
    fallbackPath: cleanString(row.fallback_path, 1_000),
  }));

  assertUnique(vehicles.map((row) => requiredString(row, "vehicle_id", 160)), "vehicle_id");
  assertUnique(parsedMedia.map((item) => `${item.vehicleId}:${item.mediaId}`), "media_id");

  const approvedMedia = new Map();
  for (const item of parsedMedia) {
    if (item.visibility !== "CUSTOMER_VISIBLE" || item.reviewStatus !== "Approved" || item.kind !== "photo") continue;
    const entries = approvedMedia.get(item.vehicleId) || [];
    entries.push(item);
    approvedMedia.set(item.vehicleId, entries);
  }
  for (const entries of approvedMedia.values()) entries.sort((a, b) => a.sortOrder - b.sortOrder);

  const listings = [];
  const internalRecords = [];
  for (const row of vehicles) {
    const id = requiredString(row, "vehicle_id", 160);
    const sourceReference = requiredString(row, "source_reference", 160);
    const images = approvedMedia.get(id) || [];
    const observedAt = requiredString(row, "observed_at", 100);
    const listing = {
      id,
      adapterId: "google-sheet-drive",
      sourceReference,
      title: requiredString(row, "title_en", 500),
      summary: requiredString(row, "summary_en", 5_000),
      brand: requiredString(row, "brand", 120),
      model: requiredString(row, "model", 160),
      year: optionalNumber(row.year),
      grade: cleanString(row.grade, 160) || "Need Review",
      engine: cleanString(row.engine, 160) || "Need Review",
      transmission: validTransmission(cleanString(row.transmission)),
      drive: validDrive(cleanString(row.drive)),
      body: cleanString(row.body, 160) || "Need Review",
      mileageKm: optionalNumber(row.mileage_km),
      color: cleanString(row.color, 120) || "Need Review",
      observedPriceThb: optionalNumber(row.observed_price_thb),
      observedAt,
      generalLocation: cleanString(row.general_location, 200) || "Thailand",
      imageUrls: images.map((item) => mediaProxyUrl(id, item.mediaId)),
      availability: validAvailability(cleanString(row.availability_status)),
      translationState: validTranslation(cleanString(row.translation_state)),
      evidenceLabels: parseJsonStringArray(row.evidence_labels_json),
      demo: false,
    };
    const driveFolderId = cleanString(row.drive_folder_id, 200);
    internalRecords.push({
      ...listing,
      publicationStatus: cleanString(row.publication_status, 100) || "Needs Review",
      visibility: cleanString(row.visibility) === "CUSTOMER_VISIBLE" ? "CUSTOMER_VISIBLE" : "INTERNAL_ONLY",
      sourcePlatform: cleanString(row.source_platform, 200) || "Unknown",
      sourceUrl: requiredString(row, "source_url", 3_000),
      sellerName: cleanString(row.seller_name, 500) || "Unknown",
      sellerPhone: cleanString(row.seller_phone, 200) || "Not available",
      exactLocation: cleanString(row.exact_location, 500) || listing.generalLocation,
      internalNotes: cleanString(row.internal_notes, 10_000),
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/edit`,
      evidenceFolderUrl: driveFolderId ? `https://drive.google.com/drive/folders/${encodeURIComponent(driveFolderId)}` : undefined,
      originalMediaCount: optionalNumber(row.original_media_count) ?? undefined,
    });
    if (
      cleanString(row.publication_status) === "Approved for Browse"
      && cleanString(row.visibility) === "CUSTOMER_VISIBLE"
      && images.length
    ) listings.push(listing);
  }

  const observedAt = listings.map((item) => item.observedAt).sort().at(-1) || fetchedAt;
  return { listings, internalRecords, media: parsedMedia, observedAt, fetchedAt };
}
