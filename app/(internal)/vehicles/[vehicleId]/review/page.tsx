import RouteShell from "../../../../components/RouteShell";
import { vehicleIdFromRoute } from "../../../../components/routeTargets";

export default async function ReviewVehiclePage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  return <RouteShell initialView="review" initialVehicleId={vehicleIdFromRoute(vehicleId)} />;
}
