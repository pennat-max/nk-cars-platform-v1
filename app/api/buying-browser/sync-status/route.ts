import { NextResponse } from "next/server";
import { getGoogleStagingSnapshot, getGoogleStagingStatus } from "../../../buying-browser/source-adapters/google-staging";

export const runtime = "nodejs";

export async function GET() {
  const status = await getGoogleStagingStatus();
  const snapshot = status.live ? await getGoogleStagingSnapshot().catch(() => null) : null;
  return NextResponse.json({
    adapter: status.adapterId,
    state: status.state,
    live: status.live,
    mode: status.mode,
    approvedVehicles: snapshot?.listings.length ?? null,
    approvedMedia: snapshot?.media.filter((item) => item.visibility === "CUSTOMER_VISIBLE" && item.reviewStatus === "Approved" && item.kind === "photo").length ?? null,
    synchronizedAt: snapshot?.fetchedAt ?? null,
    fallbackActive: !status.live,
  }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
