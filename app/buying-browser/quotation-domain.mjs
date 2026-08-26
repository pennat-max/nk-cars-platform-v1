import { CUSTOMER_FX_THB_PER_USD, assessQuotationReadiness, calculatePricing } from "./domain.mjs";

export function quotationMaterialKey(caseRecord) {
  return JSON.stringify({
    availability: caseRecord.availability,
    actualVehiclePurchasePriceThb: caseRecord.actualVehiclePurchasePriceThb ?? null,
    platformTransactionRate: caseRecord.platformTransactionRate,
    buyingServiceRate: caseRecord.buyingServiceRate,
    inspectionTravelThb: caseRecord.inspectionQuote?.status === "Quote Ready" ? caseRecord.inspectionQuote.totalThb : null,
    domesticTransportThb: caseRecord.domesticTransportThb ?? null,
    repairModificationThb: caseRecord.repairModificationThb ?? null,
    exportShippingThb: caseRecord.exportShippingThb ?? null,
    otherAgreedThb: caseRecord.otherAgreedThb ?? null,
  });
}

export function currentQuotationStatus(quotation, now = new Date()) {
  if (!quotation) return null;
  if (quotation.status === "Issued - Awaiting Acceptance" && new Date(quotation.validUntil).getTime() <= new Date(now).getTime()) return "Expired";
  return quotation.status;
}

export function issueQuotation(caseRecord, quotationNumber, now = new Date()) {
  const readiness = assessQuotationReadiness(caseRecord);
  if (!readiness.ready) throw new Error("quotation_not_ready");
  if (caseRecord.ownerVerification?.status !== "Owner Verified") throw new Error("owner_verification_required");
  if (caseRecord.quotationRequest?.status !== "Requested - Awaiting NK Review") throw new Error("quotation_request_required");
  const number = String(quotationNumber || "").trim();
  if (!/^QT-\d{4}-\d{6}$/.test(number)) throw new Error("invalid_quotation_number");
  const issuedAt = new Date(now).toISOString();
  const materialKey = quotationMaterialKey(caseRecord);
  const currentStatus = currentQuotationStatus(caseRecord.quotation, now);
  if (caseRecord.quotation?.materialKey === materialKey && ["Issued - Awaiting Acceptance", "Accepted"].includes(currentStatus)) {
    return { caseRecord, created: false };
  }
  const pricing = calculatePricing({
    vehiclePriceThb: caseRecord.actualVehiclePurchasePriceThb,
    platformTransactionRate: caseRecord.platformTransactionRate,
    buyingServiceRate: caseRecord.buyingServiceRate,
    inspectionTravelThb: caseRecord.inspectionQuote?.totalThb ?? null,
    domesticTransportThb: caseRecord.domesticTransportThb,
    repairModificationThb: caseRecord.repairModificationThb,
    exportShippingThb: caseRecord.exportShippingThb,
    otherAgreedThb: caseRecord.otherAgreedThb,
  });
  if (pricing.pendingCount > 0) throw new Error("quotation_not_ready");
  const validUntil = new Date(new Date(issuedAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const quotation = {
    number,
    status: "Issued - Awaiting Acceptance",
    issuedAt,
    validUntil,
    acceptedAt: null,
    fxRateThbPerUsd: CUSTOMER_FX_THB_PER_USD,
    totalThb: pricing.knownSubtotalThb,
    totalUsd: Math.round(pricing.knownSubtotalThb / CUSTOMER_FX_THB_PER_USD),
    pricing,
    materialKey,
    visibility: "CUSTOMER_VISIBLE",
  };
  return {
    created: true,
    caseRecord: {
      ...caseRecord,
      quotation,
      updatedAt: issuedAt,
      messages: [...caseRecord.messages, {
        id: `${caseRecord.id}-quotation-issued-${issuedAt}`,
        sender: "NK Team",
        text: `Quotation ${number} is ready for review and is valid until ${validUntil}. No PI, payment, or vehicle purchase has been created.`,
        createdAt: issuedAt,
        delivery: "Recorded",
      }],
      timeline: [...caseRecord.timeline, {
        id: `${caseRecord.id}-quotation-issued-${issuedAt}`,
        title: "Quotation issued",
        detail: `${number} was approved from verified Case facts. Customer acceptance is required before PI review.`,
        createdAt: issuedAt,
      }],
    },
  };
}

export function acceptQuotation(caseRecord, quotationNumber, now = new Date()) {
  if (!caseRecord.quotation || caseRecord.quotation.number !== quotationNumber) throw new Error("quotation_not_found");
  if (caseRecord.quotation.materialKey !== quotationMaterialKey(caseRecord)) throw new Error("quotation_material_changed");
  const status = currentQuotationStatus(caseRecord.quotation, now);
  if (status === "Expired") throw new Error("quotation_expired");
  if (status === "Superseded") throw new Error("quotation_superseded");
  if (status === "Accepted") return { caseRecord, accepted: false };
  if (status !== "Issued - Awaiting Acceptance") throw new Error("quotation_not_accepting");
  const acceptedAt = new Date(now).toISOString();
  return {
    accepted: true,
    caseRecord: {
      ...caseRecord,
      quotation: { ...caseRecord.quotation, status: "Accepted", acceptedAt },
      updatedAt: acceptedAt,
      messages: [...caseRecord.messages, {
        id: `${caseRecord.id}-quotation-accepted-${acceptedAt}`,
        sender: "Customer",
        text: `I accept quotation ${caseRecord.quotation.number} with its recorded vehicle and service amounts.`,
        createdAt: acceptedAt,
        delivery: "Recorded",
      }, {
        id: `${caseRecord.id}-quotation-accepted-system-${acceptedAt}`,
        sender: "System",
        text: "Quotation acceptance recorded. PI review may now proceed, but no PI, payment confirmation, seller payment, or vehicle purchase has occurred.",
        createdAt: acceptedAt,
        delivery: "Recorded",
      }],
      timeline: [...caseRecord.timeline, {
        id: `${caseRecord.id}-quotation-accepted-${acceptedAt}`,
        title: "Quotation accepted",
        detail: `${caseRecord.quotation.number} was accepted by the signed-in customer. PI remains a separate controlled step.`,
        createdAt: acceptedAt,
      }],
    },
  };
}
