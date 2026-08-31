"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { formatCustomerPrimaryPrice } from "../format";
import { useI18n } from "../use-i18n";
import type { CustomerListing } from "../types";
import VehiclePhoto from "./VehiclePhoto";

export default function ListingCard({
  listing,
  selectable = false,
  selected = false,
  onSelect,
}: {
  listing: CustomerListing;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (listingId: string) => void;
}) {
  const { isSaved, toggleSaved } = useBuyingBrowser();
  const { language, t } = useI18n();
  const saved = isSaved(listing.id);
  return (
    <article className="bb-listing-card" data-listing-id={listing.id} data-vehicle-card-v2>
      {selectable && <label className="bb-card-select" aria-label={`Select ${listing.title}`}>
        <input type="checkbox" checked={selected} onChange={() => onSelect?.(listing.id)} />
        <span />
      </label>}
      <Link className="bb-listing-image" href={`/buy/vehicle/${encodeURIComponent(listing.id)}`}>
        <VehiclePhoto listing={listing} />
        <span className={listing.demo ? "bb-demo-flag" : "bb-demo-flag captured"}>{listing.demo ? "Demo" : t("nkSelection")}</span>
      </Link>
      <button className={saved ? "bb-save-icon saved" : "bb-save-icon"} onClick={() => toggleSaved(listing.id)} aria-label={saved ? t("removeSaved", { vehicle: listing.title }) : `${t("saveVehicle")}: ${listing.title}`} title={saved ? t("removeSavedVehicle") : t("saveVehicle")}><Heart size={19} fill={saved ? "currentColor" : "none"} /></button>
      <Link className="bb-listing-copy" href={`/buy/vehicle/${encodeURIComponent(listing.id)}`}>
        <strong>{formatCustomerPrimaryPrice(listing.observedPriceThb, language)}</strong>
        <h2>{listing.year ?? `${t("year")} ${t("pending")}`} {listing.brand} {listing.model}</h2>
      </Link>
    </article>
  );
}
