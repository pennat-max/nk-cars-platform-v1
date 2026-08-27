import { getChatGPTUser } from "../chatgpt-auth";
import BuyingBrowserApp from "./BuyingBrowserApp";
import { DEFAULT_FILTERS } from "./domain.mjs";
import { customerMarketplaceAdapter } from "./source-adapters/customer-marketplace-adapter";
import { createCapturedPocCase } from "./source-adapters/sheet-poc-data";
import type { BuyingBrowserView, CustomerIdentity } from "./types";

function customerIdFromEmail(email: string | null) {
  if (!email) return "preview-james-mwangi";
  return `chatgpt-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)}`;
}

function customerIdFromAccountId(accountId: string) {
  return `chatgpt-${accountId}`;
}

export default async function BuyingBrowserRoute({ view, sourceId, caseId }: { view: BuyingBrowserView; sourceId?: string; caseId?: string }) {
  const signedIn = await getChatGPTUser();
  const demoWorkspaceEnabled = process.env.NK_ENABLE_DEMO_WORKSPACE !== "false";
  const customer: CustomerIdentity = signedIn
    ? { id: customerIdFromAccountId(signedIn.id), displayName: signedIn.displayName, email: signedIn.email, country: "Not set", destinationPort: "Not set", isPreview: false }
    : demoWorkspaceEnabled
      ? { id: "preview-james-mwangi", displayName: "James Mwangi", email: null, country: "Kenya", destinationPort: "Mombasa", isPreview: true }
      : { id: "guest-device", displayName: "Guest", email: null, country: "Not set", destinationPort: "Not set", isPreview: true };
  const [sourceStatus, result] = await Promise.all([
    customerMarketplaceAdapter.getStatus(),
    customerMarketplaceAdapter.search({ customerId: customer.id, searchArea: "Thailand", filters: { ...DEFAULT_FILTERS, location: "All Thailand" }, limit: 50 }),
  ]);
  return <BuyingBrowserApp view={view} sourceId={sourceId} caseId={caseId} customer={customer} sourceStatus={sourceStatus} listings={result.results} seedCases={signedIn || !demoWorkspaceEnabled ? [] : [createCapturedPocCase(customer.id)]} durableAccount={Boolean(signedIn)} legacyCustomerId={signedIn ? customerIdFromEmail(signedIn.email) : undefined} />;
}
