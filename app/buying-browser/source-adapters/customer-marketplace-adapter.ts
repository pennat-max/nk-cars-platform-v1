import { DEFAULT_FILTERS, filterListings } from "../domain.mjs";
import type { SourceAdapterStatus } from "../types";
import type { BuyingBrowserSourceAdapter, LinkImportCapability, SourceSearchRequest, SourceSearchResponse } from "./contracts";
import { capturedCustomerListings } from "./captured-customer-data";

function isFacebookHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com" || host.endsWith(".fb.com");
}

export class CustomerMarketplaceAdapter implements BuyingBrowserSourceAdapter {
  readonly id = "owner-reviewed-marketplace";
  readonly label = "NK owner-reviewed vehicle selection";

  async getStatus(): Promise<SourceAdapterStatus> {
    return {
      adapterId: this.id,
      label: this.label,
      mode: "snapshot",
      live: false,
      state: "ready",
      message: "Ten Owner-reviewed vehicle snapshots are available. Price and availability still require current NK verification.",
    };
  }

  async search(request: SourceSearchRequest): Promise<SourceSearchResponse> {
    return {
      adapterId: this.id,
      mode: "snapshot",
      observedAt: observedAt,
      results: filterListings(capturedCustomerListings, request.filters || DEFAULT_FILTERS).slice(0, Math.max(1, Math.min(request.limit, 50))),
    };
  }

  linkCapability(url: URL): LinkImportCapability {
    return isFacebookHost(url.hostname) ? { supported: true, method: "authorized_browser" } : { supported: false, method: "share_fallback" };
  }
}

const observedAt = "2026-08-25T15:51:43.342Z";
export const customerMarketplaceAdapter = new CustomerMarketplaceAdapter();
