import { upsertVehicle } from "../../../../db/vehicles";
import type { Vehicle } from "../../../types";

function toRouteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (message.includes("no such table")) {
    return "Vehicles table is unavailable. Deploy the schema migration to the D1 database first.";
  }
  return message;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let vehicle: Vehicle;
  try {
    vehicle = (await request.json()) as Vehicle;
  } catch {
    return Response.json({ error: "Invalid vehicle payload" }, { status: 400 });
  }
  if (!vehicle || vehicle.id !== id) {
    return Response.json({ error: "Vehicle id does not match request URL" }, { status: 400 });
  }
  if (!vehicle.stockNo?.trim() || !vehicle.brand?.trim() || !vehicle.model?.trim()) {
    return Response.json({ error: "Vehicle is missing required fields" }, { status: 400 });
  }
  try {
    await upsertVehicle(vehicle);
    return Response.json({ vehicle });
  } catch (error) {
    console.error("Failed to save vehicle", error);
    return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
