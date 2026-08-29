export const HISPEED_PURCHASE_PLANS = Object.freeze({
  standard: {
    id: "standard",
    markupRate: 0.1,
    flexStatus: "FLEX_NOT_REQUESTED",
    badge: "Recommended / Best Price",
    positioning: {
      en: "Best overall vehicle price. Pay 30% to secure the vehicle and complete the remaining 70% before shipment.",
      "zh-CN": "总购车成本更优惠。支付30%订金锁定车辆，剩余70%在发运前支付。",
      th: "ได้ราคารถโดยรวมที่ดีกว่า ชำระ 30% เพื่อล็อกรถ และชำระอีก 70% ก่อนจัดส่ง",
    },
    schedule: [
      { key: "deposit", percent: 30, timing: { en: "Deposit to secure vehicle", "zh-CN": "订金锁定车辆", th: "มัดจำเพื่อล็อกรถ" } },
      { key: "beforeShipment", percent: 70, timing: { en: "Balance before shipment", "zh-CN": "发运前支付余款", th: "ยอดคงเหลือก่อนจัดส่ง" } },
    ],
  },
  flex: {
    id: "flex",
    markupRate: 0.2,
    flexStatus: "FLEX_REQUESTED",
    badge: "Flexible Cash Flow / Subject to Approval",
    positioning: {
      en: "Pay less before shipment and keep more working capital. HiSpeed funds part of the transaction until the agreed destination milestone. Subject to approval.",
      "zh-CN": "发运前支付更少，保留更多流动资金。HiSpeed 为部分交易提供资金支持，余款在约定目的地节点支付。需审核批准。",
      th: "จ่ายก่อนส่งน้อยลง ช่วยรักษาเงินหมุนเวียน HiSpeed ร่วมออกเงินบางส่วนจนถึงจุดหมายที่ตกลง ต้องผ่านการอนุมัติ",
    },
    schedule: [
      { key: "initial", percent: 50, timing: { en: "Initial payment to secure/start purchase", "zh-CN": "首付款锁定并启动采购", th: "ชำระงวดแรกเพื่อล็อกและเริ่มจัดซื้อ" } },
      { key: "beforeShipment", percent: 20, timing: { en: "Before shipment", "zh-CN": "发运前支付", th: "ก่อนจัดส่ง" } },
      { key: "destination", percent: 30, timing: { en: "Approved destination milestone before controlled release", "zh-CN": "约定目的地节点，受控放行前支付", th: "จุดหมายที่อนุมัติ ก่อนปล่อยรถ/เอกสารแบบควบคุม" } },
    ],
  },
});

export const HISPEED_FLEX_STATUSES = Object.freeze([
  "FLEX_NOT_REQUESTED",
  "FLEX_REQUESTED",
  "FLEX_UNDER_REVIEW",
  "FLEX_APPROVED",
  "FLEX_DECLINED",
]);

export const HISPEED_PRESENTATION_FX = Object.freeze({
  en: { currency: "USD", thbPerUnit: 35, locale: "en-US" },
  "zh-CN": { currency: "CNY", thbPerUnit: 5, locale: "zh-CN" },
  th: { currency: "THB", thbPerUnit: 1, locale: "th-TH" },
});

export function hispeedCurrencyForLanguage(language = "zh-CN") {
  return HISPEED_PRESENTATION_FX[language] || HISPEED_PRESENTATION_FX["zh-CN"];
}

export function formatHiSpeedMoneyFromThb(valueThb, language = "zh-CN") {
  if (valueThb === null || valueThb === undefined) return "Pending";
  const fx = hispeedCurrencyForLanguage(language);
  const amount = Math.round(Number(valueThb) / fx.thbPerUnit);
  if (!Number.isFinite(amount)) return "Pending";
  return `${fx.currency} ${amount.toLocaleString(fx.locale)}`;
}

export function formatHiSpeedMoneyFromUsd(valueUsd, language = "zh-CN") {
  if (valueUsd === null || valueUsd === undefined) return "Pending";
  return formatHiSpeedMoneyFromThb(Math.round(Number(valueUsd) * HISPEED_PRESENTATION_FX.en.thbPerUnit), language);
}

export function hiSpeedMoneyInputToThb(value, language = "zh-CN") {
  const amount = Number(String(value || "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return String(Math.round(amount * hispeedCurrencyForLanguage(language).thbPerUnit));
}

export function hiSpeedFxDisclosure(language = "zh-CN") {
  const fx = hispeedCurrencyForLanguage(language);
  if (fx.currency === "THB") return "THB display";
  return `${fx.currency} 1 = THB ${fx.thbPerUnit}`;
}

export function normalizeHiSpeedPlan(planId) {
  return planId === "flex" ? "flex" : "standard";
}

export function calculateHiSpeedPurchasePlan(input = {}) {
  const sourceCostThb = moneyOrNull(input.sourceCostThb);
  const planId = normalizeHiSpeedPlan(input.planId);
  const plan = HISPEED_PURCHASE_PLANS[planId];
  const vehicleSellingPriceThb = sourceCostThb === null ? null : Math.round(sourceCostThb * (1 + plan.markupRate));
  const schedule = plan.schedule.map((item) => ({
    key: item.key,
    percent: item.percent,
    amountThb: vehicleSellingPriceThb === null ? null : Math.round((vehicleSellingPriceThb * item.percent) / 100),
    timing: item.timing,
    status: "Not calculated",
  }));
  return {
    planId,
    sourceCostThb,
    vehicleSellingPriceThb,
    schedule,
    flexStatus: planId === "flex" ? (input.flexStatus && HISPEED_FLEX_STATUSES.includes(input.flexStatus) ? input.flexStatus : "FLEX_REQUESTED") : "FLEX_NOT_REQUESTED",
    customerMarginDisclosure: {
      en: "Vehicle price includes HiSpeed sourcing and service margin.",
      "zh-CN": "车辆价格已包含 HiSpeed 采购及服务费用。",
      th: "ราคารถรวมค่าจัดหาและบริการของ HiSpeed แล้ว",
    },
  };
}

export function buildHiSpeedQuoteSnapshot(input = {}) {
  const purchase = calculateHiSpeedPurchasePlan(input);
  const inspectionTravelThb = moneyOrNull(input.inspectionTravelThb);
  const shippingEstimateThb = moneyOrNull(input.shippingEstimateThb);
  const otherApprovedCostsThb = moneyOrNull(input.otherApprovedCostsThb) || 0;
  const knownTotalThb = [
    purchase.vehicleSellingPriceThb,
    inspectionTravelThb,
    shippingEstimateThb,
    otherApprovedCostsThb,
  ].reduce((total, value) => total + (value || 0), 0);
  return {
    vehicleId: input.vehicleId || null,
    selectedPaymentPlan: purchase.planId,
    vehicleSellingPriceThb: purchase.vehicleSellingPriceThb,
    inspectionTravelThb,
    shippingEstimateThb,
    otherApprovedCostsThb,
    paymentSchedule: purchase.schedule,
    fxRateThbPerUsd: Number(input.fxRateThbPerUsd) || 35,
    validUntil: input.validUntil || null,
    quoteValidityDays: Number(input.quoteValidityDays) || 3,
    statuses: {
      vehicle: purchase.vehicleSellingPriceThb === null ? "Not calculated" : "Confirmed",
      inspectionTravel: inspectionTravelThb === null ? "Not calculated" : "Estimate",
      shipping: shippingEstimateThb === null ? "Not calculated" : "Estimate",
      other: otherApprovedCostsThb > 0 ? "Confirmed" : "Not calculated",
    },
    knownTotalThb,
    flexStatus: purchase.flexStatus,
  };
}

function moneyOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : null;
}
