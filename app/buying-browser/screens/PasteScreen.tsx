"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { AlertCircle, Bot, Camera, CheckCircle2, ClipboardPaste, ExternalLink, FileText, FolderPlus, Globe2, ImagePlus, Link2, LoaderCircle, ShieldCheck, Upload, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { createExternalSourceCapture } from "../domain.mjs";
import { nativeCaptureMethod } from "../native-bridge";
import { formatMileage, formatUsdFromThb } from "../format";
import { useI18n } from "../use-i18n";
import { detectSourceLanguage } from "../i18n.mjs";
import type { CustomerListing, SourceCapture } from "../types";

type ImportPayload = {
  status?: string;
  canonical_url?: string;
  title?: string;
  description?: string;
  listing_text?: string;
  source_price?: string | number;
  location?: string;
  images?: string[];
  expected_image_count?: number;
  gallery_complete?: boolean;
  missing?: string[];
  draft_fields?: Record<string, string>;
  message?: string;
};

type EvidencePhoto = { name: string; dataUrl: string };

const knownLocations = ["Bangkok", "Chon Buri", "Rayong", "Ayutthaya", "Chiang Mai", "Khon Kaen", "Nakhon Ratchasima", "Songkhla", "Thailand"];

function broadLocation(value: unknown) {
  const text = typeof value === "string" ? value : "";
  return knownLocations.find((location) => text.toLowerCase().includes(location.toLowerCase())) || "Thailand";
}

function numeric(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function referenceFromUrl(value: string) {
  const item = value.match(/\/marketplace\/item\/(\d+)/i)?.[1];
  if (item) return `FB-${item}`;
  let hash = 0;
  for (const character of value) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  return `LINK-${Math.abs(hash)}`;
}

function isFacebookHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com" || host.endsWith(".fb.com");
}

function extractFacebookUrl(value: string) {
  const candidates = value.match(/https:\/\/[^\s]+/gi) || [];
  for (const candidate of candidates) {
    const cleaned = candidate.replace(/[),.;]+$/, "");
    try {
      const url = new URL(cleaned);
      if (isFacebookHost(url.hostname)) return url.href;
    } catch {
      // Ignore non-URL text from the operating-system share sheet.
    }
  }
  return "";
}

function facebookSourceCaptureUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && isFacebookHost(url.hostname) ? url.href : "";
  } catch {
    return "";
  }
}

function buildImportedListing(payload: ImportPayload, submittedUrl: string): CustomerListing {
  const fields = payload.draft_fields || {};
  const titleParts = [fields.year, fields.brand, fields.model, fields.grade].filter(Boolean);
  const title = titleParts.join(" ") || payload.title?.slice(0, 120) || "Vehicle from shared link";
  const mileage = numeric(fields.mileage);
  const sourceRef = referenceFromUrl(payload.canonical_url || submittedUrl);
  const confirmedFacts = [fields.engine, fields.transmission, fields.drive, fields.body, mileage ? `${mileage.toLocaleString("en-US")} km` : ""].filter(Boolean);
  return {
    id: `imported-${sourceRef.toLowerCase()}`,
    adapterId: "facebook-link-import",
    sourceReference: sourceRef,
    title,
    summary: confirmedFacts.length ? `Normalized from accessible listing evidence: ${confirmedFacts.join(", ")}. Unknown facts still require review.` : "The link was preserved, but detailed vehicle facts need screenshots/photos or listing text before they can be normalized.",
    brand: fields.brand || "Need Review",
    model: fields.model || "Need Review",
    year: numeric(fields.year),
    grade: fields.grade || "Need Review",
    engine: fields.engine || "Need Review",
    transmission: fields.transmission === "AT" || fields.transmission === "MT" ? fields.transmission : "Unknown",
    drive: fields.drive === "2WD" || fields.drive === "4WD" ? fields.drive : "Unknown",
    body: fields.body || "Need Review",
    mileageKm: mileage,
    color: fields.color || "Need Review",
    observedPriceThb: numeric(payload.source_price),
    observedAt: new Date().toISOString(),
    generalLocation: broadLocation(payload.location),
    imageUrls: payload.images?.filter((image) => /^https:\/\//i.test(image)).slice(0, 30) || [],
    availability: "Availability Not Yet Confirmed",
    translationState: titleParts.length >= 3 ? "Normalized" : "Need Review",
    evidenceLabels: [payload.title ? "Accessible listing title" : "Shared source link", payload.description ? "Accessible listing description" : "Details pending", payload.images?.length ? `${payload.images.length} accessible image${payload.images.length === 1 ? "" : "s"}` : "Screenshots requested"],
    demo: false,
  };
}

async function compressImage(file: File): Promise<EvidencePhoto> {
  const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("read_failed")); reader.readAsDataURL(file); });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => { const node = new Image(); node.onload = () => resolve(node); node.onerror = () => reject(new Error("image_failed")); node.src = dataUrl; });
  const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { name: file.name, dataUrl: canvas.toDataURL("image/jpeg", 0.7) };
}

export default function PasteScreen({ autoCapture = false }: { autoCapture?: boolean }) {
  const { addImportedListing, saveAsCase, hydrated } = useBuyingBrowser();
  const { language, t, listingSummary } = useI18n();
  const [url, setUrl] = useState("");
  const [listingText, setListingText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<CustomerListing | null>(null);
  const [rawResult, setRawResult] = useState<ImportPayload | null>(null);
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [resultCapture, setResultCapture] = useState<SourceCapture | null>(null);
  const autoCaptureStarted = useRef(false);

  const validExternalUrl = useMemo(() => { try { const parsed = new URL(url); return parsed.protocol === "https:" ? parsed.href : ""; } catch { return ""; } }, [url]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = extractFacebookUrl(params.get("url") || params.get("text") || "");
    const captureMethod = nativeCaptureMethod(params.get("source"));
    if (!sharedUrl || !hydrated) return;
    if (autoCapture && autoCaptureStarted.current) return;
    if (autoCapture) autoCaptureStarted.current = true;
    queueMicrotask(() => {
      setUrl(sharedUrl);
      if (autoCapture) void importSourceLink(sharedUrl, true, captureMethod);
    });
    // importSourceLink intentionally runs once for the operating-system share request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCapture, hydrated]);

  function changeUrl(value: string) {
    setUrl(value);
    setResult(null);
    setRawResult(null);
    setResultCapture(null);
    setMessage("");
  }

  async function pasteSourceLink() {
    try {
      const sharedUrl = extractFacebookUrl(await navigator.clipboard.readText());
      if (!sharedUrl) { setMessage(t("clipboardNoFacebookLink")); return; }
      changeUrl(sharedUrl);
      setMessage(t("facebookLinkPasted"));
    } catch {
      setMessage(t("clipboardPasteManual"));
    }
  }

  async function importSourceLink(sourceUrl: string, createCaseAutomatically = false, captureMethod: SourceCapture["captureMethod"] = "external_share_link") {
    if (!sourceUrl) { setMessage(t("completeHttpsLink")); return; }
    const host = new URL(sourceUrl).hostname.toLowerCase();
    if (!isFacebookHost(host)) { setMessage(t("noConnectedImporter")); return; }
    setBusy(true); setMessage(""); setResult(null);
    try {
      const response = await fetch("/api/marketplace-import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: sourceUrl }) });
      const payload = await response.json() as ImportPayload;
      setRawResult(payload);
      if (!response.ok || !["imported", "partial"].includes(payload.status || "")) { setMessage(t("listingUnreadable")); return; }
      const listing = buildImportedListing(payload, sourceUrl);
      const canonicalUrl = facebookSourceCaptureUrl(payload.canonical_url || "") || sourceUrl;
      const sourceCapture = createExternalSourceCapture(listing, { submittedUrl: sourceUrl, canonicalUrl, sourcePlatform: "Facebook Marketplace", captureMethod: createCaseAutomatically ? captureMethod : "external_share_link", importStatus: payload.status === "imported" ? "imported" : "partial", ...(payload.description ? { textEvidence: { originalText: payload.description, sourceLanguage: detectSourceLanguage(payload.description), normalizedText: listing.summary, translationLanguage: "en" } } : {}) });
      addImportedListing(listing, sourceCapture); setResult(listing); setResultCapture(sourceCapture);
      if (createCaseAutomatically) {
        const id = saveAsCase(listing, undefined, sourceCapture);
        window.location.replace(`/buy/cases/${encodeURIComponent(id)}?captured=share`);
        return;
      }
      setMessage(t(payload.status === "partial" ? "partialImport" : "accessibleImported"));
    } catch { setMessage(t("sourceUnreachable")); }
    finally { setBusy(false); }
  }

  async function importLink(event: FormEvent) {
    event.preventDefault();
    await importSourceLink(validExternalUrl);
  }

  async function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/")).slice(0, 30 - photos.length);
    if (!files.length) return;
    setBusy(true);
    try { const next = await Promise.all(files.map(compressImage)); setPhotos((current) => [...current, ...next].slice(0, 30)); }
    catch { setMessage(t("imagePrepFailed")); }
    finally { setBusy(false); event.target.value = ""; }
  }

  async function analyzeEvidence() {
    if (!photos.length && !listingText.trim()) return;
    setAiBusy(true); setAiError("");
    try {
      const response = await fetch("/api/vehicle-extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ images: photos.map((photo) => photo.dataUrl), listingText, sourceUrl: validExternalUrl }) });
      const payload = await response.json() as { fields?: Record<string, { value?: string; status?: string }>; error?: string };
      if (!response.ok || !payload.fields) { setAiError(t(response.status === 503 ? "aiNotConnected" : "aiAnalyzeFailed")); return; }
      const values = Object.fromEntries(Object.entries(payload.fields).map(([key, field]) => [key, field.value === "Unknown" ? "" : field.value || ""]));
      const ref = validExternalUrl ? referenceFromUrl(validExternalUrl) : `UPLOAD-${Date.now()}`;
      const listing: CustomerListing = { id:`imported-${ref.toLowerCase()}`,adapterId:"uploaded-evidence",sourceReference:ref,title:[values.year,values.brand,values.model,values.grade].filter(Boolean).join(" ") || "Vehicle from uploaded evidence",summary:values.customerDescriptionEn || "Uploaded evidence saved for manual specification review.",brand:values.brand || "Need Review",model:values.model || "Need Review",year:numeric(values.year),grade:values.grade || "Need Review",engine:values.engine || values.engineCapacity || "Need Review",transmission:values.transmission === "AT" || values.transmission === "MT" ? values.transmission : "Unknown",drive:values.drive === "2WD" || values.drive === "4WD" ? values.drive : "Unknown",body:values.body || values.cabType || "Need Review",mileageKm:numeric(values.mileage),color:values.color || "Need Review",observedPriceThb:numeric(values.sourcePrice),observedAt:new Date().toISOString(),generalLocation:broadLocation(values.location),imageUrls:photos.map((photo) => photo.dataUrl),availability:"Availability Not Yet Confirmed",translationState:values.brand && values.model ? "Normalized" : "Need Review",evidenceLabels:[`${photos.length} uploaded image${photos.length === 1 ? "" : "s"}`,listingText.trim() ? "Pasted listing text" : "No listing text", "NK AI structured extraction"],demo:false };
      const facebookUrl = facebookSourceCaptureUrl(validExternalUrl);
      const sourceCapture = facebookUrl ? createExternalSourceCapture(listing, { submittedUrl: facebookUrl, canonicalUrl: facebookUrl, sourcePlatform: "Facebook Marketplace", captureMethod: "manual_evidence", importStatus: "evidence_only", ...(listingText.trim() ? { textEvidence: { originalText: listingText.trim(), sourceLanguage: "unknown", normalizedText: listing.summary, translationLanguage: language } } : {}) }) : undefined;
      addImportedListing(listing, sourceCapture); setResult(listing); setMessage(t("aiAnalyzed"));
    } catch { setAiError(t("aiUnreachable")); }
    finally { setAiBusy(false); }
  }

  function saveEvidenceOnly() {
    const ref = validExternalUrl ? referenceFromUrl(validExternalUrl) : `UPLOAD-${Date.now()}`;
    const listing: CustomerListing = { id:`imported-${ref.toLowerCase()}`,adapterId:"manual-evidence",sourceReference:ref,title:"Vehicle evidence awaiting review",summary:"Customer-supplied screenshots/photos and listing text were preserved in this local preview case. Vehicle facts still need manual or AI review.",brand:"Need Review",model:"Need Review",year:null,grade:"Need Review",engine:"Need Review",transmission:"Unknown",drive:"Unknown",body:"Need Review",mileageKm:null,color:"Need Review",observedPriceThb:null,observedAt:new Date().toISOString(),generalLocation:"Thailand",imageUrls:photos.map((photo) => photo.dataUrl),availability:"Availability Not Yet Confirmed",translationState:"Need Review",evidenceLabels:[`${photos.length} uploaded image${photos.length === 1 ? "" : "s"}`,listingText.trim() ? "Pasted listing text" : "Details pending"],demo:false };
    const facebookUrl = facebookSourceCaptureUrl(validExternalUrl);
    const sourceCapture = facebookUrl ? createExternalSourceCapture(listing, { submittedUrl: facebookUrl, canonicalUrl: facebookUrl, sourcePlatform: "Facebook Marketplace", captureMethod: "manual_evidence", importStatus: "evidence_only", ...(listingText.trim() ? { textEvidence: { originalText: listingText.trim(), sourceLanguage: "unknown", normalizedText: listing.summary, translationLanguage: language } } : {}) }) : undefined;
    addImportedListing(listing, sourceCapture); setResult(listing); setMessage(t("evidencePrepared"));
  }

  function openCase() { if (!result) return; const id = saveAsCase(result, undefined, resultCapture || undefined); window.location.assign(`/buy/cases/${encodeURIComponent(id)}`); }

  return (
    <>
      <section className="bb-page-heading"><div><p className="bb-kicker">{t(autoCapture ? "saveToNkCars" : "lastResortFallback")}</p><h1>{t(autoCapture ? "creatingVehicleCase" : "pasteFacebookVehicleLink")}</h1><p>{t(autoCapture ? "importingSharedVehicle" : "fallbackOnlyNotice")}</p></div></section>
      <section className="bb-facebook-handoff" data-facebook-external-handoff>
        <div><span><Globe2 size={21} /></span><div><b>{t("browseInFacebook")}</b><p>{t("facebookLoginControl")}</p></div></div>
        <a className="bb-button primary" href="https://www.facebook.com/marketplace/" target="_blank" rel="noreferrer">{t("openFacebookMarketplace")}<ExternalLink size={16} /></a>
        <ol><li>{t("stepBrowseSelect")}</li><li>{t("stepShareCopy")}</li><li>{t("stepReturnPaste")}</li></ol>
      </section>
      <section className="bb-paste-tool">
        <form onSubmit={importLink}><label><Link2 size={20} /><input value={url} onChange={(event) => changeUrl(event.target.value)} placeholder="https://www.facebook.com/marketplace/item/..." inputMode="url" aria-label={t("vehicleListingUrl")} /></label><button className="bb-button secondary bb-paste-clipboard" type="button" onClick={pasteSourceLink}><ClipboardPaste size={17} />{t("pasteAction")}</button><button className="bb-button primary" disabled={busy || !url.trim()} type="submit">{busy ? <LoaderCircle className="spin" size={18} /> : <Bot size={18} />}{t("importAnalyze")}</button></form>
        <div className="bb-source-safety"><ShieldCheck size={16} /><p>{t("sourceSafety")}</p></div>
        {message && <div className={result ? "bb-import-message success" : "bb-import-message"}><span>{result ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}</span><p>{message}</p>{validExternalUrl && !result && <a href={validExternalUrl} target="_blank" rel="noreferrer">{t("openSourceListing")}<ExternalLink size={15} /></a>}</div>}
      </section>

      {result && <section className="bb-import-preview"><div className="bb-import-cover">{result.imageUrls[0] ? <img src={result.imageUrls[0]} alt={result.title} /> : <div className="bb-photo-placeholder"><Camera size={27} /><span>{t("vehiclePhotoPending")}</span></div>}{rawResult?.images?.length && <span>{t("accessibleImages", { count: rawResult.images.length })}</span>}</div><div><p className="bb-kicker">{t("importedPreview")}</p><h2>{result.title}</h2><strong>{formatUsdFromThb(result.observedPriceThb)}</strong><p>{listingSummary(result)}</p><dl><div><dt>{t("transmission")}</dt><dd>{result.transmission}</dd></div><div><dt>{t("drive")}</dt><dd>{result.drive}</dd></div><div><dt>{t("bodyCab")}</dt><dd>{result.body}</dd></div><div><dt>{t("mileage")}</dt><dd>{formatMileage(result.mileageKm)}</dd></div></dl><button className="bb-button primary" onClick={openCase}><FolderPlus size={18} />{t("saveToNk")}</button></div></section>}

      <section className="bb-fallback-tool">
        <div className="bb-section-heading"><div><p className="bb-kicker">{t("workingFallback")}</p><h2>{t("uploadScreenshotsPhotos")}</h2><p>{t("uploadThirty")}</p></div><span><Camera size={20} /></span></div>
        <label className="bb-photo-drop"><input type="file" accept="image/*" multiple onChange={choosePhotos} /><ImagePlus size={27} /><b>{t(photos.length ? "addMoreImages" : "choosePhotos")}</b><small>{t("selectedCount", { count: photos.length })}</small></label>
        {photos.length > 0 && <div className="bb-evidence-photos">{photos.map((photo, index) => <figure key={`${photo.name}-${index}`}><img src={photo.dataUrl} alt={`Uploaded evidence ${index + 1}`} /><button onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove image ${index + 1}`}><X size={15} /></button><span>{index + 1}</span></figure>)}</div>}
        <label className="bb-listing-text"><span><FileText size={17} />{t("listingTextLabel")}</span><textarea value={listingText} onChange={(event) => setListingText(event.target.value)} placeholder={t("listingTextPlaceholder")} /></label>
        {aiError && <div className="bb-import-message"><AlertCircle size={18} /><p>{aiError}</p></div>}
        <div className="bb-fallback-actions"><button className="bb-button secondary" disabled={!photos.length && !listingText.trim()} onClick={saveEvidenceOnly}><Upload size={17} />{t("saveManualReview")}</button><button className="bb-button primary" disabled={aiBusy || (!photos.length && !listingText.trim())} onClick={analyzeEvidence}>{aiBusy ? <LoaderCircle className="spin" size={18} /> : <Bot size={18} />}{t("analyzeNkAi")}</button></div>
      </section>
      <p className="bb-honesty-note"><ShieldCheck size={16} />{t("localEvidenceNotice")}</p>
      <Link className="bb-back-link" href="/buy">{t("backBrowseVehicles")}</Link>
    </>
  );
}
