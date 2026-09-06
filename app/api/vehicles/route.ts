import { listVehicles } from "../../../db/vehicles";

function toRouteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (message.includes("no such table")) {
    return "Vehicles table is unavailable. Deploy the schema migration to the D1 database first.";
  }
  return message;
}

export async function GET() {
  try {
    const vehicles = await listVehicles();
    return Response.json({ vehicles }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load vehicles", error);
    return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
