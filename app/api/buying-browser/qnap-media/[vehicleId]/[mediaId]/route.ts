import { getQnapCustomerMedia } from "../../../../../buying-browser/source-adapters/qnap-inventory";

export const runtime = "nodejs";

function safeId(value: string) {
  return /^[a-zA-Z0-9_-]{1,180}$/.test(value);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vehicleId: string; mediaId: string }> },
) {
  const { vehicleId, mediaId } = await params;
  if (!safeId(vehicleId) || !safeId(mediaId)) {
    return Response.json({ error: "media_not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const { bytes, contentType, etag } = await getQnapCustomerMedia(vehicleId, mediaId);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        "ETag": etag || `W/\"${vehicleId}-${mediaId}\"`,
      },
    });
  } catch {
    return Response.json({ error: "media_not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
