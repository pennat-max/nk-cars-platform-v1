import { DEFAULT_FILTERS, filterListings } from "../domain.mjs";
import type { SourceAdapterStatus } from "../types";
import type { BuyingBrowserSourceAdapter, LinkImportCapability, SourceSearchRequest, SourceSearchResponse } from "./contracts";
import { capturedCustomerListings } from "./captured-customer-data";
import { getGoogleStagingSnapshot, getGoogleStagingStatus } from "./google-staging";

function isFacebookHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com" || host.endsWith(".fb.com");
}

export class CustomerMarketplaceAdapter implements BuyingBrowserSourceAdapter {
  readonly id = "google-sheet-drive";
  readonly label = "Google Sheet + Drive staging";

  async getStatus(): Promise<SourceAdapterStatus> {
    return getGoogleStagingStatus();
  }

  async search(request: SourceSearchRequest): Promise<SourceSearchResponse> {
    const snapshot = await getGoogleStagingSnapshot().catch(() => null);
    const listings = snapshot?.listings || capturedCustomerListings;
    return {
      adapterId: this.id,
      mode: snapshot ? "live" : "snapshot",
      observedAt: snapshot?.observedAt || observedAt,
      results: filterListings(listings, request.filters || DEFAULT_FILTERS).slice(0, Math.max(1, Math.min(request.limit, 50))),
    };
  }

  linkCapability(url: URL): LinkImportCapability {
    return isFacebookHost(url.hostname) ? { supported: true, method: "authorized_browser" } : { supported: false, method: "share_fallback" };
  }
}

const observedAt = "2026-08-25T15:51:43.342Z";
export const customerMarketplaceAdapter = new CustomerMarketplaceAdapter();
