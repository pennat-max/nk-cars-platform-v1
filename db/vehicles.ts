import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { vehicleSources, vehicleTimeline, vehicles as vehiclesTable } from "./schema";
import type {
  AiFieldMeta, Source, SourceImport, TimelineItem, Vehicle, VehicleCorrection, VehicleState,
} from "../app/types";

const NO_PHOTO = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='#e8edf2'/><text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' font-family='Arial' font-size='52' fill='#667383'>NO PHOTO</text></svg>",
);

type VehicleRow = typeof vehiclesTable.$inferSelect;
type SourceRow = typeof vehicleSources.$inferSelect;
type TimelineRow = typeof vehicleTimeline.$inferSelect;

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function rowToSource(row: SourceRow): Source {
  return {
    id: row.id,
    name: row.name,
    seller: row.seller ?? "",
    price: row.price ?? 0,
    url: row.url ?? "",
    lastVerified: row.lastVerified ?? "",
    status: (row.status as Source["status"]) || "Needs verification",
  };
}

function rowToTimeline(row: TimelineRow): TimelineItem {
  return { id: row.id, time: row.time, label: row.label, detail: row.detail ?? "" };
}

function rowToVehicle(row: VehicleRow, sources: SourceRow[], timeline: TimelineRow[]): Vehicle {
  return {
    id: row.id,
    stockNo: row.stockNo,
    brand: row.brand,
    model: row.model,
    year: row.year ?? "",
    grade: row.grade ?? "",
    engine: row.engine ?? "",
    transmission: row.transmission ?? "",
    drive: row.drive ?? "",
    body: row.body ?? "",
    mileage: row.mileage ?? "",
    color: row.color ?? "",
    sourcePrice: row.sourcePrice ?? 0,
    sellingPrice: row.sellingPrice ?? 0,
    state: (row.state as VehicleState) || "Waiting Review",
    availabilityVerified: Boolean(row.availabilityVerified),
    image: row.image || NO_PHOTO,
    plateMasked: row.plateMasked ?? "",
    vinMasked: row.vinMasked ?? "",
    sources: sources.map(rowToSource),
    confidence: parseJson<Record<string, number>>(row.confidence, {}),
    possibleDuplicate: row.possibleDuplicate ?? undefined,
    lastSoldPrice: row.lastSoldPrice ?? undefined,
    soldMonth: row.soldMonth ?? undefined,
    destination: row.destination ?? undefined,
    timeline: timeline.map(rowToTimeline),
    engineCapacity: row.engineCapacity ?? undefined,
    cabType: row.cabType ?? undefined,
    vinChassis: row.vinChassis ?? undefined,
    registrationYear: row.registrationYear ?? undefined,
    seller: row.seller ?? undefined,
    sourcePlatform: row.sourcePlatform ?? undefined,
    listingText: row.listingText ?? undefined,
    location: row.location ?? undefined,
    images: row.images ? parseJson<string[]>(row.images, []) : undefined,
    coverImage: row.coverImage ?? undefined,
    aiMeta: row.aiMeta ? parseJson<Record<string, AiFieldMeta>>(row.aiMeta, {}) : undefined,
    sourceImport: row.sourceImport ? parseJson<SourceImport | undefined>(row.sourceImport, undefined) : undefined,
    corrections: row.corrections ? parseJson<VehicleCorrection[]>(row.corrections, []) : undefined,
    aiSummary: row.aiSummary ?? undefined,
  };
}

function vehicleToRow(vehicle: Vehicle) {
  return {
    id: vehicle.id,
    stockNo: vehicle.stockNo,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year || null,
    grade: vehicle.grade || null,
    engine: vehicle.engine || null,
    engineCapacity: vehicle.engineCapacity || null,
    transmission: vehicle.transmission || null,
    drive: vehicle.drive || null,
    body: vehicle.body || null,
    cabType: vehicle.cabType || null,
    mileage: vehicle.mileage || null,
    color: vehicle.color || null,
    registrationYear: vehicle.registrationYear || null,
    sourcePrice: vehicle.sourcePrice ?? null,
    sellingPrice: vehicle.sellingPrice ?? null,
    lastSoldPrice: vehicle.lastSoldPrice ?? null,
    soldMonth: vehicle.soldMonth || null,
    destination: vehicle.destination || null,
    state: vehicle.state,
    availabilityVerified: vehicle.availabilityVerified ? 1 : 0,
    possibleDuplicate: vehicle.possibleDuplicate || null,
    plateMasked: vehicle.plateMasked || null,
    vinMasked: vehicle.vinMasked || null,
    vinChassis: vehicle.vinChassis || null,
    image: vehicle.image || null,
    coverImage: vehicle.coverImage || null,
    images: vehicle.images ? JSON.stringify(vehicle.images) : null,
    seller: vehicle.seller || null,
    sourcePlatform: vehicle.sourcePlatform || null,
    listingText: vehicle.listingText || null,
    location: vehicle.location || null,
    sourceImport: vehicle.sourceImport ? JSON.stringify(vehicle.sourceImport) : null,
    aiSummary: vehicle.aiSummary || null,
    confidence: JSON.stringify(vehicle.confidence || {}),
    aiMeta: vehicle.aiMeta ? JSON.stringify(vehicle.aiMeta) : null,
    corrections: vehicle.corrections ? JSON.stringify(vehicle.corrections) : null,
    updatedAt: new Date().toISOString(),
  };
}

export async function listVehicles(): Promise<Vehicle[]> {
  const db = await getDb();
  const [vehicleRows, sourceRows, timelineRows] = await Promise.all([
    db.select().from(vehiclesTable),
    db.select().from(vehicleSources),
    db.select().from(vehicleTimeline),
  ]);
  return vehicleRows.map((row) => rowToVehicle(
    row,
    sourceRows.filter((source) => source.vehicleId === row.id),
    timelineRows.filter((item) => item.vehicleId === row.id),
  ));
}

export async function upsertVehicle(vehicle: Vehicle): Promise<void> {
  const db = await getDb();
  const row = vehicleToRow(vehicle);
  const sourceRows = vehicle.sources.map((source) => ({
    id: source.id,
    vehicleId: vehicle.id,
    name: source.name,
    seller: source.seller || null,
    price: source.price ?? null,
    url: source.url || null,
    lastVerified: source.lastVerified || null,
    status: source.status,
  }));
  const timelineRows = vehicle.timeline.map((item) => ({
    id: item.id,
    vehicleId: vehicle.id,
    time: item.time,
    label: item.label,
    detail: item.detail || null,
  }));

  const statements: unknown[] = [
    db.insert(vehiclesTable).values(row).onConflictDoUpdate({ target: vehiclesTable.id, set: row }),
    db.delete(vehicleSources).where(eq(vehicleSources.vehicleId, vehicle.id)),
    db.delete(vehicleTimeline).where(eq(vehicleTimeline.vehicleId, vehicle.id)),
  ];
  if (sourceRows.length) statements.push(db.insert(vehicleSources).values(sourceRows));
  if (timelineRows.length) statements.push(db.insert(vehicleTimeline).values(timelineRows));

  await db.batch(statements as unknown as Parameters<typeof db.batch>[0]);
}
