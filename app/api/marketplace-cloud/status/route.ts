import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const tokenConfigured = Boolean(process.env.BROWSERLESS_TOKEN?.trim());
  const profileConfigured = Boolean(process.env.BROWSERLESS_PROFILE?.trim());
  const legacyConnector = Boolean(
    process.env.MARKETPLACE_CONNECTOR_URL?.trim() && process.env.MARKETPLACE_CONNECTOR_TOKEN?.trim(),
  );
  return NextResponse.json({
    configured: (tokenConfigured && profileConfigured) || legacyConnector,
    provider: tokenConfigured || profileConfigured ? "Browserless Cloud Browser" : legacyConnector ? "Marketplace connector" : "Browserless Cloud Browser",
    tokenConfigured,
    profileConfigured,
    mode: "standard_browser",
    securityChecks: "stop_and_request_login",
  }, { headers: { "Cache-Control": "no-store" } });
}
