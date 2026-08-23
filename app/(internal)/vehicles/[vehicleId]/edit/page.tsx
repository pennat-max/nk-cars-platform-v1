import RouteShell from "../../../../components/RouteShell";
import { vehicleIdFromRoute } from "../../../../components/routeTargets";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const initialVehicleId = vehicleIdFromRoute(vehicleId);
  return <RouteShell initialView="add" initialVehicleId={initialVehicleId} initialEditingId={initialVehicleId ?? null} />;
}
