import { identityGatewayRedirect, safeIdentityReturnPath, type IdentitySocialProvider } from "../../../../chatgpt-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = safeIdentityReturnPath(requestUrl.searchParams.get("return_to") || "/buy/account");
  const requestedProvider = requestUrl.searchParams.get("provider");
  if (requestedProvider && requestedProvider !== "google" && requestedProvider !== "apple") {
    return Response.json({ error: "identity_provider_not_allowed" }, { status: 400, headers: { "cache-control": "no-store" } });
  }
  const destination = identityGatewayRedirect("sign-in", returnTo, requestedProvider as IdentitySocialProvider | undefined);
  if (!destination) {
    return Response.json({ error: "identity_provider_not_configured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  return Response.redirect(destination, 303);
}
