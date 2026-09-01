export type JaklaenCandidateStatus = "NEEDS_REVIEW" | "APPROVED" | "REJECTED" | "NEED_MORE_INFO";

export type JaklaenReviewField = {
  key: string;
  label: string;
  value: string;
  confidence: number;
  status: "Extracted" | "Need Review" | "Unknown" | "Conflict";
  evidence: string;
};

export type JaklaenCandidate = {
  candidateId: string;
  status: JaklaenCandidateStatus;
  sourcePlatform: "facebook_marketplace" | "facebook_group" | "authorized_source";
  sourceUrl: string;
  listingTitle: string;
  make: string;
  model: string;
  grade: string;
  year: string;
  transmission: string;
  engine: string;
  driveType: string;
  color: string;
  mileageKm: string;
  sourcePriceThb: string;
  location: string;
  sellerReference: string;
  description: string;
  images: string[];
  screenshot: string;
  collectedAt: string;
  confidence: number;
  missingFields: string[];
  duplicateSignals: string[];
};

export type JaklaenAuditEvent = {
  id: string;
  action: "CREATED" | "FIELD_EDITED" | "APPROVED" | "REJECTED" | "NEED_MORE_INFO";
  actor: string;
  note: string;
  createdAt: string;
};

export const jaklaenPreviewCandidate: JaklaenCandidate = {
  candidateId: "cand_test_jaklaen_preview_001",
  status: "NEEDS_REVIEW",
  sourcePlatform: "facebook_marketplace",
  sourceUrl: "https://www.facebook.com/marketplace/item/123456789/",
  listingTitle: "TEST/MOCK - 2022 Toyota Hilux Revo Double Cab AT",
  make: "Toyota",
  model: "Hilux Revo",
  grade: "UNKNOWN",
  year: "2022",
  transmission: "AT",
  engine: "PENDING",
  driveType: "2WD",
  color: "Black",
  mileageKm: "65,000",
  sourcePriceThb: "765,000",
  location: "Bangkok, Thailand",
  sellerReference: "TEST/MOCK seller reference hidden from customers",
  description: "TEST/MOCK preview candidate for Jaklaen intake. This is not a real listing test and must not be used as final sourcing proof.",
  images: [
    "/vehicle-marketplace/owner-reviewed-2026-08-26/nk-mkt-01/fd2aade7890beda0.jpg",
    "/vehicle-marketplace/owner-reviewed-2026-08-26/nk-mkt-01/e4d0761afd1e9d81.jpg",
    "/vehicle-marketplace/owner-reviewed-2026-08-26/nk-mkt-01/c500ea62da4f8865.jpg",
  ],
  screenshot: "/vehicle-marketplace/owner-reviewed-2026-08-26/nk-mkt-01/fd2aade7890beda0.jpg",
  collectedAt: "2026-09-01T08:00:00.000+07:00",
  confidence: 82,
  missingFields: ["grade", "engine"],
  duplicateSignals: ["Source URL not seen before", "No VIN or registration supplied"],
};

export const jaklaenPreviewFields: JaklaenReviewField[] = [
  { key: "make", label: "Make", value: jaklaenPreviewCandidate.make, confidence: 98, status: "Extracted", evidence: "Listing title" },
  { key: "model", label: "Model", value: jaklaenPreviewCandidate.model, confidence: 92, status: "Extracted", evidence: "Listing title + body badge" },
  { key: "grade", label: "Grade", value: jaklaenPreviewCandidate.grade, confidence: 0, status: "Unknown", evidence: "Not found" },
  { key: "year", label: "Year", value: jaklaenPreviewCandidate.year, confidence: 87, status: "Need Review", evidence: "Listing title" },
  { key: "transmission", label: "Transmission", value: jaklaenPreviewCandidate.transmission, confidence: 80, status: "Need Review", evidence: "Listing text" },
  { key: "engine", label: "Engine", value: jaklaenPreviewCandidate.engine, confidence: 0, status: "Unknown", evidence: "Not found" },
  { key: "driveType", label: "Drive", value: jaklaenPreviewCandidate.driveType, confidence: 76, status: "Need Review", evidence: "Listing text" },
  { key: "mileageKm", label: "Mileage", value: `${jaklaenPreviewCandidate.mileageKm} km`, confidence: 84, status: "Need Review", evidence: "Listing text" },
  { key: "sourcePriceThb", label: "Source price", value: `THB ${jaklaenPreviewCandidate.sourcePriceThb}`, confidence: 91, status: "Extracted", evidence: "Listing price" },
  { key: "location", label: "Location", value: jaklaenPreviewCandidate.location, confidence: 88, status: "Need Review", evidence: "Marketplace location" },
];

export const jaklaenPreviewAudit: JaklaenAuditEvent[] = [
  {
    id: "audit_test_001",
    action: "CREATED",
    actor: "integration:jaklaen-preview",
    note: "TEST/MOCK candidate received and forced to NEEDS_REVIEW. No publish, seller contact, payment, or production write.",
    createdAt: "2026-09-01T08:00:00.000+07:00",
  },
];
