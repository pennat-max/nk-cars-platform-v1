import { useBuyingBrowser } from "./BuyingBrowserProvider";
import { localizeAvailability, localizeListingSummary, translate } from "./i18n.mjs";
import type { AvailabilityState, CustomerListing } from "./types";

export function useI18n() {
  const { language, setLanguage } = useBuyingBrowser();
  return {
    language,
    setLanguage,
    t: (key: string, variables?: Record<string, string | number>) => translate(language, key, variables),
    listingSummary: (listing: CustomerListing) => localizeListingSummary(listing, language),
    availabilityLabel: (status: AvailabilityState) => localizeAvailability(status, language),
  };
}
