import type { CustomerListing, VehicleCase } from "../types";
import type { InternalSourceRecord } from "./demo-internal-data";

const capturedAt = "2026-08-25T13:21:03.000Z";

const customerSafeImages = [
  "/vehicle-evidence/nk-poc-2026-0001/cover-plate-masked.png",
  "/vehicle-evidence/nk-poc-2026-0001/engine-bay.jpg",
  "/vehicle-evidence/nk-poc-2026-0001/front-cabin.jpg",
  "/vehicle-evidence/nk-poc-2026-0001/passenger-cabin.jpg",
  "/vehicle-evidence/nk-poc-2026-0001/infotainment.jpg",
  "/vehicle-evidence/nk-poc-2026-0001/camera-system.jpg",
  "/vehicle-evidence/nk-poc-2026-0001/automatic-transmission.jpg",
  "/vehicle-evidence/nk-poc-2026-0001/four-wheel-drive-controls.jpg",
  "/vehicle-evidence/nk-poc-2026-0001/odometer.jpg",
];

export const capturedPocCustomerListing: CustomerListing = {
  id: "nk-poc-2026-0001",
  adapterId: "google-sheet-poc",
  sourceReference: "NK-POC-2026-0001",
  title: "2025 Toyota Hilux Revo 2.8 4WD GR Sport Wide",
  summary: "Owner-selected listing evidence normalized into English. The odometer photo shows 24,623 km while the listing text states 24,000 km, so mileage remains Need Review. Price, availability, history, warranty, and condition still require NK verification.",
  brand: "Toyota",
  model: "Hilux Revo",
  year: 2025,
  grade: "GR Sport Wide Tread",
  engine: "2.8L (fuel type needs review)",
  transmission: "AT",
  drive: "4WD",
  body: "Double Cab",
  mileageKm: 24623,
  color: "White",
  observedPriceThb: 1389000,
  observedAt: capturedAt,
  generalLocation: "Bangkok",
  imageUrls: customerSafeImages,
  availability: "Availability Not Yet Confirmed",
  translationState: "Need Review",
  evidenceLabels: [
    "Owner-selected listing snapshot",
    "9 customer-safe preview images",
    "Odometer photo: 24,623 km",
    "Listing text: 24,000 km (conflict)",
    "Automatic transmission selector",
    "4WD selector",
  ],
  demo: false,
};

export const capturedPocInternalSourceRecord: InternalSourceRecord = {
  ...capturedPocCustomerListing,
  sourcePlatform: "Facebook Marketplace",
  sourceUrl: "https://www.facebook.com/marketplace/item/1716607786274590/",
  sellerName: "Not available in public session",
  sellerPhone: "Not available",
  exactLocation: "Bangkok, Thailand (approximate)",
  internalNotes: "Owner-selected one-car capture. Eighteen original listing images and browser evidence are stored in the private Drive folder. Customer media uses a plate-masked cover and excludes images that expose source contact details.",
  spreadsheetUrl: "https://docs.google.com/spreadsheets/d/1IXEZTH2EYcIeM6HQKJ2Qfk4LZYsVWu4ipNolXoTnxhw/edit",
  evidenceFolderUrl: "https://drive.google.com/drive/folders/1oR6RF0CZpokbnEcWQ7iMtWiplnskWEB1",
  originalMediaCount: 18,
};

export function createCapturedPocCase(customerId: string): VehicleCase {
  return {
    id: "NK-CASE-2026-000001",
    customerId,
    listingId: capturedPocCustomerListing.id,
    sourceReference: capturedPocCustomerListing.sourceReference,
    sourceCaptureId: null,
    createdAt: capturedAt,
    updatedAt: capturedAt,
    status: "Saved",
    availability: "Availability Not Yet Confirmed",
    vehicle: capturedPocCustomerListing,
    actualVehiclePurchasePriceThb: null,
    platformTransactionRate: 6,
    buyingServiceRate: 4,
    inspectionQuote: { region: "Bangkok Metro", baseFeeThb: 2900, travelFeeThb: 600, totalThb: 3500, status: "Quote Ready" },
    domesticTransportThb: null,
    repairModificationThb: null,
    exportShippingThb: null,
    otherAgreedThb: null,
    translationHistory: [],
    messages: [{ id: "NK-CASE-2026-000001-welcome", sender: "NK AI", text: "This Owner-selected vehicle snapshot is ready for review. Availability and the current seller price have not been verified. Mileage has conflicting evidence and remains Need Review.", createdAt: capturedAt, delivery: "Recorded" }],
    timeline: [{ id: "NK-CASE-2026-000001-imported", title: "Evidence snapshot imported", detail: "Customer-safe data from the Owner-approved one-car Google Sheet proof of concept was added to this Vehicle Case. Internal source details remain outside the customer case.", createdAt: capturedAt }],
  };
}
