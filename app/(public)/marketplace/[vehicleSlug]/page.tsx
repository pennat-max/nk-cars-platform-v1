import RouteShell from "../../../components/RouteShell";
import { vehicleIdFromRoute } from "../../../components/routeTargets";

export default async function PublicVehiclePage({
  params,
}: {
  params: Promise<{ vehicleSlug: string }>;
}) {
  const { vehicleSlug } = await params;
  return <RouteShell initialRole="Customer" initialView="detail" initialVehicleId={vehicleIdFromRoute(vehicleSlug)} />;
}
