import { getChatGPTUser } from "../chatgpt-auth";
import BuyingBrowserOwnerPreview from "./BuyingBrowserOwnerPreview";
import { demoInternalSourceRecords } from "./source-adapters/demo-internal-data";

function storageCustomerId(email: string | null) {
  if (!email) return "preview-james-mwangi";
  return `chatgpt-${email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)}`;
}

export default async function BuyingBrowserOwnerRoute() {
  const user = await getChatGPTUser();
  return <BuyingBrowserOwnerPreview records={demoInternalSourceRecords} storageCustomerId={storageCustomerId(user?.email ?? null)} />;
}
