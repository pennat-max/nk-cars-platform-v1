"use client";

import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { formatMileage, formatThb } from "../format";
import type { CustomerListing } from "../types";
import VehiclePhoto from "./VehiclePhoto";

export default function ListingCard({ listing }: { listing: CustomerListing }) {
  const { isSaved, toggleSaved } = useBuyingBrowser();
  const saved = isSaved(listing.id);
  return (
    <article className="bb-listing-card" data-listing-id={listing.id}>
      <Link className="bb-listing-image" href={`/buy/vehicle/${encodeURIComponent(listing.id)}`}>
        <VehiclePhoto listing={listing} />
        <span className="bb-demo-flag">Demo source data</span>
      </Link>
      <button className={saved ? "bb-save-icon saved" : "bb-save-icon"} onClick={() => toggleSaved(listing.id)} aria-label={saved ? `Remove ${listing.title} from saved vehicles` : `Save ${listing.title}`} title={saved ? "Remove saved vehicle" : "Save vehicle"}><Heart size={19} fill={saved ? "currentColor" : "none"} /></button>
      <Link className="bb-listing-copy" href={`/buy/vehicle/${encodeURIComponent(listing.id)}`}>
        <small>{listing.year ?? "Year pending"} · {listing.transmission} · {listing.drive}</small>
        <h2>{listing.brand} {listing.model}</h2>
        <p>{listing.grade} · {listing.body}</p>
        <strong>{formatThb(listing.observedPriceThb)}</strong>
        <footer><span><MapPin size={13} />{listing.generalLocation}</span><span>{formatMileage(listing.mileageKm)}</span></footer>
      </Link>
    </article>
  );
}
