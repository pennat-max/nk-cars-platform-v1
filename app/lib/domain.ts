import type { Source, Vehicle } from "../types";

export const thb = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "THB", maximumFractionDigits: 0,
}).format(value);
export const profit = (vehicle: Pick<Vehicle, "sellingPrice" | "sourcePrice">) => vehicle.sellingPrice - vehicle.sourcePrice;
export const markup = (vehicle: Pick<Vehicle, "sellingPrice" | "sourcePrice">) => vehicle.sourcePrice ? (profit(vehicle) / vehicle.sourcePrice) * 100 : 0;
export const defaultSource = (sources: Source[]) => {
  const verified = sources.filter((source) => source.status === "Verified");
  return [...(verified.length ? verified : sources)].sort((a, b) => a.price - b.price)[0];
};
const publicFact = (value: unknown) => {
  if (typeof value !== "string") return "";
  const cleaned = value.trim();
  return /^(?:unknown|need review|not available)$/i.test(cleaned) ? "" : cleaned;
};
export function sanitizeCustomerDescriptionEn(value: unknown) {
  if (typeof value !== "string") return "";
  const sensitive = /(?:facebook|marketplace|seller|dealer|source|contact|phone|line\s*id|location|vin|chassis|registration|license\s*plate|asking\s*price|source\s*price|\bTHB\b|฿|กรุงเทพ|ผู้ขาย|ติดต่อ|โทร|ดูรถที่|แหล่ง)/i;
  return value
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "")
    .split(/(?<=[.!?])\s+|[\r\n]+/)
    .map((part) => part.trim())
    .filter((part) => part && !sensitive.test(part))
    .join(" ")
    .slice(0, 1_500);
}
export function buildCustomerDescriptionEn(vehicle: Partial<Pick<Vehicle,
  "brand" | "model" | "year" | "grade" | "engine" | "engineCapacity" | "transmission" | "drive" | "body" | "cabType" | "mileage" | "color"
>>) {
  const identity = [publicFact(vehicle.year), publicFact(vehicle.brand), publicFact(vehicle.model)].filter(Boolean).join(" ") || "Vehicle";
  const facts = [
    publicFact(vehicle.grade) ? `${publicFact(vehicle.grade)} grade` : "",
    publicFact(vehicle.engine) ? `${publicFact(vehicle.engine)} engine` : publicFact(vehicle.engineCapacity) ? `${publicFact(vehicle.engineCapacity)} engine` : "",
    publicFact(vehicle.transmission) === "AT" ? "automatic transmission" : publicFact(vehicle.transmission) === "MT" ? "manual transmission" : publicFact(vehicle.transmission),
    publicFact(vehicle.drive),
    publicFact(vehicle.body) || publicFact(vehicle.cabType),
    publicFact(vehicle.mileage) ? `${publicFact(vehicle.mileage)} recorded mileage` : "",
    publicFact(vehicle.color) ? `${publicFact(vehicle.color)} exterior` : "",
  ].filter(Boolean);
  return `${identity}${facts.length ? ` featuring ${facts.join(", ")}` : ""}. Specifications and availability are subject to NK Cars verification.`;
}
const capture = (text: string, pattern: RegExp) => text.match(pattern)?.[1]?.trim();
export function extractVehicle(text: string) {
  const upper = text.toUpperCase();
  const brands = ["Toyota", "Ford", "Isuzu", "Mitsubishi", "Nissan"];
  const models = ["Hilux Revo", "Hilux Vigo", "Ranger", "D-Max", "Triton", "Navara"];
  const brand = brands.find((item) => upper.includes(item.toUpperCase())) || "Unknown";
  const model = models.find((item) => upper.includes(item.toUpperCase()))
    || (brand === "Toyota" && /\bREVO\b/.test(upper) ? "Hilux Revo" : "Need Review");
  const year = capture(text, /\b(20(?:0[0-9]|1[0-9]|2[0-6]))\b/) || "Need Review";
  const priceText = capture(text.replace(/,/g, ""), /(?:THB|฿|PRICE|ราคา)\s*:?\s*(\d{5,8})(?!\d)/i);
  const mileageMatch = text.replace(/,/g, "").match(/ไมล์\s*(\d{2,6})|(\d{2,6})\s*(?:KM|KMS|กม\.?|กิโล(?:เมตร)?(?:แท้)?)/i);
  const mileageText = mileageMatch?.[1] || mileageMatch?.[2] || "";
  const plausibleMileage = mileageText && Number(mileageText) >= 100 ? mileageText : "";
  const transmission = /\b(?:AT|AUTO|AUTOMATIC|A\s*\/\s*T)\b/i.test(text) ? "AT" : /\b(?:MT|MANUAL|M\s*\/\s*T)\b/i.test(text) ? "MT" : "Need Review";
  const drive = /\b4\s*(?:WD|X4)\b/i.test(text) ? "4WD" : /\b2\s*WD\b/i.test(text) ? "2WD" : "Need Review";
  const grade = capture(text, /\b(ROCCO|GR\s*SPORT(?:\s*WIDE)?|PRERUNNER(?:\s+[A-Z])?)\b/i) || "Need Review";
  const engineCapacity = capture(text, /\b([1-6]\.\d)\s*(?:L|LITRE|LITER)?\b/i) || "";
  return {
    brand, model, year, grade, engine: engineCapacity ? `${engineCapacity}L` : "Need Review", transmission, drive,
    body: /DOUBLE\s*CAB|D\s*\/\s*C|4\s*DOOR/i.test(text) ? "Double Cab" : "Need Review",
    mileage: plausibleMileage ? `${Number(plausibleMileage).toLocaleString()} km` : "Unknown",
    color: ["White", "Black", "Silver", "Grey", "Gray", "Blue", "Red"].find((c) => upper.includes(c.toUpperCase())) || "Need Review",
    sourcePrice: priceText ? Number(priceText) : 0,
    confidence: { brand: brand === "Unknown" ? 0 : 96, model: model === "Need Review" ? 0 : 93, year: year === "Need Review" ? 0 : 91, grade: grade === "Need Review" ? 0 : 82, engine: engineCapacity ? 82 : 0, transmission: transmission === "Need Review" ? 0 : 89, drive: drive === "Need Review" ? 0 : 87, mileage: plausibleMileage ? 86 : 0 },
  };
}
