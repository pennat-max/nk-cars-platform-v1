import { requireOwnerUser } from "../chatgpt-auth";
import BuyingBrowserOwnerPreview from "./BuyingBrowserOwnerPreview";
import { listOwnerCases } from "./workspace-store";
import { capturedBatchInternalRecords } from "./source-adapters/captured-batch-data";
import { demoInternalSourceRecords } from "./source-adapters/demo-internal-data";
import { capturedPocInternalSourceRecord } from "./source-adapters/sheet-poc-data";
import { getGoogleStagingSnapshot, getGoogleStagingStatus } from "./source-adapters/google-staging";

export default async function BuyingBrowserOwnerRoute() {
  const user = await requireOwnerUser("/buy/owner");
  const [snapshot, sourceStatus, caseQueue] = await Promise.all([
    getGoogleStagingSnapshot().catch(() => null),
    getGoogleStagingStatus(),
    listOwnerCases(user).catch(() => []),
  ]);
  const fallbackRecords = [...capturedBatchInternalRecords, capturedPocInternalSourceRecord, ...demoInternalSourceRecords];
  return <BuyingBrowserOwnerPreview records={snapshot?.internalRecords || fallbackRecords} sourceStatus={sourceStatus} storageCustomerId={`chatgpt-${user.id}`} initialCaseQueue={caseQueue} />;
}
