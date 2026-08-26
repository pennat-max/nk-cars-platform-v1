export type PricingSettings = {
  platformTransactionRate: number;
  buyingServiceRate: number;
};

export const TOTAL_NK_FEE_TARGET = 10;
export const PRICING_SETTINGS_STORAGE_KEY = "nk-cars-pricing-settings-v1";
export const DEFAULT_PRICING_SETTINGS: PricingSettings = Object.freeze({
  platformTransactionRate: 6,
  buyingServiceRate: 4,
});

function validRate(value: unknown) {
  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 0 && rate <= TOTAL_NK_FEE_TARGET ? rate : null;
}

export function normalizePricingSettings(value: unknown): PricingSettings {
  if (!value || typeof value !== "object") return { ...DEFAULT_PRICING_SETTINGS };
  const candidate = value as Partial<PricingSettings>;
  const platformTransactionRate = validRate(candidate.platformTransactionRate);
  const buyingServiceRate = validRate(candidate.buyingServiceRate);
  if (platformTransactionRate === null || buyingServiceRate === null) return { ...DEFAULT_PRICING_SETTINGS };
  if (Math.abs(platformTransactionRate + buyingServiceRate - TOTAL_NK_FEE_TARGET) > 0.0001) return { ...DEFAULT_PRICING_SETTINGS };
  return { platformTransactionRate, buyingServiceRate };
}

export function loadPricingSettings(): PricingSettings {
  if (typeof window === "undefined") return { ...DEFAULT_PRICING_SETTINGS };
  try {
    return normalizePricingSettings(JSON.parse(window.localStorage.getItem(PRICING_SETTINGS_STORAGE_KEY) || "null"));
  } catch {
    return { ...DEFAULT_PRICING_SETTINGS };
  }
}

export function savePricingSettings(settings: PricingSettings) {
  const normalized = normalizePricingSettings(settings);
  if (normalized.platformTransactionRate !== settings.platformTransactionRate || normalized.buyingServiceRate !== settings.buyingServiceRate) {
    throw new Error("nk_fee_rates_must_total_10");
  }
  window.localStorage.setItem(PRICING_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
