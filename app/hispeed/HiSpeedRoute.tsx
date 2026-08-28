import { getChatGPTUser, identitySignInOptions, identitySignInPath } from "../chatgpt-auth";
import { BuyingBrowserProvider } from "../buying-browser/BuyingBrowserProvider";
import { DEFAULT_FILTERS } from "../buying-browser/domain.mjs";
import { customerMarketplaceAdapter } from "../buying-browser/source-adapters/customer-marketplace-adapter";
import { createCapturedPocCase } from "../buying-browser/source-adapters/sheet-poc-data";
import type { BuyingBrowserView, CustomerIdentity, VehicleCase } from "../buying-browser/types";
import { customerWorkspaceId } from "../buying-browser/workspace-state.mjs";
import HiSpeedApp from "./HiSpeedApp";

function customerIdFromEmail(email: string | null) {
  if (!email) return "hispeed-preview-li-wei";
  return `chatgpt-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)}`;
}

function customerIdFromAccountId(accountId: string) {
  return customerWorkspaceId(accountId);
}

function hispeedSeedCase(customerId: string): VehicleCase {
  const seed = createCapturedPocCase(customerId);
  return { ...seed, customerId, channel: "hispeed" };
}

export default async function HiSpeedRoute({ view, sourceId, caseId }: { view: BuyingBrowserView; sourceId?: string; caseId?: string }) {
  const signedIn = await getChatGPTUser();
  const demoWorkspaceEnabled = process.env.NK_ENABLE_DEMO_WORKSPACE !== "false";
  const signInPath = identitySignInPath("/hispeed/account");
  const signInProviders = identitySignInOptions("/hispeed/account");
  const customer: CustomerIdentity = signedIn
    ? { id: customerIdFromAccountId(signedIn.id), displayName: signedIn.displayName, email: signedIn.email, country: "Not set", destinationPort: "Not set", isPreview: false, signInPath: null, acquisitionChannel: "hispeed" }
    : demoWorkspaceEnabled
      ? { id: "hispeed-preview-li-wei", displayName: "Li Wei", email: null, country: "China", destinationPort: "Shanghai", isPreview: true, signInPath, signInProviders, acquisitionChannel: "hispeed" }
      : { id: "hispeed-guest-device", displayName: "Guest", email: null, country: "Not set", destinationPort: "Not set", isPreview: true, signInPath, signInProviders, acquisitionChannel: "hispeed" };
  const [sourceStatus, result] = await Promise.all([
    customerMarketplaceAdapter.getStatus(),
    customerMarketplaceAdapter.search({ customerId: customer.id, searchArea: "Thailand", filters: { ...DEFAULT_FILTERS, location: "All Thailand" }, limit: 50, channel: "hispeed" }),
  ]);
  return (
    <BuyingBrowserProvider
      customer={customer}
      sourceStatus={sourceStatus}
      initialListings={result.results}
      seedCases={signedIn || !demoWorkspaceEnabled ? [] : [hispeedSeedCase(customer.id)]}
      durableAccount={Boolean(signedIn)}
      legacyCustomerId={signedIn?.provider !== "qnap" ? customerIdFromEmail(signedIn?.email || null) : undefined}
      basePath="/hispeed"
      channel="hispeed"
      defaultLanguage="zh-CN"
    >
      <HiSpeedApp view={view} sourceId={sourceId} caseId={caseId} />
    </BuyingBrowserProvider>
  );
}
