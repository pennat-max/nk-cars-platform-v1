import { getChatGPTUser, isOwnerUser } from "../../../../../../chatgpt-auth";
import { getQnapOwnerMedia } from "../../../../../../buying-browser/source-adapters/qnap-inventory";

export const runtime = "nodejs";

function safeVehicleId(value: string) {
  return /^[a-zA-Z0-9_-]{1,180}$/.test(value);
}

function safeMediaId(value: string) {
  return value.length <= 180 && /^[a-zA-Z0-9_-]+(?::[a-zA-Z0-9_-]+)*$/.test(value);
}

function notFound() {
  return Response.json({ error: "media_not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vehicleId: string; mediaId: string }> },
) {
  const user = await getChatGPTUser();
  const { vehicleId, mediaId } = await params;
  if (!isOwnerUser(user) || !safeVehicleId(vehicleId) || !safeMediaId(mediaId)) return notFound();

  try {
    const { bytes, contentType, etag } = await getQnapOwnerMedia(vehicleId, mediaId);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        "ETag": etag || `W/\"${vehicleId}-${mediaId}\"`,
      },
    });
  } catch {
    return notFound();
  }
}
