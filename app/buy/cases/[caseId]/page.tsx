import BuyingBrowserRoute from "../../../buying-browser/BuyingBrowserRoute";
export default async function VehicleCasePage({ params }: { params: Promise<{ caseId: string }> }) { const { caseId } = await params; return <BuyingBrowserRoute view="case" caseId={decodeURIComponent(caseId)} />; }
