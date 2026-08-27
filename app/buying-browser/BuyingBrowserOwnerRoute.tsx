import { requireOwnerUser } from "../chatgpt-auth";
import BuyingBrowserOwnerPreview from "./BuyingBrowserOwnerPreview";
import { listOwnerCases } from "./workspace-store";
import { capturedBatchInternalRecords } from "./source-adapters/captured-batch-data";
import { demoInternalSourceRecords } from "./source-adapters/demo-internal-data";
import { capturedPocInternalSourceRecord } from "./source-adapters/sheet-poc-data";
import { customerMarketplaceAdapter } from "./source-adapters/customer-marketplace-adapter";
import { getGoogleStagingSnapshot, googleStagingMigrationBridgeEnabled } from "./source-adapters/google-staging";

export default async function BuyingBrowserOwnerRoute() {
  const user = await requireOwnerUser("/buy/owner");
  const [snapshot, sourceStatus, caseQueue] = await Promise.all([
    googleStagingMigrationBridgeEnabled() ? getGoogleStagingSnapshot().catch(() => null) : Promise.resolve(null),
    customerMarketplaceAdapter.getStatus(),
    listOwnerCases(user).catch(() => []),
  ]);
  const fallbackRecords = [...capturedBatchInternalRecords, capturedPocInternalSourceRecord, ...demoInternalSourceRecords];
  return <BuyingBrowserOwnerPreview records={snapshot?.internalRecords || fallbackRecords} sourceStatus={sourceStatus} storageCustomerId={`chatgpt-${user.id}`} initialCaseQueue={caseQueue} />;
}
