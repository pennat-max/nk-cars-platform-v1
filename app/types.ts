export type Role = "Owner" | "Internal Staff" | "Customer";
export type VehicleState = "Waiting Review" | "Published" | "Reserved" | "Sold" | "Rejected";
export type LeadStage = "New" | "Qualified" | "Vehicle Selected" | "Availability Check" | "Closed";

export type Source = {
  id: string; name: string; seller: string; price: number; url: string;
  lastVerified: string; status: "Verified" | "Needs verification" | "Unavailable";
};
export type TimelineItem = { id: string; time: string; label: string; detail: string };
export type Vehicle = {
  id: string; stockNo: string; brand: string; model: string; year: string; grade: string;
  engine: string; transmission: string; drive: string; body: string; mileage: string;
  color: string; sourcePrice: number; sellingPrice: number; state: VehicleState;
  availabilityVerified: boolean; image: string; plateMasked: string; vinMasked: string;
  sources: Source[]; confidence: Record<string, number>; possibleDuplicate?: string;
  lastSoldPrice?: number; soldMonth?: string; destination?: string; timeline: TimelineItem[];
};
export type Lead = {
  id: string; customer: string; country: string; vehicleId?: string; requirement: string;
  stage: LeadStage; lastActivity: string; assigned: string; port?: string; quantity?: number; budget?: string;
};
export type Wanted = {
  id: string; customer: string; model: string; yearRange: string; transmission: string;
  drive: string; body: string; mileage: string; color: string; quantity: number;
  budget: string; country: string; port: string;
  status: "Searching" | "Matched" | "Customer Reviewing" | "Closed";
};
export type SourcingRule = {
  id: string; brand: string; model: string; years: string; maxPrice: number;
  transmission: string; drive: string; body: string; maxMileage: string; color: string;
  area: string; required: string; excluded: string; priority: "Normal" | "High" | "Urgent"; active: boolean;
};
