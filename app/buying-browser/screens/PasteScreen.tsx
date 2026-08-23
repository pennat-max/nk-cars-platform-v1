"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { AlertCircle, Bot, Camera, CheckCircle2, ExternalLink, FileText, FolderPlus, ImagePlus, Link2, LoaderCircle, ShieldCheck, Upload, X } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { formatMileage, formatThb } from "../format";
import type { CustomerListing } from "../types";

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

export default function PasteScreen() {
  const { addImportedListing, saveAsCase } = useBuyingBrowser();
  const [url, setUrl] = useState("");
  const [listingText, setListingText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<CustomerListing | null>(null);
  const [rawResult, setRawResult] = useState<ImportPayload | null>(null);
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  const validExternalUrl = useMemo(() => { try { const parsed = new URL(url); return parsed.protocol === "https:" ? parsed.href : ""; } catch { return ""; } }, [url]);

  function changeUrl(value: string) {
    setUrl(value);
    setResult(null);
    setRawResult(null);
    setMessage("");
  }

  async function importLink(event: FormEvent) {
    event.preventDefault();
    if (!validExternalUrl) { setMessage("Paste a complete HTTPS vehicle link."); return; }
    const host = new URL(validExternalUrl).hostname.toLowerCase();
    if (!isFacebookHost(host)) { setMessage("This source does not have a connected importer yet. The link is preserved in this form; add screenshots/photos or listing text below."); return; }
    setBusy(true); setMessage(""); setResult(null);
    try {
      const response = await fetch("/api/marketplace-import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: validExternalUrl }) });
      const payload = await response.json() as ImportPayload;
      setRawResult(payload);
      if (!response.ok || !["imported", "partial"].includes(payload.status || "")) { setMessage(payload.message || "This listing could not be read automatically. Continue with screenshots/photos or listing text."); return; }
      const listing = buildImportedListing(payload, validExternalUrl);
      addImportedListing(listing); setResult(listing);
      setMessage(payload.status === "partial" ? "Only part of the listing was accessible. Review the facts and add screenshots/photos for missing evidence." : "Accessible listing evidence imported. Availability is still not confirmed.");
    } catch { setMessage("The source could not be reached from this session. Continue with screenshots/photos or listing text."); }
    finally { setBusy(false); }
  }

  async function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/")).slice(0, 30 - photos.length);
    if (!files.length) return;
    setBusy(true);
    try { const next = await Promise.all(files.map(compressImage)); setPhotos((current) => [...current, ...next].slice(0, 30)); }
    catch { setMessage("One or more selected images could not be prepared. Try another photo or screenshot."); }
    finally { setBusy(false); event.target.value = ""; }
  }

  async function analyzeEvidence() {
    if (!photos.length && !listingText.trim()) return;
    setAiBusy(true); setAiError("");
    try {
      const response = await fetch("/api/vehicle-extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ images: photos.map((photo) => photo.dataUrl), listingText, sourceUrl: validExternalUrl }) });
      const payload = await response.json() as { fields?: Record<string, { value?: string; status?: string }>; error?: string };
      if (!response.ok || !payload.fields) { setAiError(response.status === 503 ? "NK AI is not connected in this preview. You can still save an evidence case for manual review." : "NK AI could not analyze this evidence. You can still save it for manual review."); return; }
      const values = Object.fromEntries(Object.entries(payload.fields).map(([key, field]) => [key, field.value === "Unknown" ? "" : field.value || ""]));
      const ref = validExternalUrl ? referenceFromUrl(validExternalUrl) : `UPLOAD-${Date.now()}`;
      const listing: CustomerListing = { id:`imported-${ref.toLowerCase()}`,adapterId:"uploaded-evidence",sourceReference:ref,title:[values.year,values.brand,values.model,values.grade].filter(Boolean).join(" ") || "Vehicle from uploaded evidence",summary:values.customerDescriptionEn || "Uploaded evidence saved for manual specification review.",brand:values.brand || "Need Review",model:values.model || "Need Review",year:numeric(values.year),grade:values.grade || "Need Review",engine:values.engine || values.engineCapacity || "Need Review",transmission:values.transmission === "AT" || values.transmission === "MT" ? values.transmission : "Unknown",drive:values.drive === "2WD" || values.drive === "4WD" ? values.drive : "Unknown",body:values.body || values.cabType || "Need Review",mileageKm:numeric(values.mileage),color:values.color || "Need Review",observedPriceThb:numeric(values.sourcePrice),observedAt:new Date().toISOString(),generalLocation:broadLocation(values.location),imageUrls:photos.map((photo) => photo.dataUrl),availability:"Availability Not Yet Confirmed",translationState:values.brand && values.model ? "Normalized" : "Need Review",evidenceLabels:[`${photos.length} uploaded image${photos.length === 1 ? "" : "s"}`,listingText.trim() ? "Pasted listing text" : "No listing text", "NK AI structured extraction"],demo:false };
      addImportedListing(listing); setResult(listing); setMessage("NK AI analyzed the uploaded evidence as one vehicle. Review unknown or low-confidence facts before verification.");
    } catch { setAiError("NK AI could not be reached. You can still save an evidence case for manual review."); }
    finally { setAiBusy(false); }
  }

  function saveEvidenceOnly() {
    const ref = validExternalUrl ? referenceFromUrl(validExternalUrl) : `UPLOAD-${Date.now()}`;
    const listing: CustomerListing = { id:`imported-${ref.toLowerCase()}`,adapterId:"manual-evidence",sourceReference:ref,title:"Vehicle evidence awaiting review",summary:"Customer-supplied screenshots/photos and listing text were preserved in this local preview case. Vehicle facts still need manual or AI review.",brand:"Need Review",model:"Need Review",year:null,grade:"Need Review",engine:"Need Review",transmission:"Unknown",drive:"Unknown",body:"Need Review",mileageKm:null,color:"Need Review",observedPriceThb:null,observedAt:new Date().toISOString(),generalLocation:"Thailand",imageUrls:photos.map((photo) => photo.dataUrl),availability:"Availability Not Yet Confirmed",translationState:"Need Review",evidenceLabels:[`${photos.length} uploaded image${photos.length === 1 ? "" : "s"}`,listingText.trim() ? "Pasted listing text" : "Details pending"],demo:false };
    addImportedListing(listing); setResult(listing); setMessage("Evidence case prepared. Specifications, source price, and availability remain unconfirmed.");
  }

  function openCase() { if (!result) return; const id = saveAsCase(result); window.location.assign(`/buy/cases/${encodeURIComponent(id)}`); }

  return (
    <>
      <section className="bb-page-heading"><div><p className="bb-kicker">Bring your own vehicle result</p><h1>Paste Vehicle Link</h1><p>NK imports only accessible evidence. When a source blocks access, keep the link and continue with screenshots, photos, or listing text.</p></div></section>
      <section className="bb-paste-tool">
        <form onSubmit={importLink}><label><Link2 size={20} /><input value={url} onChange={(event) => changeUrl(event.target.value)} placeholder="https://www.facebook.com/marketplace/item/..." inputMode="url" aria-label="Vehicle listing URL" /></label><button className="bb-button primary" disabled={busy || !url.trim()} type="submit">{busy ? <LoaderCircle className="spin" size={18} /> : <Bot size={18} />}Import & Analyze</button></form>
        <div className="bb-source-safety"><ShieldCheck size={16} /><p>NK does not collect source passwords, bypass MFA/CAPTCHA, or claim blocked data was imported.</p></div>
        {message && <div className={result ? "bb-import-message success" : "bb-import-message"}><span>{result ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}</span><p>{message}</p>{validExternalUrl && !result && <a href={validExternalUrl} target="_blank" rel="noreferrer">Open source listing<ExternalLink size={15} /></a>}</div>}
      </section>

      {result && <section className="bb-import-preview"><div className="bb-import-cover">{result.imageUrls[0] ? <img src={result.imageUrls[0]} alt={result.title} /> : <div className="bb-photo-placeholder"><Camera size={27} /><span>Vehicle photo pending</span></div>}{rawResult?.images?.length && <span>{rawResult.images.length}{rawResult.expected_image_count ? ` of ${rawResult.expected_image_count}` : ""} accessible image{rawResult.images.length === 1 ? "" : "s"}</span>}</div><div><p className="bb-kicker">Customer-safe imported preview</p><h2>{result.title}</h2><strong>{formatThb(result.observedPriceThb)}</strong><p>{result.summary}</p><dl><div><dt>Transmission</dt><dd>{result.transmission}</dd></div><div><dt>Drive</dt><dd>{result.drive}</dd></div><div><dt>Body</dt><dd>{result.body}</dd></div><div><dt>Mileage</dt><dd>{formatMileage(result.mileageKm)}</dd></div></dl><button className="bb-button primary" onClick={openCase}><FolderPlus size={18} />Save as Vehicle Case</button></div></section>}

      <section className="bb-fallback-tool">
        <div className="bb-section-heading"><div><p className="bb-kicker">Working fallback</p><h2>Upload Screenshots / Photos</h2><p>Select up to 30 images from one vehicle. They are analyzed together, not as unrelated vehicles.</p></div><span><Camera size={20} /></span></div>
        <label className="bb-photo-drop"><input type="file" accept="image/*" multiple onChange={choosePhotos} /><ImagePlus size={27} /><b>{photos.length ? "Add more images" : "Choose screenshots / photos"}</b><small>{photos.length}/30 selected · iPhone and Android compatible</small></label>
        {photos.length > 0 && <div className="bb-evidence-photos">{photos.map((photo, index) => <figure key={`${photo.name}-${index}`}><img src={photo.dataUrl} alt={`Uploaded evidence ${index + 1}`} /><button onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove image ${index + 1}`}><X size={15} /></button><span>{index + 1}</span></figure>)}</div>}
        <label className="bb-listing-text"><span><FileText size={17} />Listing text</span><textarea value={listingText} onChange={(event) => setListingText(event.target.value)} placeholder="Paste the vehicle title, description, price, mileage, and specifications here." /></label>
        {aiError && <div className="bb-import-message"><AlertCircle size={18} /><p>{aiError}</p></div>}
        <div className="bb-fallback-actions"><button className="bb-button secondary" disabled={!photos.length && !listingText.trim()} onClick={saveEvidenceOnly}><Upload size={17} />Save for manual review</button><button className="bb-button primary" disabled={aiBusy || (!photos.length && !listingText.trim())} onClick={analyzeEvidence}>{aiBusy ? <LoaderCircle className="spin" size={18} /> : <Bot size={18} />}Analyze with NK AI</button></div>
      </section>
      <p className="bb-honesty-note"><ShieldCheck size={16} />Uploaded evidence remains in this local preview only. Production needs private durable media storage, visibility controls, retention policy, and authenticated case ownership.</p>
      <Link className="bb-back-link" href="/buy">Back to Browse Vehicles</Link>
    </>
  );
}
