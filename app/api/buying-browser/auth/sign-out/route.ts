import { identityGatewayRedirect, safeIdentityReturnPath } from "../../../../chatgpt-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const returnTo = safeIdentityReturnPath(new URL(request.url).searchParams.get("return_to") || "/");
  const destination = identityGatewayRedirect("sign-out", returnTo);
  if (!destination) {
    return Response.json({ error: "identity_provider_not_configured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  return Response.redirect(destination, 303);
}
