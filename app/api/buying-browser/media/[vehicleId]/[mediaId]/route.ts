import { NextResponse } from "next/server";
import { getDriveMedia, googleStagingMigrationBridgeEnabled } from "../../../../../buying-browser/source-adapters/google-staging";

export const runtime = "nodejs";

function safeId(value: string) {
  return /^[a-zA-Z0-9_-]{1,180}$/.test(value);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string; mediaId: string }> },
) {
  const { vehicleId, mediaId } = await params;
  if (!googleStagingMigrationBridgeEnabled() || !safeId(vehicleId) || !safeId(mediaId)) {
    return NextResponse.json({ error: "media_not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { bytes, media, contentType, etag } = await getDriveMedia(vehicleId, mediaId);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        "ETag": etag || `W/\"${vehicleId}-${media.mediaId}\"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "media_not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
