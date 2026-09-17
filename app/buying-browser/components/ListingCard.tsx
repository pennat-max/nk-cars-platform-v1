"use client";

import Link from "next/link";
import { Camera, CheckCircle2, Clock3, Heart } from "lucide-react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { formatCustomerPrimaryPrice, formatThb } from "../format";
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
  const { isSaved, toggleSaved, fxQuote } = useBuyingBrowser();
  const { language, t } = useI18n();
  const saved = isSaved(listing.id);
  const gradeEvidence = listing.specEvidence?.find((item) => item.field === "grade" && item.status === "confirmed" && item.value !== "Unknown");
  const verifiedGrade = gradeEvidence?.value || ((listing.grade && !["Unknown", "Source listing", "Need Review"].includes(listing.grade)) ? listing.grade : null);
  const usable = (value: string) => value && !["Unknown", "Need Review", "Source listing", "Pending"].includes(value);
  const facts = [
    verifiedGrade ? `${language === "zh-CN" ? "版本" : language === "th" ? "เกรด" : "Grade"} ${verifiedGrade}` : null,
    usable(listing.engine) ? listing.engine : null,
    listing.transmission !== "Unknown" ? listing.transmission : null,
    listing.drive !== "Unknown" ? listing.drive : null,
    usable(listing.body) ? listing.body : null,
    listing.mileageKm !== null ? `${listing.mileageKm.toLocaleString("en-US")} km` : null,
    usable(listing.color) ? listing.color : null,
  ].filter((fact): fact is string => Boolean(fact));
  const trustText = language === "zh-CN"
    ? { qa: "资料已审核", field: "未现场验车", observed: "车源价", grade: "版本" }
    : language === "th"
      ? { qa: "ตรวจข้อมูลแล้ว", field: "ยังไม่ตรวจหน้างาน", observed: "ราคาประกาศ", grade: "เกรด" }
      : { qa: "Data reviewed", field: "Not inspected", observed: "Source price", grade: "Grade" };
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
        <strong>{formatCustomerPrimaryPrice(listing.observedPriceThb, language, fxQuote.customerRate)}</strong>
        {listing.observedPriceThb !== null && <em className="bb-card-source-price">{formatThb(listing.observedPriceThb)} · {trustText.observed}</em>}
        <h2>{listing.year ?? `${t("year")} ${t("pending")}`} {listing.brand} {listing.model}</h2>
        <div className="bb-card-facts">{facts.map((fact, index) => <span className={index === 0 && verifiedGrade ? "bb-grade-badge" : undefined} key={fact}>{fact}</span>)}<span><Camera size={13} />{listing.imageUrls.length}</span></div>
        <div className="bb-card-trust"><span><CheckCircle2 size={13}/>{trustText.qa}</span><span><Clock3 size={13}/>{trustText.field}</span></div>
      </Link>
    </article>
  );
}
