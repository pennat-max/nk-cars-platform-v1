import { requireOwnerUser } from "../chatgpt-auth";
import BuyingBrowserOwnerPreview from "./BuyingBrowserOwnerPreview";
import { listOwnerCases } from "./workspace-store";
import { capturedBatchInternalRecords } from "./source-adapters/captured-batch-data";
import { demoInternalSourceRecords } from "./source-adapters/demo-internal-data";
import { capturedPocInternalSourceRecord } from "./source-adapters/sheet-poc-data";
import { customerMarketplaceAdapter } from "./source-adapters/customer-marketplace-adapter";
import { getGoogleStagingSnapshot, googleStagingMigrationBridgeEnabled } from "./source-adapters/google-staging";
import { getQnapOwnerInventorySnapshot } from "./source-adapters/qnap-inventory";
import type { SourceAdapterStatus } from "./types";

export default async function BuyingBrowserOwnerRoute() {
  const user = await requireOwnerUser("/buy/owner");
  const [qnapSnapshot, googleSnapshot, customerSourceStatus, caseQueue] = await Promise.all([
    getQnapOwnerInventorySnapshot().catch(() => null),
    googleStagingMigrationBridgeEnabled() ? getGoogleStagingSnapshot().catch(() => null) : Promise.resolve(null),
    customerMarketplaceAdapter.getStatus(),
    listOwnerCases(user).catch(() => []),
  ]);
  const fallbackRecords = [...capturedBatchInternalRecords, capturedPocInternalSourceRecord, ...demoInternalSourceRecords];
  const sourceStatus: SourceAdapterStatus = qnapSnapshot
    ? {
      adapterId: "qnap-postgres",
      mode: "live",
      label: "QNAP Owner inventory",
      live: true,
      state: "ready",
      message: `${qnapSnapshot.internalRecords.length} internal vehicle records synchronized from QNAP PostgreSQL.`,
    }
    : customerSourceStatus.live
      ? {
        adapterId: "qnap-postgres",
        mode: "fallback",
        label: "QNAP Owner inventory unavailable",
        live: false,
        state: "error",
        message: "Customer inventory is live, but the Owner inventory endpoint is unavailable. NK is showing the verified internal fallback.",
      }
      : customerSourceStatus;
  const records = qnapSnapshot?.internalRecords || googleSnapshot?.internalRecords || fallbackRecords;
  return <BuyingBrowserOwnerPreview records={records} sourceStatus={sourceStatus} storageCustomerId={`chatgpt-${user.id}`} initialCaseQueue={caseQueue} />;
}
