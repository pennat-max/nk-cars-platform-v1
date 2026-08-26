"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Clock3, Gauge, Heart, MapPin, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { customerFxDisclosure, formatDateTime, formatMileage, formatUsdFromThb } from "../format";
import { useI18n } from "../use-i18n";
import VehiclePhoto from "../components/VehiclePhoto";

export default function VehicleScreen({ sourceId }: { sourceId?: string }) {
  const { listings, isSaved, toggleSaved, saveAsCase, findCaseByListing } = useBuyingBrowser();
  const { t, listingSummary, availabilityLabel } = useI18n();
  const listing = listings.find((item) => item.id === sourceId);
  const [imageIndex, setImageIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const galleryTrack = useRef<HTMLDivElement>(null);
  const fullscreenTrack = useRef<HTMLDivElement>(null);
  const fullscreenStartIndex = useRef(0);

  useEffect(() => {
    if (!fullscreenOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [fullscreenOpen]);

  useEffect(() => {
    if (!fullscreenOpen) return;
    const frame = window.requestAnimationFrame(() => {
      const track = fullscreenTrack.current;
      if (track) track.scrollTo({ left: track.clientWidth * fullscreenStartIndex.current });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fullscreenOpen]);

  useEffect(() => {
    if (!fullscreenOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFullscreenOpen(false);
        window.requestAnimationFrame(() => {
          const track = galleryTrack.current;
          if (track) track.scrollTo({ left: track.clientWidth * imageIndex });
        });
        return;
      }
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const nextIndex = Math.min(Math.max(imageIndex + (event.key === "ArrowLeft" ? -1 : 1), 0), (listing?.imageUrls.length ?? 1) - 1);
      const track = fullscreenTrack.current;
      if (track) track.scrollTo({ left: track.clientWidth * nextIndex, behavior: "smooth" });
      setImageIndex(nextIndex);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenOpen, imageIndex, listing?.imageUrls.length]);

  if (!listing) return <section className="bb-empty-state"><h1>Vehicle result not found</h1><p>This source result may no longer be in the preview set.</p><Link className="bb-button primary" href="/buy"><ArrowLeft size={17} />Back to Browse</Link></section>;
  const existingCase = findCaseByListing(listing.id);

  function showPhoto(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), listing!.imageUrls.length - 1);
    const track = galleryTrack.current;
    if (track) track.scrollTo({ left: track.clientWidth * nextIndex, behavior: "smooth" });
    setImageIndex(nextIndex);
  }

  function openFullscreen(index: number) {
    fullscreenStartIndex.current = index;
    setImageIndex(index);
    setFullscreenOpen(true);
  }

  function closeFullscreen() {
    setFullscreenOpen(false);
    window.requestAnimationFrame(() => showPhoto(imageIndex));
  }

  function showFullscreenPhoto(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), listing!.imageUrls.length - 1);
    const track = fullscreenTrack.current;
    if (track) track.scrollTo({ left: track.clientWidth * nextIndex, behavior: "smooth" });
    setImageIndex(nextIndex);
  }

  function openCase(action?: "availability" | "inspection") {
    const caseId = saveAsCase(listing!, action);
    window.location.assign(`/buy/cases/${encodeURIComponent(caseId)}`);
  }

  return (
    <>
      <Link className="bb-back-link" href="/buy"><ArrowLeft size={18} />{t("browseVehicles")}</Link>
      <article className="bb-vehicle-detail" data-vehicle-detail-v2>
        <section className="bb-gallery">
          <div className="bb-gallery-stage" data-swipe-gallery>
            <div ref={galleryTrack} className="bb-gallery-track" onScroll={(event) => { const width = event.currentTarget.clientWidth; if (width) setImageIndex(Math.round(event.currentTarget.scrollLeft / width)); }}>
              {listing.imageUrls.map((image, index) => <div className="bb-gallery-slide" key={image}><button type="button" className="bb-gallery-open" onClick={() => openFullscreen(index)} aria-label={`Open photo ${index + 1} fullscreen`}><VehiclePhoto listing={listing} imageUrl={image} alt={`${listing.title} view ${index + 1}`} /></button></div>)}
            </div>
            <span className="bb-gallery-counter">{imageIndex + 1} of {listing.imageUrls.length}</span>
            <button type="button" className={isSaved(listing.id) ? "bb-gallery-save saved" : "bb-gallery-save"} onClick={() => toggleSaved(listing.id)} aria-label={isSaved(listing.id) ? t("savedAction") : t("saveToNk")} title={isSaved(listing.id) ? t("savedAction") : t("saveToNk")}><Heart size={22} fill={isSaved(listing.id) ? "currentColor" : "none"} /></button>
            {listing.imageUrls.length > 1 && <><button className="bb-gallery-arrow previous" onClick={() => showPhoto(imageIndex - 1)} disabled={imageIndex === 0} aria-label="Previous photo" title="Previous photo"><ChevronLeft size={21} /></button><button className="bb-gallery-arrow next" onClick={() => showPhoto(imageIndex + 1)} disabled={imageIndex === listing.imageUrls.length - 1} aria-label="Next photo" title="Next photo"><ChevronRight size={21} /></button></>}
          </div>
          {!listing.demo && listing.imageUrls.length > 1 && <div className="bb-gallery-thumbs">{listing.imageUrls.map((image, index) => <button key={image} className={index === imageIndex ? "active" : ""} onClick={() => showPhoto(index)} aria-label={`Show vehicle image ${index + 1}`}><img src={image} alt="" /></button>)}</div>}
        </section>
        <section className="bb-vehicle-summary">
          <div className="bb-status-row"><span className="bb-status-chip market">{listing.demo ? "Demo" : "NK Selection"}</span><span className="bb-status-chip pending"><Clock3 size={13} />{availabilityLabel(listing.availability)}</span></div>
          <h1>{listing.title}</h1>
          <p className="bb-grade">{listing.grade} · {listing.color}</p>
          <strong className="bb-vehicle-price">{formatUsdFromThb(listing.observedPriceThb)}</strong>
          <p className="bb-price-caption">Observed asking price at {formatDateTime(listing.observedAt)}. {customerFxDisclosure()} Current price is not yet verified.</p>
          <div className="bb-detail-primary-actions">
            <button className="primary" onClick={() => openCase("availability")}><Gauge size={19} /><span><b>{t("checkAvailability")}</b><small>{t("recommendedFirstStep")}</small></span></button>
            <button onClick={() => openCase()}><Bot size={19} /><span><b>{t("askNkAi")}</b></span></button>
          </div>
          <div className="bb-detail-location"><MapPin size={17} /><div><small>General vehicle location</small><b>{listing.generalLocation}, Thailand</b></div></div>
          <p className="bb-honesty-note"><ShieldCheck size={16} />This is a source vehicle, not NK-owned stock. Seller identity and source link remain internal.</p>
        </section>
      </article>

      {fullscreenOpen && <section className="bb-photo-viewer" role="dialog" aria-modal="true" aria-label={`${listing.title} photo gallery`} data-fullscreen-viewer>
        <header>
          <button type="button" onClick={closeFullscreen} aria-label="Close fullscreen gallery" title="Close" autoFocus><X size={30} /></button>
          <strong aria-live="polite">{imageIndex + 1} of {listing.imageUrls.length}</strong>
        </header>
        <div ref={fullscreenTrack} className="bb-photo-viewer-track" onScroll={(event) => { const width = event.currentTarget.clientWidth; if (width) setImageIndex(Math.round(event.currentTarget.scrollLeft / width)); }}>
          {listing.imageUrls.map((image, index) => <div className="bb-photo-viewer-slide" key={image}><VehiclePhoto listing={listing} imageUrl={image} alt={`${listing.title} fullscreen view ${index + 1}`} /></div>)}
        </div>
        {listing.imageUrls.length > 1 && <><button type="button" className="bb-photo-viewer-arrow previous" onClick={() => showFullscreenPhoto(imageIndex - 1)} disabled={imageIndex === 0} aria-label="Previous fullscreen photo"><ChevronLeft size={30} /></button><button type="button" className="bb-photo-viewer-arrow next" onClick={() => showFullscreenPhoto(imageIndex + 1)} disabled={imageIndex === listing.imageUrls.length - 1} aria-label="Next fullscreen photo"><ChevronRight size={30} /></button></>}
      </section>}

      <section className="bb-detail-band">
        <div className="bb-section-heading"><div><p className="bb-kicker">{t("translatedVehicleDetails")}</p><h2>{t("vehicleSpecifications")}</h2></div><span className={listing.translationState === "Normalized" ? "bb-normalized" : "bb-review"}>{listing.translationState === "Normalized" ? t("translatedFromThai") : t("needsReview")}</span></div>
        <div className="bb-spec-grid">
          <div><small>{t("year")}</small><b>{listing.year ?? "Need Review"}</b></div><div><small>{t("engine")}</small><b>{listing.engine || "Need Review"}</b></div><div><small>{t("transmission")}</small><b>{listing.transmission}</b></div><div><small>{t("drive")}</small><b>{listing.drive}</b></div><div><small>{t("bodyCab")}</small><b>{listing.body}</b></div><div><small>{t("mileage")}</small><b>{formatMileage(listing.mileageKm)}</b></div>
        </div>
        <div className="bb-vehicle-description"><h3>{t("vehicleOverview")}</h3><p className="bb-normalized-summary">{listingSummary(listing)}</p><small>{t("originalFactsPreserved")}</small></div>
        <div className="bb-evidence-row"><span><CheckCircle2 size={13} />{t("listingFacts")}</span><span><CheckCircle2 size={13} />{listing.translationState === "Normalized" ? t("translatedFromThai") : t("needsReview")}</span><span><CheckCircle2 size={13} />{t("sourcePhotos", { count: listing.imageUrls.length })}</span></div>
      </section>

      <section className="bb-next-actions">
        <div className="bb-section-heading"><div><p className="bb-kicker">{t("continueThroughNk")}</p><h2>{t("chooseNext")}</h2></div></div>
        <div data-vehicle-actions-v2>
          <button onClick={() => openCase("inspection")}><ClipboardCheck size={22} /><span><b>{t("requestInspection")}</b><small>{t("inspectionInsideCase")}</small></span><ChevronRight size={18} /></button>
          <button className="bb-buy-action" onClick={() => openCase()}><ShoppingBag size={22} /><span><b>{t("buyThroughNk")}</b><small>{existingCase ? t("continueExistingCase") : t("createCaseNoCommitment")}</small></span><ChevronRight size={18} /></button>
        </div>
      </section>
    </>
  );
}
