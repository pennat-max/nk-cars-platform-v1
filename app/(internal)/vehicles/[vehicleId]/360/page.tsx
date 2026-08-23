import RouteShell from "../../../../components/RouteShell";
import { vehicleIdFromRoute } from "../../../../components/routeTargets";

export default async function Vehicle360Page({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  return <RouteShell initialView="vehicle360" initialVehicleId={vehicleIdFromRoute(vehicleId)} />;
}
