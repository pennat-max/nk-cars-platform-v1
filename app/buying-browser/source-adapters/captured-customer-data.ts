import type { CustomerListing } from "../types";

const observedAt = "2026-08-25T15:51:43.342Z";
const imageRoot = "/vehicle-marketplace/owner-reviewed-2026-08-26";
const approvedObservedAt = "2026-08-26T08:10:57.988Z";
const approvedImageRoot = "/vehicle-marketplace/owner-approved-2026-08-27";

function images(listingId: string, files: string[]) {
  return files.map((file) => `${imageRoot}/${listingId}/${file}`);
}

function approvedImages(listingId: string, files: string[]) {
  return files.map((file) => `${approvedImageRoot}/${listingId}/${file}`);
}

// Kept separate from internal capture records so customer routes cannot inherit
// source URLs, seller identity, contact details, or unreviewed raw media.
export const capturedCustomerListings: CustomerListing[] = [
  {
    id: "nk-market-2026-0825-01", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-01",
    title: "2020 Toyota Hilux Revo Rocco 2.4 AT", summary: "A 2020 Hilux Revo Rocco double cab. Available evidence states a 2.4L diesel engine, automatic transmission, 2WD, and 64,000 km. Current price, availability, condition, and history still require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Rocco", engine: "2.4L diesel", transmission: "AT", drive: "2WD", body: "Double Cab", mileageKm: 64000, color: "White",
    observedPriceThb: 759000, observedAt: "2026-08-25T15:50:31.281Z", generalLocation: "Bangkok",
    imageUrls: images("nk-mkt-01", ["51372ba48027443c.jpg", "441fb27cb2804242.jpg", "fd2aade7890beda0.jpg", "e4d0761afd1e9d81.jpg", "545154a4971cb435.jpg", "c500ea62da4f8865.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "English translation", "6 source photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-02", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-02",
    title: "2020 Toyota Hilux Revo Rocco 2.4 AT", summary: "A white 2020 Hilux Revo Rocco double cab. Available evidence states a 2.4L diesel engine, automatic transmission, 2WD, and 168,000 km. Availability and condition remain unverified.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Rocco", engine: "2.4L diesel", transmission: "AT", drive: "2WD", body: "Double Cab", mileageKm: 168000, color: "White",
    observedPriceThb: 598000, observedAt: "2026-08-25T15:50:39.454Z", generalLocation: "Chon Buri",
    imageUrls: images("nk-mkt-02", ["cover-redacted.webp", "5dd5a18dc02b2f68.jpg", "48474efea42c4bff.jpg", "846664b55a7cab48.jpg", "986d811cb4b303c8.jpg", "030a7a2d086e22d0.jpg", "d5d8ce855a3a81d0.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "English translation", "7 source photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-03", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-03",
    title: "2020 Toyota Hilux Revo 2.4 AT", summary: "A grey 2020 Hilux Revo with a claimed 2.4L diesel engine, automatic transmission, and approximately 98,000 km. Body configuration, drive type, availability, and condition need review.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Need Review", engine: "2.4L diesel", transmission: "AT", drive: "Unknown", body: "Need Review", mileageKm: 98000, color: "Grey",
    observedPriceThb: 530000, observedAt: "2026-08-25T15:50:47.265Z", generalLocation: "Samut Sakhon",
    imageUrls: images("nk-mkt-03", ["817aeaff8f915111.jpg", "cad6f45749395a65.jpg", "43312de35f4f78f5.jpg", "a7ba5e1e2bdbd9cb.jpg", "bfc46fa0bd2218d3.jpg", "eddd9efa1829617d.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Drive and body need review", "6 source photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-04", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-04",
    title: "2020 Toyota Hilux Revo Prerunner Entry 2.4 AT", summary: "A grey 2020 Hilux Revo Double Cab Entry Prerunner with automatic transmission and a claimed 41,600 km. Availability, history, and condition remain unverified.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Entry Prerunner", engine: "2.4L diesel", transmission: "AT", drive: "2WD", body: "Double Cab", mileageKm: 41600, color: "Grey",
    observedPriceThb: 558000, observedAt: "2026-08-25T15:50:55.501Z", generalLocation: "Chon Buri",
    imageUrls: images("nk-mkt-04", ["cover-redacted.webp", "7c8b40c991b9a2a6.jpg", "ae60c3e197250361.jpg", "aa912be2b1caabab.jpg", "30baf21006297fb3.jpg", "109d715417c6da45.jpg", "857bacec9999ab4b.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "Odometer photo", "7 source photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-05", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-05",
    title: "2020 Toyota Hilux Revo 2.8 4WD MT Single Cab", summary: "A grey 2020 Hilux Revo single cab with a claimed 2.8L diesel engine, manual transmission, 4WD, and an odometer image showing 247,356 km. Availability, modifications, and condition require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Need Review", engine: "2.8L diesel", transmission: "MT", drive: "4WD", body: "Single Cab", mileageKm: 247356, color: "Grey",
    observedPriceThb: 599000, observedAt: "2026-08-25T15:51:03.222Z", generalLocation: "Surat Thani",
    imageUrls: images("nk-mkt-05", ["2fbaa17af20eb729.jpg", "bf09ffdef23826de.jpg", "8741f4ae35dbeec5.jpg", "7b292e6db9d8f6a0.jpg", "c275bf9b32d2e9e2.jpg", "d8a473d44cfa333f.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Odometer photo: 247,356 km", "6 source photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-06", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-06",
    title: "2020 Toyota Hilux Revo Prerunner 2.4 Mid MT", summary: "A black Hilux Revo Prerunner 2.4 Mid with manual transmission and 90,955 km. Available evidence states model year 2020 and registration in 2021, so documents must confirm the customer-facing year.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Prerunner Mid", engine: "2.4L diesel", transmission: "MT", drive: "2WD", body: "Need Review", mileageKm: 90955, color: "Black",
    observedPriceThb: 599000, observedAt: "2026-08-25T15:51:11.349Z", generalLocation: "Surat Thani",
    imageUrls: images("nk-mkt-06", ["ce85152056d9b4dc.jpg", "8f49080de4e8742d.jpg", "f0833ddb1c6b1c48.jpg", "1ea3974296dba83c.jpg", "a57145a9ba858ebb.jpg", "4629c8bafcb3db72.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Year / registration distinction", "6 source photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-07", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-07",
    title: "2020 Toyota Hilux Revo Mid MT Double Cab", summary: "A black 2020 Hilux Revo Mid four-door pickup with manual transmission. Evidence contains conflicting mileage claims of 35,000 and 36,000 km, so mileage remains Need Review.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Mid", engine: "Need Review", transmission: "MT", drive: "Unknown", body: "Double Cab", mileageKm: 36000, color: "Black",
    observedPriceThb: 499000, observedAt: "2026-08-25T15:51:20.109Z", generalLocation: "Samut Prakan",
    imageUrls: images("nk-mkt-07", ["cover-redacted.webp", "d34882fdcb341b92.jpg", "a9903203eff89fb4.jpg", "987eb0ce58cfd8da.jpg", "2ef7676655961173.jpg", "ded854998dc3f904.jpg", "2ecd2350a2282956.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Mileage conflict: 35,000 vs 36,000 km", "7 source photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-08", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-08",
    title: "2020 Toyota Hilux Revo Smart Cab 2.4 Mid AT", summary: "A white 2020 Hilux Revo Smart Cab 2.4 Mid with automatic transmission and 97,225 km. Drive type, availability, equipment, and condition require verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Mid", engine: "2.4L diesel", transmission: "AT", drive: "Unknown", body: "Smart Cab", mileageKm: 97225, color: "White",
    observedPriceThb: 369000, observedAt: "2026-08-25T15:51:27.887Z", generalLocation: "Nonthaburi",
    imageUrls: images("nk-mkt-08", ["092ada100d1444cc.jpg", "c570acd459a4b7c1.jpg", "d242baf7e659395b.jpg", "bc661c9f41d4f3ac.jpg", "62a8e760da631a68.jpg", "3d4070b7a9d52afe.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Drive type needs review", "6 source photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-09", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-09",
    title: "2020 Toyota Hilux Revo Rocco 2.4 AT Double Cab", summary: "A black 2020 Hilux Revo Rocco double cab with a claimed 2.4L diesel engine, automatic transmission, and 62,861 km. Availability, history, and condition remain unverified.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Rocco", engine: "2.4L diesel", transmission: "AT", drive: "Unknown", body: "Double Cab", mileageKm: 62861, color: "Black",
    observedPriceThb: 659000, observedAt: "2026-08-25T15:51:35.597Z", generalLocation: "Bangkok",
    imageUrls: images("nk-mkt-09", ["cover-redacted.webp", "acb906cef05f7a75.jpg", "74faa72d747b7095.jpg", "2a93374b55db5a90.jpg", "e492cc719d33950b.jpg", "dc25a71b5b3ba09c.jpg", "9d0de7e59e2e37be.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "Odometer photo", "7 source photos"], demo: false,
  },
  {
    id: "nk-market-2026-0825-10", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0825-10",
    title: "2020 Toyota Hilux Revo 2.8 4WD MT Single Cab", summary: "A white 2020 Hilux Revo single cab with a claimed 2.8L diesel engine, 4WD, manual transmission, and 98,000 km. Availability, history, modifications, and condition require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Need Review", engine: "2.8L diesel", transmission: "MT", drive: "4WD", body: "Single Cab", mileageKm: 98000, color: "White",
    observedPriceThb: 589000, observedAt, generalLocation: "Nonthaburi",
    imageUrls: images("nk-mkt-10", ["52b065880dab2d7b.jpg", "00d2d31374a296ce.jpg", "14e1df14d0e82daf.jpg", "7028696e309d78cc.jpg", "a6918f9b7268c4a7.jpg", "30fb0cf7d5af5704.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "Modification photo", "6 source photos"], demo: false,
  },
  {
    id: "nk-market-2026-0826-11", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0826-11",
    title: "2021 Toyota Hilux Revo Smart Cab Prerunner 2.4 AT", summary: "A grey 2021 Hilux Revo Smart Cab Prerunner with a 2.4L diesel engine, automatic transmission, 2WD, and 180,000 km. Availability, history, and condition still require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2021, grade: "Prerunner", engine: "2.4L diesel", transmission: "AT", drive: "2WD", body: "Smart Cab", mileageKm: 180000, color: "Grey",
    observedPriceThb: 385000, observedAt: approvedObservedAt, generalLocation: "Bangkok",
    imageUrls: approvedImages("nk-mkt-11", ["cover-redacted.png", "005-evidence-05.jpg", "006-evidence-06.jpg", "008-evidence-08.jpg", "010-evidence-10.jpg", "013-evidence-13.jpg", "014-evidence-14.jpg", "017-evidence-17.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "English normalization", "8 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0826-12", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0826-12",
    title: "2020 Toyota Hilux Revo Prerunner Mid 2.4 MT Smart Cab", summary: "A black 2020 Hilux Revo Prerunner Mid Smart Cab with a 2.4L diesel engine, manual transmission, 2WD, and 125,000 km. Availability, history, and condition remain unverified.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Prerunner Mid", engine: "2.4L diesel", transmission: "MT", drive: "2WD", body: "Smart Cab", mileageKm: 125000, color: "Black",
    observedPriceThb: 435000, observedAt: approvedObservedAt, generalLocation: "Bangkok",
    imageUrls: approvedImages("nk-mkt-12", ["cover-redacted.png", "007-evidence-07.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "English normalization", "2 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0826-13", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0826-13",
    title: "2020 Toyota Hilux Revo Z Edition 2.4E MT Smart Cab", summary: "A grey 2020 Hilux Revo Z Edition 2.4E Smart Cab with manual transmission and 26,200 km. Drive type, availability, history, and condition require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Z Edition 2.4E", engine: "2.4L diesel", transmission: "MT", drive: "Unknown", body: "Smart Cab", mileageKm: 26200, color: "Grey",
    observedPriceThb: 399000, observedAt: approvedObservedAt, generalLocation: "Bangkok",
    imageUrls: approvedImages("nk-mkt-13", ["004-evidence-04.jpg", "005-evidence-05.jpg", "009-evidence-09.jpg", "010-evidence-10.jpg", "013-evidence-13.jpg", "014-evidence-14.jpg", "015-evidence-15.jpg", "016-evidence-16.jpg", "017-evidence-17.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Drive type needs review", "9 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0826-14", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0826-14",
    title: "2020 Toyota Hilux Revo Smart Cab 2.4 Mid Z Edition", summary: "A 2020 Hilux Revo Smart Cab Mid Z Edition with a 2.4L diesel engine and 56,000 km. Available evidence conflicts on transmission and color, so those fields remain Need Review. Availability and condition are unverified.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Mid Z Edition", engine: "2.4L diesel", transmission: "Unknown", drive: "Unknown", body: "Smart Cab", mileageKm: 56000, color: "Need Review",
    observedPriceThb: 469000, observedAt: approvedObservedAt, generalLocation: "Bangkok",
    imageUrls: approvedImages("nk-mkt-14", ["cover-redacted.png", "008-evidence-08.jpg", "009-evidence-09.jpg", "010-evidence-10.jpg", "011-evidence-11.jpg", "012-evidence-12.jpg", "013-evidence-13.jpg", "014-evidence-14.jpg", "015-evidence-15.jpg", "016-evidence-16.jpg", "017-evidence-17.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Transmission and color conflict", "11 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0826-15", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0826-15",
    title: "2020 Toyota Hilux Revo 2.4 J MT Single Cab", summary: "A silver 2020 Hilux Revo J single cab with a 2.4L diesel engine, manual transmission, 110,000 km, and a cargo-body modification. Drive type, modification condition, and availability require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "J", engine: "2.4L diesel", transmission: "MT", drive: "Unknown", body: "Single Cab", mileageKm: 110000, color: "Silver",
    observedPriceThb: 298000, observedAt: approvedObservedAt, generalLocation: "Bangkok",
    imageUrls: approvedImages("nk-mkt-15", ["005-evidence-05.jpg", "006-evidence-06.jpg", "007-evidence-07.jpg", "008-evidence-08.jpg", "009-evidence-09.jpg", "010-evidence-10.jpg", "011-evidence-11.jpg", "012-evidence-12.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Cargo-body modification", "8 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0826-16", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0826-16",
    title: "2022 Toyota Hilux Revo 2.4 Mid Prerunner AT", summary: "A white 2022 Hilux Revo Mid Prerunner with a 2.4L diesel engine, automatic transmission, 2WD, and 142,000 km. Body configuration, availability, history, and condition require verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2022, grade: "Mid Prerunner", engine: "2.4L diesel", transmission: "AT", drive: "2WD", body: "Need Review", mileageKm: 142000, color: "White",
    observedPriceThb: 599000, observedAt: approvedObservedAt, generalLocation: "Pathum Thani",
    imageUrls: approvedImages("nk-mkt-16", ["002-evidence-02.jpg", "003-evidence-03.jpg", "009-evidence-09.jpg", "010-evidence-10.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Body configuration needs review", "4 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0826-17", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0826-17",
    title: "2020 Toyota Hilux Revo 2.4 Prerunner AT", summary: "A white 2020 Hilux Revo Prerunner with a 2.4L diesel engine, automatic transmission, 2WD, and 152,000 km. Body configuration, availability, history, and condition remain unverified.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Prerunner", engine: "2.4L diesel", transmission: "AT", drive: "2WD", body: "Need Review", mileageKm: 152000, color: "White",
    observedPriceThb: 427000, observedAt: approvedObservedAt, generalLocation: "Bangkok",
    imageUrls: approvedImages("nk-mkt-17", ["cover-redacted.png", "007-evidence-07.jpg", "009-evidence-09.jpg", "010-evidence-10.jpg", "011-evidence-11.jpg", "012-evidence-12.jpg", "014-evidence-14.jpg", "015-evidence-15.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Body configuration needs review", "8 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0826-18", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0826-18",
    title: "2020 Toyota Hilux Revo Smart Cab 2.4 Mid 2WD AT", summary: "A white 2020 Hilux Revo Smart Cab Mid with a 2.4L diesel engine, automatic transmission, 2WD, and 166,967 km. Availability, history, and condition still require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Mid", engine: "2.4L diesel", transmission: "AT", drive: "2WD", body: "Smart Cab", mileageKm: 166967, color: "White",
    observedPriceThb: 373000, observedAt: approvedObservedAt, generalLocation: "Samut Prakan",
    imageUrls: approvedImages("nk-mkt-18", ["003-evidence-03.jpg", "004-evidence-04.jpg", "006-evidence-06.jpg", "008-evidence-08.jpg", "009-evidence-09.jpg", "010-evidence-10.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Normalized", evidenceLabels: ["Listing facts", "English normalization", "6 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0826-19", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0826-19",
    title: "2020 Toyota Hilux Revo Rocco 2.4 MT Double Cab", summary: "A black 2020 Hilux Revo Rocco double cab with a 2.4L diesel engine, manual transmission, and 114,252 km. Drive type, availability, history, and condition require NK verification.",
    brand: "Toyota", model: "Hilux Revo", year: 2020, grade: "Rocco", engine: "2.4L diesel", transmission: "MT", drive: "Unknown", body: "Double Cab", mileageKm: 114252, color: "Black",
    observedPriceThb: 569000, observedAt: approvedObservedAt, generalLocation: "Bangkok",
    imageUrls: approvedImages("nk-mkt-19", ["cover-redacted.png", "003-evidence-03.jpg", "004-evidence-04.jpg", "005-evidence-05.jpg", "008-evidence-08.jpg", "011-evidence-11.jpg", "012-evidence-12.jpg", "013-evidence-13.jpg", "019-evidence-19.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Drive type needs review", "9 customer-reviewed photos"], demo: false,
  },
  {
    id: "nk-market-2026-0826-20", adapterId: "owner-reviewed-marketplace", sourceReference: "NK-MKT-2026-0826-20",
    title: "Toyota Hilux Revo Rocco Smart Cab 2.4 AT", summary: "A grey Hilux Revo Rocco Smart Cab with a 2.4L diesel engine, automatic transmission, 2WD, and 217,000 km. Available evidence conflicts on model year, so the year remains Need Review until documents are checked. Availability and condition are unverified.",
    brand: "Toyota", model: "Hilux Revo", year: null, grade: "Rocco", engine: "2.4L diesel", transmission: "AT", drive: "2WD", body: "Smart Cab", mileageKm: 217000, color: "Grey",
    observedPriceThb: 529000, observedAt: approvedObservedAt, generalLocation: "Samut Prakan",
    imageUrls: approvedImages("nk-mkt-20", ["cover-redacted.png", "003-evidence-03.jpg", "004-evidence-04.jpg", "005-evidence-05.jpg", "006-evidence-06.jpg", "007-evidence-07.jpg"]),
    availability: "Availability Not Yet Confirmed", translationState: "Need Review", evidenceLabels: ["Listing facts", "Model year conflict", "6 customer-reviewed photos"], demo: false,
  },
];
