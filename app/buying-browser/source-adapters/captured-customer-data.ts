import type { CustomerListing } from "../types";

const observedAt = "2026-08-25T15:51:43.342Z";
const imageRoot = "/vehicle-marketplace/owner-reviewed-2026-08-26";

function images(listingId: string, files: string[]) {
  return files.map((file) => `${imageRoot}/${listingId}/${file}`);
}

// Kept separate from internal capture records so customer routes cannot inherit
// source URLs, seller identity, contact details, or unreviewed raw media.
export const capturedCustomerListings: CustomerListing[] = [
  {
    id: "nk-market-2026-0825-01", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-01",
    title: "2020 Toyota Hilux Revo Rocco 2.4 AT", summary: "A 2020 Hilux Revo Rocco double cab. Available evidence states a 2.4L diesel engine, automatic transmission, 2WD, and 64,000 km. Current price, availability, condition, and history still require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Rocco", engine: "2.4L diesel", transmission: "AT", drive: "2WD", body: "Double Cab", mileageKm: 64000, color: "White",
    observedPriceThb: 759000, observedAt: "2026-08-25T15:50:31.281Z", generalLocation: "Bangkok",
    imageUrls: images("nk-mkt-01", ["51372ba48027443c.jpg", "545154a4971cb435.jpg", "c500ea62da4f8865.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "English normalization", "3 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-02", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-02",
    title: "2020 Toyota Hilux Revo Rocco 2.4 AT", summary: "A white 2020 Hilux Revo Rocco double cab. Available evidence states a 2.4L diesel engine, automatic transmission, 2WD, and 168,000 km. Availability and condition remain unverified.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Rocco", engine: "2.4L diesel", transmission: "AT", drive: "2WD", body: "Double Cab", mileageKm: 168000, color: "White",
    observedPriceThb: 598000, observedAt: "2026-08-25T15:50:39.454Z", generalLocation: "Chon Buri",
    imageUrls: images("nk-mkt-02", ["5dd5a18dc02b2f68.jpg", "030a7a2d086e22d0.jpg", "d5d8ce855a3a81d0.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "English normalization", "3 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-03", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-03",
    title: "2020 Toyota Hilux Revo 2.4 AT", summary: "A grey 2020 Hilux Revo with a claimed 2.4L diesel engine, automatic transmission, and approximately 98,000 km. Body configuration, drive type, availability, and condition need review.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Need Review", engine: "2.4L diesel", transmission: "AT", drive: "Unknown", body: "Need Review", mileageKm: 98000, color: "Grey",
    observedPriceThb: 530000, observedAt: "2026-08-25T15:50:47.265Z", generalLocation: "Samut Sakhon",
    imageUrls: images("nk-mkt-03", ["817aeaff8f915111.jpg", "a7ba5e1e2bdbd9cb.jpg", "eddd9efa1829617d.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Drive and body need review", "3 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-04", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-04",
    title: "2020 Toyota Hilux Revo Prerunner Entry 2.4 AT", summary: "A grey 2020 Hilux Revo Double Cab Entry Prerunner with automatic transmission and a claimed 41,600 km. Availability, history, and condition remain unverified.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Entry Prerunner", engine: "2.4L diesel", transmission: "AT", drive: "2WD", body: "Double Cab", mileageKm: 41600, color: "Grey",
    observedPriceThb: 558000, observedAt: "2026-08-25T15:50:55.501Z", generalLocation: "Chon Buri",
    imageUrls: images("nk-mkt-04", ["7c8b40c991b9a2a6.jpg", "ae60c3e197250361.jpg", "857bacec9999ab4b.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "Odometer photo", "3 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-05", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-05",
    title: "2020 Toyota Hilux Revo 2.8 4WD MT Single Cab", summary: "A grey 2020 Hilux Revo single cab with a claimed 2.8L diesel engine, manual transmission, 4WD, and an odometer image showing 247,356 km. Availability, modifications, and condition require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Need Review", engine: "2.8L diesel", transmission: "MT", drive: "4WD", body: "Single Cab", mileageKm: 247356, color: "Grey",
    observedPriceThb: 599000, observedAt: "2026-08-25T15:51:03.222Z", generalLocation: "Surat Thani",
    imageUrls: images("nk-mkt-05", ["2fbaa17af20eb729.jpg", "c275bf9b32d2e9e2.jpg", "d8a473d44cfa333f.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Odometer photo: 247,356 km", "3 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-06", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-06",
    title: "2020 Toyota Hilux Revo Prerunner 2.4 Mid MT", summary: "A black Hilux Revo Prerunner 2.4 Mid with manual transmission and 90,955 km. Available evidence states model year 2020 and registration in 2021, so documents must confirm the customer-facing year.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Prerunner Mid", engine: "2.4L diesel", transmission: "MT", drive: "2WD", body: "Need Review", mileageKm: 90955, color: "Black",
    observedPriceThb: 599000, observedAt: "2026-08-25T15:51:11.349Z", generalLocation: "Surat Thani",
    imageUrls: images("nk-mkt-06", ["ce85152056d9b4dc.jpg", "a57145a9ba858ebb.jpg", "4629c8bafcb3db72.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Year / registration distinction", "3 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-07", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-07",
    title: "2020 Toyota Hilux Revo Mid MT Double Cab", summary: "A black 2020 Hilux Revo Mid four-door pickup with manual transmission. Evidence contains conflicting mileage claims of 35,000 and 36,000 km, so mileage remains Need Review.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Mid", engine: "Need Review", transmission: "MT", drive: "Unknown", body: "Double Cab", mileageKm: 36000, color: "Black",
    observedPriceThb: 499000, observedAt: "2026-08-25T15:51:20.109Z", generalLocation: "Samut Prakan",
    imageUrls: images("nk-mkt-07", ["d34882fdcb341b92.jpg", "a9903203eff89fb4.jpg", "2ef7676655961173.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Mileage conflict: 35,000 vs 36,000 km", "3 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-08", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-08",
    title: "2020 Toyota Hilux Revo Smart Cab 2.4 Mid AT", summary: "A white 2020 Hilux Revo Smart Cab 2.4 Mid with automatic transmission and 97,225 km. Drive type, availability, equipment, and condition require verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Mid", engine: "2.4L diesel", transmission: "AT", drive: "Unknown", body: "Smart Cab", mileageKm: 97225, color: "White",
    observedPriceThb: 369000, observedAt: "2026-08-25T15:51:27.887Z", generalLocation: "Nonthaburi",
    imageUrls: images("nk-mkt-08", ["092ada100d1444cc.jpg", "c570acd459a4b7c1.jpg", "d242baf7e659395b.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Drive type needs review", "3 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-09", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-09",
    title: "2020 Toyota Hilux Revo Rocco 2.4 AT Double Cab", summary: "A black 2020 Hilux Revo Rocco double cab with a claimed 2.4L diesel engine, automatic transmission, and 62,861 km. Availability, history, and condition remain unverified.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Rocco", engine: "2.4L diesel", transmission: "AT", drive: "Unknown", body: "Double Cab", mileageKm: 62861, color: "Black",
    observedPriceThb: 659000, observedAt: "2026-08-25T15:51:35.597Z", generalLocation: "Bangkok",
    imageUrls: images("nk-mkt-09", ["acb906cef05f7a75.jpg", "e492cc719d33950b.jpg", "dc25a71b5b3ba09c.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "Odometer photo", "3 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-10", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-10",
    title: "2020 Toyota Hilux Revo 2.8 4WD MT Single Cab", summary: "A white 2020 Hilux Revo single cab with a claimed 2.8L diesel engine, 4WD, manual transmission, and 98,000 km. Availability, history, modifications, and condition require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Need Review", engine: "2.8L diesel", transmission: "MT", drive: "4WD", body: "Single Cab", mileageKm: 98000, color: "White",
    observedPriceThb: 589000, observedAt, generalLocation: "Nonthaburi",
    imageUrls: images("nk-mkt-10", ["52b065880dab2d7b.jpg", "00d2d31374a296ce.jpg", "7028696e309d78cc.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "Modification photo", "3 customer-reviewed photos"], demo: false,
  },
];
