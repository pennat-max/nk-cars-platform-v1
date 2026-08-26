import { assessQuotationReadiness } from "./domain.mjs";

const AVAILABILITY_STATES = new Set([
  "Availability Not Yet Confirmed",
  "Availability Check Requested",
  "Verified Available",
  "Price Changed",
  "Possibly Unavailable",
]);
const MAX_MONEY_THB = 100_000_000;

function moneyOrNull(value, label, positive = false) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < (positive ? 1 : 0) || amount > MAX_MONEY_THB) {
    throw new Error(`invalid_${label}`);
  }
  return amount;
}

export function normalizeOwnerCaseVerification(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_owner_case_verification");
  const availability = String(value.availability || "");
  if (!AVAILABILITY_STATES.has(availability)) throw new Error("invalid_availability");
  const evidenceNote = String(value.evidenceNote || "").trim();
  if (evidenceNote.length < 3 || evidenceNote.length > 1000) throw new Error("invalid_evidence_note");
  return {
    availability,
    actualVehiclePurchasePriceThb: moneyOrNull(value.actualVehiclePurchasePriceThb, "vehicle_price", true),
    inspectionTravelThb: moneyOrNull(value.inspectionTravelThb, "inspection_travel"),
    domesticTransportThb: moneyOrNull(value.domesticTransportThb, "domestic_transport"),
    repairModificationThb: moneyOrNull(value.repairModificationThb, "repair_modification"),
    exportShippingThb: moneyOrNull(value.exportShippingThb, "export_shipping"),
    otherAgreedThb: moneyOrNull(value.otherAgreedThb, "other_agreed"),
    evidenceNote,
  };
}

export function ownerCaseMaterialSnapshot(caseRecord) {
  return {
    availability: caseRecord.availability,
    actualVehiclePurchasePriceThb: caseRecord.actualVehiclePurchasePriceThb ?? null,
    inspectionTravelThb: caseRecord.inspectionQuote?.status === "Quote Ready" ? caseRecord.inspectionQuote.totalThb : null,
    domesticTransportThb: caseRecord.domesticTransportThb ?? null,
    repairModificationThb: caseRecord.repairModificationThb ?? null,
    exportShippingThb: caseRecord.exportShippingThb ?? null,
    otherAgreedThb: caseRecord.otherAgreedThb ?? null,
  };
}

export function applyOwnerCaseVerification(caseRecord, value, now = new Date()) {
  const input = normalizeOwnerCaseVerification(value);
  const createdAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const oldValue = ownerCaseMaterialSnapshot(caseRecord);
  const inspectionQuote = input.inspectionTravelThb === null
    ? null
    : {
        region: caseRecord.inspectionQuote?.region || "Owner-confirmed service area",
        baseFeeThb: input.inspectionTravelThb,
        travelFeeThb: 0,
        totalThb: input.inspectionTravelThb,
        status: "Quote Ready",
      };
  const nextCase = {
    ...caseRecord,
    availability: input.availability,
    vehicle: { ...caseRecord.vehicle, availability: input.availability },
    actualVehiclePurchasePriceThb: input.actualVehiclePurchasePriceThb,
    inspectionQuote,
    domesticTransportThb: input.domesticTransportThb,
    repairModificationThb: input.repairModificationThb,
    exportShippingThb: input.exportShippingThb,
    otherAgreedThb: input.otherAgreedThb,
    ownerVerification: { status: "Owner Verified", verifiedAt: createdAt },
    updatedAt: createdAt,
    messages: [...caseRecord.messages, {
      id: `${caseRecord.id}-owner-verification-message-${createdAt}`,
      sender: "NK Team",
      text: "NK reviewed the vehicle availability and commercial cost facts recorded for this case. Pending items remain clearly marked and no quotation, PI, payment, or purchase has been issued.",
      createdAt,
      delivery: "Recorded",
    }],
    timeline: [...caseRecord.timeline, {
      id: `${caseRecord.id}-owner-verification-${createdAt}`,
      title: "NK verification updated",
      detail: "Availability and material pricing facts were reviewed by an authorized Owner. Pending amounts were not estimated.",
      createdAt,
    }],
  };
  return {
    caseRecord: nextCase,
    oldValue,
    newValue: ownerCaseMaterialSnapshot(nextCase),
    evidenceNote: input.evidenceNote,
    quotationReadiness: assessQuotationReadiness(nextCase),
  };
}
