import { getQnapOwnerMedia } from "../../../../../../buying-browser/source-adapters/qnap-inventory";

export const runtime = "nodejs";

function privateHost(host: string) {
  const name = host.split(":")[0].replace(/^\[|\]$/g, "");
  return name === "localhost" || name === "127.0.0.1" || /^192\.168\./.test(name) || /^10\./.test(name)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(name) || /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(name);
}

function safeVehicleId(value: string) {
  return /^[a-zA-Z0-9_-]{1,180}$/.test(value);
}

function safeMediaId(value: string) {
  return value.length <= 180 && /^[a-zA-Z0-9_-]+(?::[a-zA-Z0-9_-]+)*$/.test(value);
}

function missing() {
  return Response.json({ error: "media_not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request, { params }: { params: Promise<{ vehicleId: string; mediaId: string }> }) {
  if (!privateHost(new URL(request.url).host)) return missing();
  const { vehicleId, mediaId } = await params;
  if (!safeVehicleId(vehicleId) || !safeMediaId(mediaId)) return missing();
  try {
    const { bytes, contentType, etag } = await getQnapOwnerMedia(vehicleId, mediaId);
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        ETag: etag || `W/\"${vehicleId}-${mediaId}\"`,
      },
    });
  } catch {
    return missing();
  }
}
