import { DEFAULT_FILTERS, filterListings, presentCustomerListing } from "../domain.mjs";
import type { CustomerListing, SourceAdapterStatus } from "../types";
import type { BuyingBrowserSourceAdapter, LinkImportCapability, SourceSearchRequest, SourceSearchResponse } from "./contracts";
import { demoInternalSourceRecords } from "./demo-internal-data";
function isFacebookHost(hostname: string) { const host = hostname.toLowerCase().replace(/^www\./, ""); return host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com" || host.endsWith(".fb.com"); }
export class DemoThaiMarketAdapter implements BuyingBrowserSourceAdapter {
  readonly id = "demo-thai-market";
  readonly label = "Thailand market demo adapter";
  async getStatus(): Promise<SourceAdapterStatus> { return { adapterId:this.id,label:this.label,mode:"demo",live:false,state:"not_connected",message:"Real source access is not connected. Labeled demo results and safe link/photo fallbacks are active." }; }
  async search(request: SourceSearchRequest): Promise<SourceSearchResponse> {
    const safeListings = demoInternalSourceRecords.map((source) => presentCustomerListing(source) as CustomerListing);
    return { adapterId:this.id,mode:"demo",observedAt:"2026-08-23T08:30:00.000Z",results:filterListings(safeListings,request.filters || DEFAULT_FILTERS).slice(0,Math.max(1,Math.min(request.limit,50))) };
  }
  linkCapability(url: URL): LinkImportCapability { return isFacebookHost(url.hostname) ? { supported:true,method:"authorized_browser" } : { supported:false,method:"share_fallback" }; }
}
export const demoThaiMarketAdapter = new DemoThaiMarketAdapter();
