import BuyingBrowserRoute from "../../../../buying-browser/BuyingBrowserRoute";

export default async function ProformaInvoicePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return <BuyingBrowserRoute view="pi" caseId={decodeURIComponent(caseId)} />;
}
