import { DEFAULT_FILTERS, filterListings } from "../domain.mjs";
import type { SourceAdapterStatus } from "../types";
import type { BuyingBrowserSourceAdapter, LinkImportCapability, SourceSearchRequest, SourceSearchResponse } from "./contracts";
import { capturedCustomerListings } from "./captured-customer-data";
import { getGoogleStagingSnapshot, getGoogleStagingStatus, googleStagingMigrationBridgeEnabled } from "./google-staging";
import { getQnapInventorySnapshot, getQnapInventoryStatus, qnapInventoryConfigured } from "./qnap-inventory";

function isFacebookHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com" || host.endsWith(".fb.com");
}

export class CustomerMarketplaceAdapter implements BuyingBrowserSourceAdapter {
  readonly id = "qnap-postgres";
  readonly label = "NK QNAP inventory";

  async getStatus(): Promise<SourceAdapterStatus> {
    const qnapStatus = await getQnapInventoryStatus();
    if (qnapStatus?.live) return qnapStatus;
    if (googleStagingMigrationBridgeEnabled()) {
      const googleStatus = await getGoogleStagingStatus();
      if (googleStatus.live) {
        return {
          adapterId: "google-migration-bridge",
          label: "Google migration bridge",
          mode: "fallback",
          live: false,
          state: qnapInventoryConfigured() ? "error" : "not_connected",
          message: "QNAP is not available. NK is temporarily reading the legacy Google staging source while migration is completed.",
        };
      }
    }
    return {
      adapterId: "qnap-postgres",
      label: "NK QNAP inventory",
      mode: "snapshot",
      live: false,
      state: qnapStatus?.state || "not_connected",
      message: qnapInventoryConfigured()
        ? "QNAP inventory is unavailable. NK is showing the last verified repository snapshot."
        : "QNAP inventory is not connected in this runtime. NK is showing the last verified repository snapshot.",
    };
  }

  async search(request: SourceSearchRequest): Promise<SourceSearchResponse> {
    const qnapSnapshot = await getQnapInventorySnapshot().catch(() => null);
    if (qnapSnapshot) {
      return {
        adapterId: "qnap-postgres",
        mode: "live",
        observedAt: qnapSnapshot.observedAt,
        results: filterListings(qnapSnapshot.listings, request.filters || DEFAULT_FILTERS).slice(0, Math.max(1, Math.min(request.limit, 50))),
      };
    }
    const snapshot = googleStagingMigrationBridgeEnabled()
      ? await getGoogleStagingSnapshot().catch(() => null)
      : null;
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
