export type AvailabilityState =
  | "Availability Not Yet Confirmed"
  | "Availability Check Requested"
  | "Verified Available"
  | "Price Changed"
  | "Possibly Unavailable";

export type TranslationState = "Normalized" | "Translation Pending" | "Need Review";

export type CustomerLanguage = "en" | "zh-CN" | "th";
export type SourceLanguage = CustomerLanguage | "unknown";

export type SourceTextEvidence = {
  originalText: string;
  sourceLanguage: SourceLanguage;
  normalizedText: string;
  translationLanguage: CustomerLanguage;
};

export type TranslationTrace = {
  id: string;
  originalText: string;
  sourceLanguage: CustomerLanguage;
  translatedText: string | null;
  translationLanguage: CustomerLanguage;
  purpose: "buyer_to_seller" | "seller_to_buyer";
  status: "Prepared - not sent" | "Recorded" | "Needs Human Review";
  createdAt: string;
};

export type CustomerListing = {
  id: string;
  adapterId: string;
  sourceReference: string;
  title: string;
  summary: string;
  brand: string;
  model: string;
  year: number | null;
  grade: string;
  engine: string;
  transmission: "AT" | "MT" | "Unknown";
  drive: "2WD" | "4WD" | "Unknown";
  body: string;
  mileageKm: number | null;
  color: string;
  observedPriceThb: number | null;
  observedAt: string;
  generalLocation: string;
  imageUrls: string[];
  availability: AvailabilityState;
  translationState: TranslationState;
  evidenceLabels: string[];
  demo: boolean;
};

export type BrowseFilters = {
  query: string;
  location: string;
  yearFrom: string;
  yearTo: string;
  priceMin: string;
  priceMax: string;
  mileageMax: string;
  transmission: string;
  drive: string;
  body: string;
  sort: "recommended" | "price-low" | "price-high" | "year-new" | "mileage-low";
};

export type CaseMessage = {
  id: string;
  sender: "Customer" | "NK AI" | "NK Team" | "System";
  text: string;
  createdAt: string;
  delivery: "Local preview" | "Prepared - not sent" | "Recorded";
};

export type CaseTimelineItem = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
};

export type InspectionQuote = {
  region: string;
  baseFeeThb: number;
  travelFeeThb: number;
  totalThb: number;
  status: "Quote Ready" | "Requested - Awaiting Provider";
  requestedAt?: string;
};

export type SourceCapture = {
  id: string;
  listingId: string;
  sourceReference: string;
  adapterId: string;
  sourcePlatform: string;
  submittedUrl: string;
  canonicalUrl: string;
  captureMethod:
    | "external_share_link"
    | "web_share_target"
    | "ios_share_extension"
    | "ios_wkwebview"
    | "android_webview"
    | "windows_webview2"
    | "web_browser_companion"
    | "manual_evidence";
  importStatus: "imported" | "partial" | "evidence_only";
  capturedAt: string;
  textEvidence?: SourceTextEvidence;
};

export type VehicleCase = {
  id: string;
  customerId: string;
  listingId: string;
  sourceReference: string;
  sourceCaptureId: string | null;
  createdAt: string;
  updatedAt: string;
  status: "Saved" | "Availability Requested" | "Inspection Requested";
  availability: AvailabilityState;
  vehicle: CustomerListing;
  actualVehiclePurchasePriceThb: number | null;
  platformTransactionRate: number;
  buyingServiceRate: number;
  inspectionQuote: InspectionQuote | null;
  domesticTransportThb: number | null;
  repairModificationThb: number | null;
  exportShippingThb: number | null;
  otherAgreedThb: number | null;
  translationHistory: TranslationTrace[];
  messages: CaseMessage[];
  timeline: CaseTimelineItem[];
};

export type PricingLine = {
  key: string;
  amountThb: number | null;
  status: "Known" | "Pending";
};

export type PricingBreakdown = {
  platformTransactionRate: number;
  buyingServiceRate: number;
  platformTransactionAmountThb: number | null;
  buyingServiceAmountThb: number | null;
  totalNkFeeAmountThb: number | null;
  knownSubtotalThb: number;
  pendingCount: number;
  lines: PricingLine[];
};

export type GeneralMessage = {
  id: string;
  sender: "Customer" | "NK AI" | "System";
  text: string;
  createdAt: string;
};

export type BuyingBrowserState = {
  version: 1;
  savedListingIds: string[];
  cases: VehicleCase[];
  importedListings: CustomerListing[];
  sourceCaptures: SourceCapture[];
  generalMessages: GeneralMessage[];
};

export type BuyingBrowserView =
  | "source"
  | "web-browser"
  | "browse"
  | "saved"
  | "vehicle"
  | "paste"
  | "share"
  | "cases"
  | "case"
  | "inspections"
  | "messages"
  | "account"
  | "ask";

export type CustomerIdentity = {
  id: string;
  displayName: string;
  email: string | null;
  country: string;
  destinationPort: string;
  isPreview: boolean;
};

export type SourceAdapterStatus = {
  adapterId: string;
  label: string;
  mode: "demo" | "live" | "fallback" | "snapshot";
  live: boolean;
  state: "ready" | "login_required" | "not_connected" | "error";
  message: string;
};

export type WorkspaceSyncStatus = {
  mode: "local" | "syncing" | "synced" | "error";
  message: string;
  updatedAt: string | null;
};
