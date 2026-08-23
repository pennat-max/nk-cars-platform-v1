"use client";

/* eslint-disable @next/next/no-img-element */
import { Camera } from "lucide-react";
import type { CustomerListing } from "../types";

const spriteIndex: Record<string, number> = {
  "th-demo-001": 0, "th-demo-002": 1, "th-demo-003": 2, "th-demo-004": 3,
  "th-demo-005": 4, "th-demo-006": 5, "th-demo-007": 6, "th-demo-008": 7,
};

export default function VehiclePhoto({ listing, className = "", alt, imageUrl }: { listing: Pick<CustomerListing, "id" | "title" | "demo" | "imageUrls">; className?: string; alt?: string; imageUrl?: string }) {
  const index = spriteIndex[listing.id];
  const accessibleAlt = alt ?? listing.title;
  if (listing.demo && index !== undefined) return <div className={`bb-vehicle-photo bb-sprite-photo sprite-${index} ${className}`} role={accessibleAlt ? "img" : undefined} aria-label={accessibleAlt || undefined} aria-hidden={accessibleAlt ? undefined : true} />;
  if (!imageUrl && !listing.imageUrls[0]) return <div className={`bb-vehicle-photo bb-photo-placeholder ${className}`} role="img" aria-label="Vehicle photo pending"><Camera size={24} /><span>Vehicle photo pending</span></div>;
  return <img className={`bb-vehicle-photo ${className}`} src={imageUrl || listing.imageUrls[0]} alt={accessibleAlt} />;
}
