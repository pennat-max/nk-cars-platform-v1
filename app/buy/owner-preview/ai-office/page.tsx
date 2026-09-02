import { requireOwnerUser } from "../../../chatgpt-auth";
import AiDevelopmentOfficePreview from "../../../buying-browser/AiDevelopmentOfficePreview";

export const dynamic = "force-dynamic";

export default async function AiOfficeOwnerPreviewPage() {
  await requireOwnerUser("/buy/owner-preview/ai-office");
  return <AiDevelopmentOfficePreview />;
}
