import { DEFAULT_FILTERS, filterListings, presentCustomerListing } from "../domain.mjs";
import type { CustomerListing, SourceAdapterStatus } from "../types";
import type { BuyingBrowserSourceAdapter, LinkImportCapability, SourceSearchRequest, SourceSearchResponse } from "./contracts";
import { demoInternalSourceRecords } from "./demo-internal-data";
import { capturedPocInternalSourceRecord } from "./sheet-poc-data";
function isFacebookHost(hostname: string) { const host = hostname.toLowerCase().replace(/^www\./, ""); return host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com" || host.endsWith(".fb.com"); }
export class DemoThaiMarketAdapter implements BuyingBrowserSourceAdapter {
  readonly id = "preview-thai-market";
  readonly label = "Owner capture snapshot and Thailand demo adapter";
  async getStatus(): Promise<SourceAdapterStatus> { return { adapterId:this.id,label:this.label,mode:"snapshot",live:false,state:"ready",message:"One Owner-selected listing snapshot is loaded. This is not a live source feed; labeled demo results and safe link/photo fallbacks remain active." }; }
  async search(request: SourceSearchRequest): Promise<SourceSearchResponse> {
    const safeListings = [capturedPocInternalSourceRecord, ...demoInternalSourceRecords].map((source) => presentCustomerListing(source) as CustomerListing);
    return { adapterId:this.id,mode:"snapshot",observedAt:"2026-08-25T13:21:03.000Z",results:filterListings(safeListings,request.filters || DEFAULT_FILTERS).slice(0,Math.max(1,Math.min(request.limit,50))) };
  }
  linkCapability(url: URL): LinkImportCapability { return isFacebookHost(url.hostname) ? { supported:true,method:"authorized_browser" } : { supported:false,method:"share_fallback" }; }
}
export const demoThaiMarketAdapter = new DemoThaiMarketAdapter();
