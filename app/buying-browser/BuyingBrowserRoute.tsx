import { getChatGPTUser, identitySignInOptions, identitySignInPath } from "../chatgpt-auth";
import BuyingBrowserApp from "./BuyingBrowserApp";
import { DEFAULT_FILTERS } from "./domain.mjs";
import { customerMarketplaceAdapter } from "./source-adapters/customer-marketplace-adapter";
import { createCapturedPocCase } from "./source-adapters/sheet-poc-data";
import type { BuyingBrowserView, CustomerIdentity } from "./types";
import { customerWorkspaceId } from "./workspace-state.mjs";

function customerIdFromEmail(email: string | null) {
  if (!email) return "preview-james-mwangi";
  return `chatgpt-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)}`;
}

function customerIdFromAccountId(accountId: string) {
  return customerWorkspaceId(accountId);
}

export default async function BuyingBrowserRoute({ view, sourceId, caseId }: { view: BuyingBrowserView; sourceId?: string; caseId?: string }) {
  const signedIn = await getChatGPTUser();
  const demoWorkspaceEnabled = process.env.NK_ENABLE_DEMO_WORKSPACE !== "false";
  const signInPath = identitySignInPath("/buy/account");
  const signInProviders = identitySignInOptions("/buy/account");
  const customer: CustomerIdentity = signedIn
    ? { id: customerIdFromAccountId(signedIn.id), displayName: signedIn.displayName, email: signedIn.email, country: "Not set", destinationPort: "Not set", isPreview: false, signInPath: null }
    : demoWorkspaceEnabled
      ? { id: "preview-james-mwangi", displayName: "James Mwangi", email: null, country: "Kenya", destinationPort: "Mombasa", isPreview: true, signInPath, signInProviders }
      : { id: "guest-device", displayName: "Guest", email: null, country: "Not set", destinationPort: "Not set", isPreview: true, signInPath, signInProviders };
  const [sourceStatus, result] = await Promise.all([
    customerMarketplaceAdapter.getStatus(),
    customerMarketplaceAdapter.search({ customerId: customer.id, searchArea: "Thailand", filters: { ...DEFAULT_FILTERS, location: "All Thailand" }, limit: 50 }),
  ]);
  return <BuyingBrowserApp view={view} sourceId={sourceId} caseId={caseId} customer={customer} sourceStatus={sourceStatus} listings={result.results} seedCases={signedIn || !demoWorkspaceEnabled ? [] : [createCapturedPocCase(customer.id)]} durableAccount={Boolean(signedIn)} legacyCustomerId={signedIn?.provider !== "qnap" ? customerIdFromEmail(signedIn?.email || null) : undefined} />;
}
