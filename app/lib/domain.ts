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
const capture = (text: string, pattern: RegExp) => text.match(pattern)?.[1]?.trim();
export function extractVehicle(text: string) {
  const upper = text.toUpperCase();
  const brands = ["Toyota", "Ford", "Isuzu", "Mitsubishi", "Nissan"];
  const models = ["Hilux Revo", "Hilux Vigo", "Ranger", "D-Max", "Triton", "Navara"];
  const brand = brands.find((item) => upper.includes(item.toUpperCase())) || "Unknown";
  const model = models.find((item) => upper.includes(item.toUpperCase())) || "Need Review";
  const year = capture(text, /\b(20(?:0[0-9]|1[0-9]|2[0-6]))\b/) || "Need Review";
  const priceText = capture(text.replace(/,/g, ""), /(?:THB|฿|PRICE|ราคา)\s*:?\s*(\d{5,8})(?!\d)/i);
  const mileageText = capture(text.replace(/,/g, ""), /(\d{2,6})\s*(?:KM|KMS|กม\.?|กิโล(?:เมตร)?(?:แท้)?)/i);
  const transmission = /\b(?:AT|AUTO|AUTOMATIC)\b/i.test(text) ? "AT" : /\b(?:MT|MANUAL)\b/i.test(text) ? "MT" : "Need Review";
  const drive = /\b4\s*(?:WD|X4)\b/i.test(text) ? "4WD" : /\b2\s*WD\b/i.test(text) ? "2WD" : "Need Review";
  return {
    brand, model, year, grade: "Need Review", engine: "Need Review", transmission, drive,
    body: /DOUBLE\s*CAB|4\s*DOOR/i.test(text) ? "Double Cab" : "Need Review",
    mileage: mileageText ? `${Number(mileageText).toLocaleString()} km` : "Unknown",
    color: ["White", "Black", "Silver", "Grey", "Gray", "Blue", "Red"].find((c) => upper.includes(c.toUpperCase())) || "Need Review",
    sourcePrice: priceText ? Number(priceText) : 0,
    confidence: { brand: brand === "Unknown" ? 0 : 96, model: model === "Need Review" ? 0 : 93, year: year === "Need Review" ? 0 : 91, transmission: transmission === "Need Review" ? 0 : 89, drive: drive === "Need Review" ? 0 : 87, mileage: mileageText ? 86 : 0 },
  };
}
