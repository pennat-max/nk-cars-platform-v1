import { getChatGPTUser } from "../chatgpt-auth";
import BuyingBrowserApp from "./BuyingBrowserApp";
import { DEFAULT_FILTERS } from "./domain.mjs";
import { demoThaiMarketAdapter } from "./source-adapters/demo-adapter";
import type { BuyingBrowserView, CustomerIdentity } from "./types";

function customerIdFromEmail(email: string | null) {
  if (!email) return "preview-james-mwangi";
  return `chatgpt-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)}`;
}

export default async function BuyingBrowserRoute({ view, sourceId, caseId }: { view: BuyingBrowserView; sourceId?: string; caseId?: string }) {
  const signedIn = await getChatGPTUser();
  const customer: CustomerIdentity = signedIn
    ? { id: customerIdFromEmail(signedIn.email), displayName: signedIn.displayName, email: signedIn.email, country: "Not set", destinationPort: "Not set", isPreview: false }
    : { id: "preview-james-mwangi", displayName: "James Mwangi", email: null, country: "Kenya", destinationPort: "Mombasa", isPreview: true };
  const [sourceStatus, result] = await Promise.all([
    demoThaiMarketAdapter.getStatus(),
    demoThaiMarketAdapter.search({ customerId: customer.id, searchArea: "Thailand", filters: { ...DEFAULT_FILTERS }, limit: 50 }),
  ]);
  return <BuyingBrowserApp view={view} sourceId={sourceId} caseId={caseId} customer={customer} sourceStatus={sourceStatus} listings={result.results} />;
}
