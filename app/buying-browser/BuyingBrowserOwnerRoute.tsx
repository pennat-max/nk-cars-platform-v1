import { requireOwnerUser } from "../chatgpt-auth";
import BuyingBrowserOwnerPreview from "./BuyingBrowserOwnerPreview";
import { capturedBatchInternalRecords } from "./source-adapters/captured-batch-data";
import { demoInternalSourceRecords } from "./source-adapters/demo-internal-data";
import { capturedPocInternalSourceRecord } from "./source-adapters/sheet-poc-data";
import { getGoogleStagingSnapshot, getGoogleStagingStatus } from "./source-adapters/google-staging";

function storageCustomerId(email: string | null) {
  if (!email) return "preview-james-mwangi";
  return `chatgpt-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)}`;
}

export default async function BuyingBrowserOwnerRoute() {
  const user = await requireOwnerUser("/buy/owner");
  const [snapshot, sourceStatus] = await Promise.all([
    getGoogleStagingSnapshot().catch(() => null),
    getGoogleStagingStatus(),
  ]);
  const fallbackRecords = [...capturedBatchInternalRecords, capturedPocInternalSourceRecord, ...demoInternalSourceRecords];
  return <BuyingBrowserOwnerPreview records={snapshot?.internalRecords || fallbackRecords} sourceStatus={sourceStatus} storageCustomerId={storageCustomerId(user.email)} />;
}
