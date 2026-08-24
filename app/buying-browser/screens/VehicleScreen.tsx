"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, Gauge, Heart, MapPin, ShieldCheck, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { formatDateTime, formatMileage, formatThb } from "../format";
import VehiclePhoto from "../components/VehiclePhoto";

export default function VehicleScreen({ sourceId }: { sourceId?: string }) {
  const { listings, isSaved, toggleSaved, saveAsCase, findCaseByListing } = useBuyingBrowser();
  const listing = listings.find((item) => item.id === sourceId);
  const [imageIndex, setImageIndex] = useState(0);

  if (!listing) return <section className="bb-empty-state"><h1>Vehicle result not found</h1><p>This source result may no longer be in the preview set.</p><Link className="bb-button primary" href="/buy"><ArrowLeft size={17} />Back to Browse</Link></section>;
  const existingCase = findCaseByListing(listing.id);

  function openCase(action?: "availability" | "inspection") {
    const caseId = saveAsCase(listing!, action);
    window.location.assign(`/buy/cases/${encodeURIComponent(caseId)}`);
  }

  return (
    <>
      <Link className="bb-back-link" href="/buy"><ArrowLeft size={18} />Browse Vehicles</Link>
      <article className="bb-vehicle-detail" data-vehicle-detail-v2>
        <section className="bb-gallery">
          <div className="bb-gallery-main"><VehiclePhoto listing={listing} imageUrl={listing.imageUrls[imageIndex] || listing.imageUrls[0]} alt={`${listing.title} view ${imageIndex + 1}`} /><span>{listing.demo ? "Demo" : "Imported evidence"}</span></div>
          {!listing.demo && listing.imageUrls.length > 1 && <div className="bb-gallery-thumbs">{listing.imageUrls.map((image, index) => <button key={image} className={index === imageIndex ? "active" : ""} onClick={() => setImageIndex(index)} aria-label={`Show vehicle image ${index + 1}`}><img src={image} alt="" /></button>)}</div>}
        </section>
        <section className="bb-vehicle-summary">
          <div className="bb-status-row"><span className="bb-status-chip market">{listing.demo ? "Demo" : "Imported Evidence"}</span><span className="bb-status-chip pending"><Clock3 size={13} />{listing.availability}</span></div>
          <h1>{listing.title}</h1>
          <p className="bb-grade">{listing.grade} · {listing.color}</p>
          <strong className="bb-vehicle-price">{formatThb(listing.observedPriceThb)}</strong>
          <p className="bb-price-caption">Observed asking price at {formatDateTime(listing.observedAt)}. Current price is not yet verified.</p>
          <div className="bb-detail-location"><MapPin size={17} /><div><small>General vehicle location</small><b>{listing.generalLocation}, Thailand</b></div></div>
          <p className="bb-honesty-note"><ShieldCheck size={16} />This is a source vehicle, not NK-owned stock. Seller identity and source link remain internal.</p>
        </section>
      </article>

      <section className="bb-detail-band">
        <div className="bb-section-heading"><div><p className="bb-kicker">AI normalized information</p><h2>Vehicle specifications</h2></div><span className={listing.translationState === "Normalized" ? "bb-normalized" : "bb-review"}>{listing.translationState}</span></div>
        <div className="bb-spec-grid">
          <div><small>Year</small><b>{listing.year ?? "Need Review"}</b></div><div><small>Engine</small><b>{listing.engine || "Need Review"}</b></div><div><small>Transmission</small><b>{listing.transmission}</b></div><div><small>Drive</small><b>{listing.drive}</b></div><div><small>Body / Cab</small><b>{listing.body}</b></div><div><small>Mileage</small><b>{formatMileage(listing.mileageKm)}</b></div>
        </div>
        <div className="bb-vehicle-description"><h3>Vehicle overview</h3><p className="bb-normalized-summary">{listing.summary}</p><small>{listing.translationState === "Normalized" ? "English details normalized from available evidence." : "Basic listing details are ready. Translation and deeper normalization are pending review."}</small></div>
        <div className="bb-evidence-row">{listing.evidenceLabels.map((label) => <span key={label}><CheckCircle2 size={13} />{label}</span>)}</div>
      </section>

      <section className="bb-next-actions">
        <div className="bb-section-heading"><div><p className="bb-kicker">Continue through NK</p><h2>What would you like to do?</h2></div></div>
        <div data-vehicle-actions-v2>
          <button onClick={() => toggleSaved(listing.id)}><Heart size={22} fill={isSaved(listing.id) ? "currentColor" : "none"} /><span><b>{isSaved(listing.id) ? "Saved" : "Save Vehicle"}</b><small>Keep this vehicle in your saved list</small></span><ChevronRight size={18} /></button>
          <button onClick={() => openCase()}><Bot size={22} /><span><b>Ask NK AI</b><small>Ask about known facts and costs</small></span><ChevronRight size={18} /></button>
          <button onClick={() => openCase("availability")}><Gauge size={22} /><span><b>Check Availability</b><small>Prepare a current seller verification request</small></span><ChevronRight size={18} /></button>
          <button onClick={() => openCase("inspection")}><ClipboardCheck size={22} /><span><b>Request Inspection</b><small>Use configured inspection and travel pricing</small></span><ChevronRight size={18} /></button>
          <button className="bb-buy-action" onClick={() => openCase()}><ShoppingBag size={22} /><span><b>Buy Through NK</b><small>{existingCase ? "Continue in your existing Vehicle Case" : "Create a Vehicle Case with no purchase commitment"}</small></span><ChevronRight size={18} /></button>
        </div>
      </section>
    </>
  );
}
