import { useBuyingBrowser } from "./BuyingBrowserProvider";
import { localizeAvailability, localizeListingSummary, translate } from "./i18n.mjs";
import type { AvailabilityState, CustomerListing } from "./types";

export function useI18n() {
  const { language, setLanguage, storefront } = useBuyingBrowser();
  const storefrontName = language === "zh-CN" ? "像海" : "Xiangshihai";
  const brandText = (value: string) => storefront === "xiangshihai"
    ? String(value).replace(/\bNK Cars\b/g, storefrontName).replace(/\bNK AI\b/g, `${storefrontName} AI`).replace(/\bNK Team\b/g, `${storefrontName} Team`).replace(/\bNK\b/g, storefrontName)
    : value;
  return {
    language,
    setLanguage,
    brandText,
    t: (key: string, variables?: Record<string, string | number>) => brandText(translate(language, key, variables)),
    listingSummary: (listing: CustomerListing) => brandText(localizeListingSummary(listing, language)),
    availabilityLabel: (status: AvailabilityState) => brandText(localizeAvailability(status, language)),
  };
}
