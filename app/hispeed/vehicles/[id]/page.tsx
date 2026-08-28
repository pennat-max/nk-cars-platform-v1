import HiSpeedRoute from "../../HiSpeedRoute";

export default async function HiSpeedVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HiSpeedRoute view="vehicle" sourceId={id} />;
}
