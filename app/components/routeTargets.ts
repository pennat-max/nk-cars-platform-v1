import { demoVehicles } from "../data/demo";
import type { Role } from "../types";
import type { NKPlatformView } from "./NKPlatform";

export type RouteTarget = {
  initialRole?: Role;
  initialView: NKPlatformView;
  initialVehicleId?: string;
  initialEditingId?: string | null;
};

export function vehicleIdFromRoute(value: string | undefined) {
  if (!value) return undefined;
  const normalized = decodeURIComponent(value).toLowerCase();
  const vehicle = demoVehicles.find((item) =>
    item.id.toLowerCase() === normalized ||
    item.stockNo.toLowerCase() === normalized ||
    item.stockNo.toLowerCase().replace(/[^a-z0-9]+/g, "-") === normalized
  );
  return vehicle?.id;
}
