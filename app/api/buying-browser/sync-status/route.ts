import { NextResponse } from "next/server";
import { DEFAULT_FILTERS } from "../../../buying-browser/domain.mjs";
import { customerMarketplaceAdapter } from "../../../buying-browser/source-adapters/customer-marketplace-adapter";

export const runtime = "nodejs";

export async function GET() {
  const [status, snapshot] = await Promise.all([
    customerMarketplaceAdapter.getStatus(),
    customerMarketplaceAdapter.search({
      customerId: "system-sync-status",
      searchArea: "Thailand",
      filters: { ...DEFAULT_FILTERS, location: "All Thailand" },
      limit: 50,
    }),
  ]);
  return NextResponse.json({
    adapter: status.adapterId,
    state: status.state,
    live: status.live,
    mode: status.mode,
    approvedVehicles: status.live ? snapshot.results.length : null,
    approvedMedia: status.live ? snapshot.results.reduce((total, listing) => total + listing.imageUrls.length, 0) : null,
    synchronizedAt: status.live ? snapshot.observedAt : null,
    fallbackActive: !status.live,
  }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
