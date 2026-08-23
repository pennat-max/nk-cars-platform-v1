import type { BrowseFilters, CustomerListing, SourceAdapterStatus } from "../types";
export type SourceSearchRequest = { customerId: string; searchArea: string; filters: BrowseFilters; limit: number };
export type SourceSearchResponse = { adapterId: string; mode: "demo" | "live"; observedAt: string; results: CustomerListing[] };
export type LinkImportCapability = { supported: boolean; method: "api" | "authorized_browser" | "share_fallback" };
export interface BuyingBrowserSourceAdapter {
  readonly id: string;
  readonly label: string;
  getStatus(customerId: string): Promise<SourceAdapterStatus>;
  search(request: SourceSearchRequest): Promise<SourceSearchResponse>;
  linkCapability(url: URL): LinkImportCapability;
}
