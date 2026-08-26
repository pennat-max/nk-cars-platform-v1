import { quotationMaterialKey } from "./quotation-domain.mjs";

export function currentProformaInvoiceStatus(proformaInvoice, now = new Date()) {
  if (!proformaInvoice) return null;
  if (proformaInvoice.status === "Issued - Awaiting Payment" && new Date(proformaInvoice.validUntil).getTime() <= new Date(now).getTime()) return "Expired";
  return proformaInvoice.status;
}

export function issueProformaInvoice(caseRecord, piNumber, now = new Date()) {
  const quotation = caseRecord.quotation;
  if (!quotation || quotation.status !== "Accepted") throw new Error("accepted_quotation_required");
  if (quotation.materialKey !== quotationMaterialKey(caseRecord)) throw new Error("quotation_material_changed");
  const number = String(piNumber || "").trim();
  if (!/^PI-\d{4}-\d{6}$/.test(number)) throw new Error("invalid_pi_number");
  const currentStatus = currentProformaInvoiceStatus(caseRecord.proformaInvoice, now);
  if (caseRecord.proformaInvoice?.quotationNumber === quotation.number && caseRecord.proformaInvoice.materialKey === quotation.materialKey) {
    if (currentStatus === "Issued - Awaiting Payment") return { caseRecord, created: false };
    if (currentStatus === "Expired") throw new Error("pi_expired_recheck_required");
  }
  const issuedAt = new Date(now).toISOString();
  const validUntil = new Date(new Date(issuedAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const proformaInvoice = {
    number,
    status: "Issued - Awaiting Payment",
    issuedAt,
    validUntil,
    quotationNumber: quotation.number,
    fxRateThbPerUsd: quotation.fxRateThbPerUsd,
    totalThb: quotation.totalThb,
    totalUsd: quotation.totalUsd,
    pricing: structuredClone(quotation.pricing),
    materialKey: quotation.materialKey,
    visibility: "CUSTOMER_VISIBLE",
    paymentStatus: "Not Confirmed",
  };
  return {
    created: true,
    caseRecord: {
      ...caseRecord,
      proformaInvoice,
      updatedAt: issuedAt,
      messages: [...caseRecord.messages, {
        id: `${caseRecord.id}-pi-issued-${issuedAt}`,
        sender: "NK Team",
        text: `Proforma Invoice ${number} was issued from accepted quotation ${quotation.number} and is valid until ${validUntil}. Payment is not confirmed.`,
        createdAt: issuedAt,
        delivery: "Recorded",
      }],
      timeline: [...caseRecord.timeline, {
        id: `${caseRecord.id}-pi-issued-${issuedAt}`,
        title: "Proforma Invoice issued",
        detail: `${number} records the accepted quotation amounts. Authorized Finance must separately confirm actual funds received.`,
        createdAt: issuedAt,
      }],
    },
  };
}
