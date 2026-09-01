export type JaklaenCandidateStatus = "NEEDS_REVIEW" | "APPROVED" | "REJECTED" | "NEED_MORE_INFO";
export type JaklaenSearchMode = "SEARCH_NOW" | "STANDING_SEARCH";
export type JaklaenQueueStatus = "QUEUED" | "CLAIMED" | "RUNNING" | "CANDIDATE_RETURNED" | "BLOCKED";
export type JaklaenRequestPriority = "normal" | "high" | "urgent";
export type JaklaenReadinessStatus = "PASS" | "WARN" | "FAIL" | "NOT_TESTED";
export type JaklaenOverallStatus = "READY" | "DEGRADED" | "OFFLINE" | "BLOCKED";

export type JaklaenSearchCriteria = {
  make: string;
  model: string;
  grade: string;
  yearFrom: number;
  yearTo: number;
  transmission: string;
  engineFuel: string;
  driveType: string;
  color: string;
  maxPriceThb: number;
  maxMileageKm: number;
  location: string;
  radiusKm: number;
  quantityRequired: number;
  sources: string[];
};

export type JaklaenSchedule = {
  frequency: "daily" | "weekly";
  weekdays: string[];
  startTime: string;
  endTime: string;
  timezone: "Asia/Bangkok";
};

export type JaklaenSearchRequest = {
  requestId: string;
  mode: JaklaenSearchMode;
  criteria: JaklaenSearchCriteria;
  schedule: JaklaenSchedule | null;
  priority: JaklaenRequestPriority;
  requestedByRole: "OWNER" | "STAFF" | "CUSTOMER";
  requestedBy: string;
  customerCaseReference: string;
  active: boolean;
  createdAt: string;
};

export type JaklaenQueueJob = {
  jobId: string;
  requestId: string;
  mode: JaklaenSearchMode;
  status: JaklaenQueueStatus;
  workerId: string;
  safeStatus: string;
  createdAt: string;
  claimedAt: string | null;
  returnedCandidateId: string | null;
};

export type JaklaenReadinessCheck = {
  key: string;
  label: string;
  status: JaklaenReadinessStatus;
  detail: string;
  observedAt: string | null;
};

export type JaklaenEndToEndProof = {
  requestId: string;
  candidateId: string;
  sourceUrl: string;
  screenshot: string;
  foundAt: string;
  durationSeconds: number | null;
  testResult: "NOT_RUN" | "PASS" | "BLOCKED" | "FAILED";
  note: string;
};

export type JaklaenReadinessSnapshot = {
  overallStatus: JaklaenOverallStatus;
  currentBlocker: string;
  lastHeartbeat: string | null;
  lastJobReceived: string | null;
  lastSuccessfulSearch: string | null;
  checks: JaklaenReadinessCheck[];
  proof: JaklaenEndToEndProof;
};

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
  action: "SEARCH_REQUEST_CREATED" | "JOB_QUEUED" | "JOB_CLAIMED" | "CANDIDATE_RETURNED" | "CREATED" | "FIELD_EDITED" | "APPROVED" | "REJECTED" | "NEED_MORE_INFO";
  actor: string;
  note: string;
  createdAt: string;
};

export const jaklaenPreviewSearchRequest: JaklaenSearchRequest = {
  requestId: "srch_test_20260901_001",
  mode: "SEARCH_NOW",
  criteria: {
    make: "Toyota",
    model: "Hilux Revo",
    grade: "UNKNOWN",
    yearFrom: 2020,
    yearTo: 2024,
    transmission: "AT",
    engineFuel: "Diesel",
    driveType: "2WD or 4WD",
    color: "Any",
    maxPriceThb: 850000,
    maxMileageKm: 120000,
    location: "Bangkok Metro",
    radiusKm: 120,
    quantityRequired: 3,
    sources: ["facebook_marketplace", "facebook_group"],
  },
  schedule: null,
  priority: "high",
  requestedByRole: "OWNER",
  requestedBy: "owner@nktrade.internal",
  customerCaseReference: "CASE-TEST-REVO-001",
  active: true,
  createdAt: "2026-09-01T09:00:00.000+07:00",
};

export const jaklaenPreviewStandingSearch: JaklaenSearchRequest = {
  ...jaklaenPreviewSearchRequest,
  requestId: "stand_test_20260901_001",
  mode: "STANDING_SEARCH",
  schedule: {
    frequency: "daily",
    weekdays: ["mon", "tue", "wed", "thu", "fri"],
    startTime: "09:00",
    endTime: "17:00",
    timezone: "Asia/Bangkok",
  },
  priority: "normal",
  requestedByRole: "STAFF",
  requestedBy: "staff@nktrade.internal",
  customerCaseReference: "Company shortlist",
  createdAt: "2026-09-01T09:05:00.000+07:00",
};

export const jaklaenPreviewQueueJobs: JaklaenQueueJob[] = [
  {
    jobId: "job_test_search_now_001",
    requestId: jaklaenPreviewSearchRequest.requestId,
    mode: "SEARCH_NOW",
    status: "CANDIDATE_RETURNED",
    workerId: "jaklaen-hermes-preview",
    safeStatus: "Jaklaen claimed the job, searched approved sources, and returned one TEST/MOCK candidate for Owner review.",
    createdAt: "2026-09-01T09:00:05.000+07:00",
    claimedAt: "2026-09-01T09:00:12.000+07:00",
    returnedCandidateId: "cand_test_jaklaen_preview_001",
  },
  {
    jobId: "job_test_standing_001",
    requestId: jaklaenPreviewStandingSearch.requestId,
    mode: "STANDING_SEARCH",
    status: "QUEUED",
    workerId: "PENDING",
    safeStatus: "Next scheduled run will create a job inside active hours.",
    createdAt: "2026-09-01T09:05:00.000+07:00",
    claimedAt: null,
    returnedCandidateId: null,
  },
];

export const jaklaenPreviewReadiness: JaklaenReadinessSnapshot = {
  overallStatus: "BLOCKED",
  currentBlocker: "Real end-to-end Toyota Hilux Revo proof has not passed yet.",
  lastHeartbeat: null,
  lastJobReceived: "TEST/MOCK job only - not counted as readiness proof",
  lastSuccessfulSearch: null,
  checks: [
    { key: "hermes_connection", label: "Hermes Connection", status: "FAIL", detail: "No live Jaklaen/Hermes worker heartbeat is recorded in Preview.", observedAt: null },
    { key: "last_heartbeat", label: "Last Heartbeat", status: "NOT_TESTED", detail: "Waiting for worker heartbeat from the real runtime.", observedAt: null },
    { key: "last_job_received", label: "Last Job Received", status: "WARN", detail: "Only TEST/MOCK queue evidence exists. Real job not proven.", observedAt: "2026-09-01T09:00:12.000+07:00" },
    { key: "browser_control", label: "Browser Control", status: "NOT_TESTED", detail: "Real browser control has not been checked in this Preview run.", observedAt: null },
    { key: "facebook_login", label: "Facebook Login", status: "NOT_TESTED", detail: "No real logged-in Facebook session has been verified.", observedAt: null },
    { key: "session_persistence", label: "Session Persistence", status: "NOT_TESTED", detail: "No restart/session persistence proof exists for Jaklaen.", observedAt: null },
    { key: "marketplace_access", label: "Marketplace Access", status: "NOT_TESTED", detail: "Real Facebook Marketplace access is not confirmed.", observedAt: null },
    { key: "search_box_access", label: "Search Box Access", status: "NOT_TESTED", detail: "Search field automation has not passed a real run.", observedAt: null },
    { key: "image_capture", label: "Image Capture", status: "NOT_TESTED", detail: "Real listing image and screenshot capture proof is missing.", observedAt: null },
    { key: "nk_api_connection", label: "NK API Connection", status: "PASS", detail: "Preview API contract and worker-token tests pass locally, but not a live E2E proof.", observedAt: "2026-09-01T09:10:00.000+07:00" },
    { key: "last_successful_search", label: "Last Successful Search", status: "FAIL", detail: "No real Toyota Hilux Revo search has completed with Candidate in NEEDS_REVIEW.", observedAt: null },
  ],
  proof: {
    requestId: "PENDING_REAL_TEST",
    candidateId: "PENDING_REAL_TEST",
    sourceUrl: "PENDING_REAL_SOURCE_URL",
    screenshot: "PENDING_REAL_SCREENSHOT",
    foundAt: "PENDING",
    durationSeconds: null,
    testResult: "NOT_RUN",
    note: "Jaklaen is not READY until a real Toyota Hilux Revo listing is searched, captured, submitted, and visible in Candidate Review as NEEDS_REVIEW.",
  },
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
    id: "audit_test_queue_003",
    action: "CANDIDATE_RETURNED",
    actor: "worker:jaklaen-hermes-preview",
    note: "TEST/MOCK Candidate ID cand_test_jaklaen_preview_001 returned to NEEDS_REVIEW. No publish or seller contact.",
    createdAt: "2026-09-01T09:01:40.000+07:00",
  },
  {
    id: "audit_test_queue_002",
    action: "JOB_CLAIMED",
    actor: "worker:jaklaen-hermes-preview",
    note: "SEARCH_NOW job claimed from the Jaklaen queue with worker token authentication.",
    createdAt: "2026-09-01T09:00:12.000+07:00",
  },
  {
    id: "audit_test_queue_001",
    action: "JOB_QUEUED",
    actor: "owner-preview",
    note: "Search Request created from app and queued for Jaklaen.",
    createdAt: "2026-09-01T09:00:05.000+07:00",
  },
  {
    id: "audit_test_001",
    action: "CREATED",
    actor: "integration:jaklaen-preview",
    note: "TEST/MOCK candidate received and forced to NEEDS_REVIEW. No publish, seller contact, payment, or production write.",
    createdAt: "2026-09-01T08:00:00.000+07:00",
  },
];
