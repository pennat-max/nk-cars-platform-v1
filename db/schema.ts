import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const vehicles = sqliteTable("vehicles", {
  id: text("id").primaryKey(),
  stockNo: text("stock_no").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: text("year"),
  grade: text("grade"),
  engine: text("engine"),
  engineCapacity: text("engine_capacity"),
  transmission: text("transmission"),
  drive: text("drive"),
  body: text("body"),
  cabType: text("cab_type"),
  mileage: text("mileage"),
  color: text("color"),
  registrationYear: text("registration_year"),
  sourcePrice: integer("source_price"),
  sellingPrice: integer("selling_price"),
  lastSoldPrice: integer("last_sold_price"),
  soldMonth: text("sold_month"),
  destination: text("destination"),
  state: text("state").notNull().default("Waiting Review"),
  availabilityVerified: integer("availability_verified").notNull().default(0),
  possibleDuplicate: text("possible_duplicate"),
  plateMasked: text("plate_masked"),
  vinMasked: text("vin_masked"),
  vinChassis: text("vin_chassis"),
  image: text("image"),
  coverImage: text("cover_image"),
  images: text("images"),
  seller: text("seller"),
  sourcePlatform: text("source_platform"),
  listingText: text("listing_text"),
  location: text("location"),
  sourceImport: text("source_import"),
  aiSummary: text("ai_summary"),
  confidence: text("confidence"),
  aiMeta: text("ai_meta"),
  corrections: text("corrections"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const vehicleSources = sqliteTable("vehicle_sources", {
  id: text("id").primaryKey(),
  vehicleId: text("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  seller: text("seller"),
  price: integer("price"),
  url: text("url"),
  lastVerified: text("last_verified"),
  status: text("status").notNull().default("Needs verification"),
});

export const vehicleTimeline = sqliteTable("vehicle_timeline", {
  id: text("id").primaryKey(),
  vehicleId: text("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  time: text("time").notNull(),
  label: text("label").notNull(),
  detail: text("detail"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
