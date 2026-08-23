import BuyingBrowserRoute from "../../../buying-browser/BuyingBrowserRoute";
export default async function BuyVehiclePage({ params }: { params: Promise<{ sourceId: string }> }) { const { sourceId } = await params; return <BuyingBrowserRoute view="vehicle" sourceId={decodeURIComponent(sourceId)} />; }
