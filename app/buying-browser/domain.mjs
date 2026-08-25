export const DEFAULT_COMMISSION_RATE = 10;

/** @type {import("./types").BrowseFilters} */
export const DEFAULT_FILTERS = Object.freeze({
  query: "",
  location: "All Thailand",
  yearFrom: "",
  yearTo: "",
  priceMin: "",
  priceMax: "",
  mileageMax: "",
  transmission: "Any",
  drive: "Any",
  body: "Any",
  sort: "recommended",
});

const INSPECTION_REGIONS = [
  { name: "Bangkok Metro", locations: ["Bangkok", "Nonthaburi", "Pathum Thani", "Samut Prakan"], base: 2900, travel: 600 },
  { name: "Central Thailand", locations: ["Ayutthaya", "Nakhon Pathom", "Saraburi", "Suphan Buri"], base: 2900, travel: 1200 },
  { name: "Eastern Thailand", locations: ["Chon Buri", "Rayong", "Pattaya", "Chanthaburi"], base: 2900, travel: 1600 },
  { name: "Northern Thailand", locations: ["Chiang Mai", "Chiang Rai", "Phitsanulok", "Lampang"], base: 2900, travel: 3100 },
  { name: "Northeastern Thailand", locations: ["Khon Kaen", "Nakhon Ratchasima", "Udon Thani", "Ubon Ratchathani"], base: 2900, travel: 3100 },
  { name: "Southern Thailand", locations: ["Songkhla", "Surat Thani", "Phuket", "Nakhon Si Thammarat"], base: 2900, travel: 4100 },
];

const numberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const safeTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

/**
 * @param {import("./types").CustomerListing[]} listings
 * @param {import("./types").BrowseFilters} filters
 * @returns {import("./types").CustomerListing[]}
 */
export function filterListings(listings, filters = DEFAULT_FILTERS) {
  const query = String(filters.query || "").trim().toLowerCase();
  const yearFrom = numberOrNull(filters.yearFrom);
  const yearTo = numberOrNull(filters.yearTo);
  const priceMin = numberOrNull(filters.priceMin);
  const priceMax = numberOrNull(filters.priceMax);
  const mileageMax = numberOrNull(filters.mileageMax);
  const results = listings.filter((listing) => {
    const haystack = [listing.title, listing.brand, listing.model, listing.grade, listing.engine, listing.body, listing.color, listing.generalLocation].filter(Boolean).join(" ").toLowerCase();
    if (query && !query.split(/\s+/).every((part) => haystack.includes(part))) return false;
    if (filters.location && filters.location !== "All Thailand" && listing.generalLocation !== filters.location) return false;
    if (yearFrom !== null && (listing.year === null || listing.year < yearFrom)) return false;
    if (yearTo !== null && (listing.year === null || listing.year > yearTo)) return false;
    if (priceMin !== null && (listing.observedPriceThb === null || listing.observedPriceThb < priceMin)) return false;
    if (priceMax !== null && (listing.observedPriceThb === null || listing.observedPriceThb > priceMax)) return false;
    if (mileageMax !== null && (listing.mileageKm === null || listing.mileageKm > mileageMax)) return false;
    if (filters.transmission && filters.transmission !== "Any" && listing.transmission !== filters.transmission) return false;
    if (filters.drive && filters.drive !== "Any" && listing.drive !== filters.drive) return false;
    if (filters.body && filters.body !== "Any" && listing.body !== filters.body) return false;
    return true;
  });
  const sorted = [...results];
  if (filters.sort === "price-low") sorted.sort((a, b) => (a.observedPriceThb ?? Number.MAX_SAFE_INTEGER) - (b.observedPriceThb ?? Number.MAX_SAFE_INTEGER));
  if (filters.sort === "price-high") sorted.sort((a, b) => (b.observedPriceThb ?? -1) - (a.observedPriceThb ?? -1));
  if (filters.sort === "year-new") sorted.sort((a, b) => (b.year ?? -1) - (a.year ?? -1));
  if (filters.sort === "mileage-low") sorted.sort((a, b) => (a.mileageKm ?? Number.MAX_SAFE_INTEGER) - (b.mileageKm ?? Number.MAX_SAFE_INTEGER));
  return sorted;
}

export function inspectionQuoteForLocation(location) {
  const normalized = String(location || "").toLowerCase();
  const region = INSPECTION_REGIONS.find((item) => item.locations.some((candidate) => normalized.includes(candidate.toLowerCase())));
  if (!region) return null;
  return { region: region.name, baseFeeThb: region.base, travelFeeThb: region.travel, totalThb: region.base + region.travel, status: "Quote Ready" };
}

export function calculatePricing(input) {
  const vehiclePrice = numberOrNull(input.vehiclePriceThb);
  const commissionRate = Number.isFinite(Number(input.commissionRate)) ? Math.max(0, Number(input.commissionRate)) : DEFAULT_COMMISSION_RATE;
  const commission = vehiclePrice === null ? null : Math.round(vehiclePrice * commissionRate / 100);
  const lines = [
    { key: "vehicle", label: "Vehicle purchase price", amountThb: vehiclePrice },
    { key: "commission", label: `NK service fee (${commissionRate}%)`, amountThb: commission },
    { key: "inspection", label: "Inspection & travel", amountThb: numberOrNull(input.inspectionTravelThb) },
    { key: "transport", label: "Domestic transport", amountThb: numberOrNull(input.domesticTransportThb) },
    { key: "repair", label: "Repair / modification", amountThb: numberOrNull(input.repairModificationThb) },
    { key: "shipping", label: "Export / shipping", amountThb: numberOrNull(input.exportShippingThb) },
    { key: "other", label: "Other agreed charges", amountThb: numberOrNull(input.otherAgreedThb) },
  ].map((line) => ({ ...line, status: line.amountThb === null ? "Pending" : "Known" }));
  return { commissionRate, commissionAmountThb: commission, knownSubtotalThb: lines.reduce((total, line) => total + (line.amountThb ?? 0), 0), pendingCount: lines.filter((line) => line.amountThb === null).length, lines };
}

/** @returns {import("./types").BuyingBrowserState} */
export function initialBuyingBrowserState() {
  return { version: 1, savedListingIds: [], cases: [], importedListings: [], sourceCaptures: [], generalMessages: [{ id: "welcome", sender: "NK AI", text: "Tell me the model, year, transmission, drive, body type, budget, and preferred Thai search area. I will only use available vehicle facts and will mark unknown information clearly.", createdAt: "2026-08-23T09:00:00.000Z" }] };
}

function nextCaseId(existingCases, now) {
  const year = new Date(now).getUTCFullYear();
  const highest = existingCases.reduce((value, item) => { const match = String(item.id || "").match(/(\d{6})$/); return Math.max(value, match ? Number(match[1]) : 0); }, 1244);
  return `NK-CASE-${year}-${String(highest + 1).padStart(6, "0")}`;
}

function externalHttpsUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

/**
 * @param {import("./types").CustomerListing} listing
 * @param {{submittedUrl:string,canonicalUrl?:string,sourcePlatform?:string,captureMethod?:"external_share_link"|"web_share_target"|"ios_share_extension"|"ios_wkwebview"|"android_webview"|"windows_webview2"|"manual_evidence",importStatus?:"imported"|"partial"|"evidence_only"}} input
 * @param {Date|string} [now]
 * @returns {import("./types").SourceCapture}
 */
export function createExternalSourceCapture(listing, input, now = new Date()) {
  const submittedUrl = externalHttpsUrl(input?.submittedUrl);
  if (!submittedUrl) throw new Error("valid_source_url_required");
  const canonicalUrl = externalHttpsUrl(input?.canonicalUrl) || submittedUrl;
  const importStatus = ["imported", "partial", "evidence_only"].includes(input?.importStatus) ? input.importStatus : "partial";
  return {
    id: `capture-${listing.id}`,
    listingId: listing.id,
    sourceReference: listing.sourceReference,
    adapterId: listing.adapterId,
    sourcePlatform: String(input?.sourcePlatform || "Facebook Marketplace").slice(0, 100),
    submittedUrl,
    canonicalUrl,
    captureMethod: ["web_share_target", "ios_share_extension", "ios_wkwebview", "android_webview", "windows_webview2", "manual_evidence"].includes(input?.captureMethod) ? input.captureMethod : "external_share_link",
    importStatus,
    capturedAt: safeTime(now),
  };
}

/**
 * @param {import("./types").CustomerListing} listing
 * @param {import("./types").VehicleCase[]} existingCases
 * @param {string} customerId
 * @param {Date|string} [now]
 * @param {string|null} [sourceCaptureId]
 */
export function createVehicleCase(listing, existingCases, customerId, now = new Date(), sourceCaptureId = null) {
  const existing = existingCases.find((item) => item.listingId === listing.id);
  if (existing) {
    if (!sourceCaptureId || existing.sourceCaptureId === sourceCaptureId) return { caseRecord: existing, created: false };
    const linkedAt = safeTime(now);
    return {
      caseRecord: {
        ...existing,
        sourceCaptureId,
        updatedAt: linkedAt,
        timeline: [...existing.timeline, { id: `${existing.id}-source-${linkedAt}`, title: "Source link captured", detail: "External source link captured internally and linked to this customer-safe Vehicle Case.", createdAt: linkedAt }],
      },
      created: false,
    };
  }
  const createdAt = safeTime(now);
  const caseId = nextCaseId(existingCases, createdAt);
  const quote = inspectionQuoteForLocation(listing.generalLocation);
  const caseRecord = {
    id: caseId, customerId, listingId: listing.id, sourceReference: listing.sourceReference, sourceCaptureId, createdAt, updatedAt: createdAt, status: "Saved", availability: "Availability Not Yet Confirmed", vehicle: { ...listing, availability: "Availability Not Yet Confirmed" }, commissionRate: DEFAULT_COMMISSION_RATE, inspectionQuote: quote, domesticTransportThb: null, repairModificationThb: null, exportShippingThb: null, otherAgreedThb: null,
    messages: [{ id: `${caseId}-welcome`, sender: "NK AI", text: `I created ${caseId} for this ${listing.title}. Availability and the current seller price have not been verified yet.`, createdAt, delivery: "Local preview" }],
    timeline: [{ id: `${caseId}-saved`, title: "Vehicle saved", detail: sourceCaptureId ? "External source link captured internally and customer-safe listing data saved as an NK Vehicle Case." : "Customer-safe source result saved as an NK Vehicle Case.", createdAt }],
  };
  return { caseRecord, created: true };
}

export function requestAvailability(caseRecord, now = new Date()) {
  if (caseRecord.availability === "Availability Check Requested") return caseRecord;
  const createdAt = safeTime(now);
  return { ...caseRecord, status: "Availability Requested", availability: "Availability Check Requested", vehicle: { ...caseRecord.vehicle, availability: "Availability Check Requested" }, updatedAt: createdAt,
    messages: [...caseRecord.messages, { id: `${caseRecord.id}-availability-customer-${createdAt}`, sender: "Customer", text: "Please check whether this vehicle is still available and confirm the current price, mileage, and VIN evidence.", createdAt, delivery: "Recorded" }, { id: `${caseRecord.id}-availability-ai-${createdAt}`, sender: "NK AI", text: "I prepared a Thai verification request for the NK sourcing team. No seller message has been sent from this preview. The case will remain unverified until a real response is recorded.", createdAt, delivery: "Prepared - not sent" }],
    timeline: [...caseRecord.timeline, { id: `${caseRecord.id}-availability-${createdAt}`, title: "Availability check requested", detail: "Seller inquiry prepared; awaiting an authorized send and real seller response.", createdAt }],
  };
}

export function requestInspection(caseRecord, now = new Date()) {
  if (!caseRecord.inspectionQuote || caseRecord.inspectionQuote.status === "Requested - Awaiting Provider") return caseRecord;
  const createdAt = safeTime(now);
  return { ...caseRecord, status: "Inspection Requested", updatedAt: createdAt, inspectionQuote: { ...caseRecord.inspectionQuote, status: "Requested - Awaiting Provider", requestedAt: createdAt },
    messages: [...caseRecord.messages, { id: `${caseRecord.id}-inspection-${createdAt}`, sender: "System", text: `Inspection requested at the configured price of THB ${caseRecord.inspectionQuote.totalThb.toLocaleString("en-US")}. No provider is assigned or booked yet.`, createdAt, delivery: "Recorded" }],
    timeline: [...caseRecord.timeline, { id: `${caseRecord.id}-inspection-${createdAt}`, title: "Inspection requested", detail: "Waiting for an approved provider to accept the job.", createdAt }],
  };
}

export function buildGroundedAssistantReply(caseRecord, question) {
  const text = String(question || "").toLowerCase();
  const vehicle = caseRecord.vehicle;
  if (/available|availability|still there|seller/.test(text)) return caseRecord.availability === "Verified Available" ? "This case has a recorded Verified Available status. Open the case timeline for the verification time and evidence." : `Availability is not confirmed. The current case state is “${caseRecord.availability}”. I will not guess or present the vehicle as available.`;
  if (/price|cost|fee|total|commission/.test(text)) {
    const pricing = calculatePricing({ vehiclePriceThb: vehicle.observedPriceThb, commissionRate: caseRecord.commissionRate, inspectionTravelThb: caseRecord.inspectionQuote?.totalThb ?? null, domesticTransportThb: caseRecord.domesticTransportThb, repairModificationThb: caseRecord.repairModificationThb, exportShippingThb: caseRecord.exportShippingThb, otherAgreedThb: caseRecord.otherAgreedThb });
    return `The known subtotal is THB ${pricing.knownSubtotalThb.toLocaleString("en-US")}, including a ${pricing.commissionRate}% NK service fee applied only to the observed vehicle price. ${pricing.pendingCount} cost line${pricing.pendingCount === 1 ? " is" : "s are"} still pending and excluded from that subtotal.`;
  }
  if (/inspection|inspect|condition/.test(text)) return !caseRecord.inspectionQuote ? "The vehicle location does not match a configured inspection zone yet. NK must confirm the location before quoting; I will not estimate the fee." : `The configured inspection and travel quote is THB ${caseRecord.inspectionQuote.totalThb.toLocaleString("en-US")} for ${caseRecord.inspectionQuote.region}. Current status: ${caseRecord.inspectionQuote.status}.`;
  if (/mileage|engine|transmission|drive|spec|model|year/.test(text)) return `${vehicle.title}: ${vehicle.engine || "engine unknown"}, ${vehicle.transmission}, ${vehicle.drive}, ${vehicle.body}, ${vehicle.mileageKm === null ? "mileage needs review" : `${vehicle.mileageKm.toLocaleString("en-US")} km`}. These are normalized from the available ${vehicle.demo ? "labeled demo evidence" : "captured listing evidence"} and remain subject to verification.`;
  return `${vehicle.summary} Availability, current price, VIN, and condition must be verified before purchase. Ask me about specifications, pricing, availability, or inspection and I will answer only from this case.`;
}

export function addCaseQuestion(caseRecord, question, now = new Date()) {
  const createdAt = safeTime(now); const trimmed = String(question || "").trim().slice(0, 1000); if (!trimmed) return caseRecord;
  return { ...caseRecord, updatedAt: createdAt, messages: [...caseRecord.messages, { id: `${caseRecord.id}-q-${createdAt}`, sender: "Customer", text: trimmed, createdAt, delivery: "Recorded" }, { id: `${caseRecord.id}-a-${createdAt}`, sender: "NK AI", text: buildGroundedAssistantReply(caseRecord, trimmed), createdAt, delivery: "Local preview" }] };
}

export function presentCustomerListing(source) {
  return { id: source.id, adapterId: source.adapterId, sourceReference: source.sourceReference, title: source.title, summary: source.summary, brand: source.brand, model: source.model, year: source.year, grade: source.grade, engine: source.engine, transmission: source.transmission, drive: source.drive, body: source.body, mileageKm: source.mileageKm, color: source.color, observedPriceThb: source.observedPriceThb, observedAt: source.observedAt, generalLocation: source.generalLocation, imageUrls: [...source.imageUrls], availability: source.availability, translationState: source.translationState, evidenceLabels: [...source.evidenceLabels], demo: Boolean(source.demo) };
}
