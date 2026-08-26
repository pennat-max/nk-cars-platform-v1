"use client";

import Link from "next/link";
import { Gauge, Heart, MapPin } from "lucide-react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { formatMileage, formatUsdFromThb } from "../format";
import { useI18n } from "../use-i18n";
import type { CustomerListing } from "../types";
import VehiclePhoto from "./VehiclePhoto";

export default function ListingCard({ listing }: { listing: CustomerListing }) {
  const { isSaved, toggleSaved } = useBuyingBrowser();
  const { t } = useI18n();
  const saved = isSaved(listing.id);
  return (
    <article className="bb-listing-card" data-listing-id={listing.id} data-vehicle-card-v2>
      <Link className="bb-listing-image" href={`/buy/vehicle/${encodeURIComponent(listing.id)}`}>
        <VehiclePhoto listing={listing} />
        <span className={listing.demo ? "bb-demo-flag" : "bb-demo-flag captured"}>{listing.demo ? "Demo" : "NK Selection"}</span>
      </Link>
      <button className={saved ? "bb-save-icon saved" : "bb-save-icon"} onClick={() => toggleSaved(listing.id)} aria-label={saved ? `Remove ${listing.title} from saved vehicles` : `Save ${listing.title}`} title={saved ? "Remove saved vehicle" : "Save vehicle"}><Heart size={19} fill={saved ? "currentColor" : "none"} /></button>
      <Link className="bb-listing-copy" href={`/buy/vehicle/${encodeURIComponent(listing.id)}`}>
        <strong>{formatUsdFromThb(listing.observedPriceThb)}</strong>
        <h2>{listing.year ?? `${t("year")} ${t("pending")}`} {listing.brand} {listing.model}</h2>
        <p>{listing.grade} - {listing.body}</p>
        <footer><span><Gauge size={13} />{formatMileage(listing.mileageKm)}</span><span><MapPin size={13} />{listing.generalLocation}</span></footer>
      </Link>
    </article>
  );
}
