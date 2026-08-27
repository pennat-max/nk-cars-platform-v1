import { allowedQnapIngressPath, qnapIngressAuthorized, qnapPrivateDataOrigin } from "../../buying-browser/qnap-ingress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 128_000;
const MAX_RESPONSE_BYTES = 1_000_000;

function json(error: string, status: number) {
  return Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
}

async function proxy(request: Request) {
  const url = new URL(request.url);
  if (!allowedQnapIngressPath(url.pathname)) return json("not_found", 404);
  const token = String(process.env.NK_INTERNAL_API_TOKEN || "");
  if (!qnapIngressAuthorized(request.headers.get("authorization"), token)) return json("authorization_required", 401);
  const internal = qnapPrivateDataOrigin();
  if (!internal) return json("qnap_data_service_unavailable", 503);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > MAX_REQUEST_BYTES) return json("invalid_request_body", 400);
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  if (body && body.byteLength > MAX_REQUEST_BYTES) return json("invalid_request_body", 400);

  const endpoint = new URL(url.pathname, `${internal.href.replace(/\/$/, "")}/`);
  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: request.method,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/json",
        ...(body ? { "content-type": "application/json" } : {}),
        ...(request.headers.get("x-nk-actor-id") ? { "x-nk-actor-id": request.headers.get("x-nk-actor-id")! } : {}),
        ...(request.headers.get("x-nk-actor-email") ? { "x-nk-actor-email": request.headers.get("x-nk-actor-email")! } : {}),
        ...(request.headers.get("x-nk-actor-roles") ? { "x-nk-actor-roles": request.headers.get("x-nk-actor-roles")! } : {}),
      },
    });
  } catch {
    return json("qnap_data_service_unavailable", 503);
  }

  const responseLength = Number(upstream.headers.get("content-length") || 0);
  if (responseLength > MAX_RESPONSE_BYTES) return json("qnap_response_too_large", 502);
  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength > MAX_RESPONSE_BYTES) return json("qnap_response_too_large", 502);
  return new Response(bytes, {
    status: upstream.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
