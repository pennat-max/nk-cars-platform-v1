import { requireChatGPTUser } from "../chatgpt-auth";
import BuyingBrowserOwnerPreview from "./BuyingBrowserOwnerPreview";
import { capturedBatchInternalRecords } from "./source-adapters/captured-batch-data";
import { demoInternalSourceRecords } from "./source-adapters/demo-internal-data";
import { capturedPocInternalSourceRecord } from "./source-adapters/sheet-poc-data";

function storageCustomerId(email: string | null) {
  if (!email) return "preview-james-mwangi";
  return `chatgpt-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)}`;
}

export default async function BuyingBrowserOwnerRoute() {
  const user = await requireChatGPTUser("/buy/owner");
  return <BuyingBrowserOwnerPreview records={[...capturedBatchInternalRecords, capturedPocInternalSourceRecord, ...demoInternalSourceRecords]} storageCustomerId={storageCustomerId(user.email)} />;
}
