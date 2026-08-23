"use client";

import { useEffect, useRef, useState } from "react";
import { buildCustomerDescriptionEn, sanitizeCustomerDescriptionEn } from "../lib/domain";
import type { AiFieldMeta, Vehicle, VehicleCorrection } from "../types";

type FieldKey =
  | "brand" | "model" | "year" | "grade" | "engine" | "engineCapacity"
  | "transmission" | "drive" | "body" | "cabType" | "mileage" | "color"
  | "vinChassis" | "registrationYear" | "sourcePrice" | "seller"
  | "sourcePlatform" | "listingText" | "location" | "customerDescriptionEn";
type FormValues = Record<FieldKey, string>;
type PhotoItem = { id: string; name: string; dataUrl: string };
type Stage = "start" | "fallback" | "review";
type ExtractionResponse = {
  fields: Record<FieldKey, { value: string } & AiFieldMeta>;
  conflicts: string[];
  summary: string;
  image_count: number;
};
type MarketplaceImport = {
  status: "imported" | "partial" | "cloud_setup_required" | "login_required" | "unavailable" | "connector_required" | "invalid_url";
  message?: string;
  action?: string;
  connector?: string;
  provider?: string;
  setup_url?: string;
  source_url?: string;
  canonical_url?: string;
  source_platform?: string;
  title?: string;
  description?: string;
  listing_text?: string;
  source_price?: string;
  seller?: string;
  location?: string;
  images?: string[];
  missing?: string[];
  conflicts?: string[];
  draft_fields?: Partial<FormValues>;
  expected_image_count?: number;
  gallery_complete?: boolean;
  cloud_status?: "complete" | "partial" | "not_configured" | "login_required" | "setup_required" | "unavailable";
};
type CloudStatus = { configured: boolean; provider: string };
type ImportIssue = "" | "setup" | "login" | "unavailable";

const MAX_PHOTOS = 30;
const emptyValues: FormValues = {
  brand: "", model: "", year: "", grade: "", engine: "", engineCapacity: "",
  transmission: "", drive: "", body: "", cabType: "", mileage: "", color: "",
  vinChassis: "", registrationYear: "", sourcePrice: "", seller: "",
  sourcePlatform: "", listingText: "", location: "", customerDescriptionEn: "",
};
const reviewFields: { key: FieldKey; label: string }[] = [
  { key: "brand", label: "Brand / ยี่ห้อ" }, { key: "model", label: "Model / รุ่น" },
  { key: "year", label: "Model Year / ปีรถ" }, { key: "grade", label: "Grade / เกรด" },
  { key: "engine", label: "Engine / เครื่องยนต์" }, { key: "engineCapacity", label: "Engine capacity / ความจุ" },
  { key: "transmission", label: "Transmission / เกียร์" }, { key: "drive", label: "Drive / ขับเคลื่อน" },
  { key: "body", label: "Body type / ตัวถัง" }, { key: "cabType", label: "Cab type / ประเภทแค็บ" },
  { key: "mileage", label: "Mileage / เลขไมล์" }, { key: "color", label: "Color / สี" },
  { key: "vinChassis", label: "VIN / Chassis" }, { key: "registrationYear", label: "Registration year / ปีจดทะเบียน" },
  { key: "sourcePrice", label: "Source price / ราคาต้นทาง" }, { key: "sourcePlatform", label: "Source / แหล่งที่มา" },
  { key: "seller", label: "Seller / ผู้ขาย" }, { key: "location", label: "Location / พื้นที่" },
];
const noPhoto = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='#e8edf2'/><text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' font-family='Arial' font-size='52' fill='#667383'>NO PHOTO</text></svg>");

function initialFromVehicle(vehicle?: Vehicle): FormValues {
  if (!vehicle) return { ...emptyValues };
  return {
    brand: vehicle.brand || "", model: vehicle.model || "", year: vehicle.year || "", grade: vehicle.grade || "",
    engine: vehicle.engine || "", engineCapacity: vehicle.engineCapacity || "", transmission: vehicle.transmission || "",
    drive: vehicle.drive || "", body: vehicle.body || "", cabType: vehicle.cabType || "", mileage: vehicle.mileage || "",
    color: vehicle.color || "", vinChassis: vehicle.vinChassis || "", registrationYear: vehicle.registrationYear || "",
    sourcePrice: vehicle.sourcePrice ? String(vehicle.sourcePrice) : "", seller: vehicle.seller || vehicle.sources?.[0]?.seller || "",
    sourcePlatform: vehicle.sourcePlatform || vehicle.sourceImport?.source_platform || "",
    listingText: vehicle.listingText || vehicle.sourceImport?.source_listing_text || "", location: vehicle.location || "",
    customerDescriptionEn: vehicle.customerDescriptionEn || "",
  };
}

function photosFromVehicle(vehicle?: Vehicle): PhotoItem[] {
  const images = vehicle?.images?.length ? vehicle.images : vehicle?.image ? [vehicle.image] : [];
  return images.map((dataUrl, index) => ({ id: `${vehicle?.id || "draft"}-${index}`, name: `saved-photo-${index + 1}.jpg`, dataUrl }));
}

function maskVin(value: string) {
  const clean = value.replace(/\s/g, "");
  return clean.length < 7 ? "Need Review" : `${clean.slice(0, 3)}••••••${clean.slice(-4)}`;
}

function readableValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return Boolean(normalized && normalized !== "unknown" && normalized !== "need review");
}

async function compressPhoto(file: File): Promise<PhotoItem> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("อ่านรูปนี้ไม่สำเร็จ กรุณาเลือกรูปอื่น"));
      element.src = objectUrl;
    });
    const maxSide = 1500;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("อุปกรณ์นี้ไม่รองรับการเตรียมรูป");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let quality = .8;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    for (let attempt = 0; attempt < 4 && dataUrl.length > 700_000; attempt += 1) {
      quality = Math.max(.58, quality - .07);
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    return { id: `${Date.now()}-${crypto.randomUUID()}`, name: file.name, dataUrl };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function PhotoGrid({ photos, coverId, onCover, onMove, onDelete }: {
  photos: PhotoItem[]; coverId: string; onCover: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void; onDelete: (id: string) => void;
}) {
  return <div className="photo-grid">
    {photos.map((photo, index) => <article className={coverId === photo.id ? "cover" : ""} key={photo.id}>
      <img src={photo.dataUrl} alt={`Vehicle photo ${index + 1}`} />
      <span className="photo-index">{index + 1}</span>
      {coverId === photo.id ? <span className="cover-badge">COVER</span> : null}
      <div className="photo-actions">
        <button type="button" onClick={() => onCover(photo.id)} aria-label={`Set photo ${index + 1} as cover`}>★</button>
        <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label="Move photo left">←</button>
        <button type="button" onClick={() => onMove(index, 1)} disabled={index === photos.length - 1} aria-label="Move photo right">→</button>
        <button type="button" className="delete" onClick={() => onDelete(photo.id)} aria-label={`Delete photo ${index + 1}`}>×</button>
      </div>
    </article>)}
  </div>;
}

function ReviewField({ field, value, meta, editing, manual, onEdit, onChange }: {
  field: { key: FieldKey; label: string }; value: string; meta?: AiFieldMeta; editing: boolean; manual: boolean;
  onEdit: () => void; onChange: (value: string) => void;
}) {
  const problem = meta?.status === "Conflict" || meta?.status === "Need Review";
  return <article className={`review-field ${problem ? "has-problem" : ""} ${manual ? "manual" : ""}`}>
    <div className="review-field-label"><span>{field.label}</span>{meta ? <b>{meta.confidence}%</b> : null}</div>
    {editing
      ? <input autoFocus value={value} onChange={(event) => onChange(event.target.value)} />
      : <div className="review-field-value"><strong>{value}</strong><button type="button" onClick={onEdit}>Edit</button></div>}
    <div className="review-field-foot">
      {manual ? <em>🔒 Manual correction — AI will not overwrite</em> : meta ? <em className={`status-${meta.status.replace(" ", "-").toLowerCase()}`}>{meta.status}</em> : null}
      {meta?.evidence?.[0] ? <small>{meta.evidence[0]}</small> : null}
    </div>
    {meta?.alternatives?.length ? <p>Possible: {meta.alternatives.join(" / ")}</p> : null}
  </article>;
}

export default function VehicleEditor({ initialVehicle, onSave, onCancel, notify }: {
  initialVehicle?: Vehicle; onSave: (vehicle: Vehicle) => void; onCancel: () => void; notify: (message: string) => void;
}) {
  const initialPhotos = photosFromVehicle(initialVehicle);
  const [stage, setStage] = useState<Stage>(initialVehicle ? "review" : "start");
  const [values, setValues] = useState<FormValues>(() => initialFromVehicle(initialVehicle));
  const [sourceUrl, setSourceUrl] = useState(initialVehicle?.sourceImport?.source_url || initialVehicle?.sources?.[0]?.url || "");
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [coverId, setCoverId] = useState(initialPhotos[0]?.id || "");
  const [aiMeta, setAiMeta] = useState<Partial<Record<FieldKey, AiFieldMeta>>>(initialVehicle?.aiMeta || {});
  const [aiOriginal, setAiOriginal] = useState<Partial<Record<FieldKey, string>>>({});
  const [manualFields, setManualFields] = useState<Set<FieldKey>>(new Set());
  const [editingFields, setEditingFields] = useState<Set<FieldKey>>(new Set());
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [summary, setSummary] = useState(initialVehicle?.aiSummary || "");
  const [showText, setShowText] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [importBlocked, setImportBlocked] = useState(false);
  const [importIssue, setImportIssue] = useState<ImportIssue>("");
  const [cloudStatus, setCloudStatus] = useState<CloudStatus | null>(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialVehicle) return;
    let active = true;
    fetch("/api/marketplace-cloud/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((status: CloudStatus) => { if (active) setCloudStatus(status); })
      .catch(() => { if (active) setCloudStatus({ configured: false, provider: "Browserless Cloud Browser" }); });
    return () => { active = false; };
  }, [initialVehicle]);

  function clearAll() {
    setStage("start"); setValues({ ...emptyValues }); setSourceUrl(""); setPhotos([]); setCoverId("");
    setAiMeta({}); setAiOriginal({}); setManualFields(new Set()); setEditingFields(new Set());
    setConflicts([]); setSummary(""); setShowText(false); setImportBlocked(false); setImportIssue(""); setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    setPhotos((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const next = current.filter((photo) => photo.id !== id);
      if (coverId === id) setCoverId(next[0]?.id || "");
      return next;
    });
  }

  function changeField(key: FieldKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setManualFields((current) => new Set(current).add(key));
  }

  async function analyzeVehicle(nextPhotos: PhotoItem[], listingText: string, nextUrl: string, prefill: Partial<FormValues> = {}) {
    setAnalyzing(true);
    setMessage("");
    const baseValues = { ...values };
    for (const [key, value] of Object.entries(prefill) as [FieldKey, string][]) {
      if (!manualFields.has(key) && !baseValues[key].trim() && value) baseValues[key] = value;
    }
    try {
      const response = await fetch("/api/vehicle-extract", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: nextPhotos.map((photo) => photo.dataUrl), listingText, sourceUrl: nextUrl }),
      });
      const payload = await response.json() as ExtractionResponse & { error?: string };
      if (!response.ok || !payload.fields) throw new Error("analysis_failed");
      const nextValues = { ...baseValues };
      const nextMeta = { ...aiMeta };
      const nextOriginal = { ...aiOriginal };
      (Object.keys(emptyValues) as FieldKey[]).forEach((key) => {
        const result = payload.fields[key];
        if (!result) return;
        nextMeta[key] = { confidence: result.confidence, status: result.status, evidence: result.evidence, alternatives: result.alternatives };
        if (!manualFields.has(key) && !nextValues[key].trim() && readableValue(result.value)) {
          nextValues[key] = result.value;
          nextOriginal[key] = result.value;
        }
      });
      if (!readableValue(nextValues.customerDescriptionEn)) {
        nextValues.customerDescriptionEn = buildCustomerDescriptionEn(nextValues);
      }
      setValues(nextValues); setAiMeta(nextMeta); setAiOriginal(nextOriginal);
      setConflicts(payload.conflicts || []); setSummary(payload.summary || ""); setStage("review");
      notify(`NK AI วิเคราะห์ ${payload.image_count || nextPhotos.length} รูปร่วมกันแล้ว`);
      return true;
    } catch {
      setStage("fallback");
      setMessage("NK AI ยังวิเคราะห์ชุดนี้ไม่สำเร็จ กรุณาเพิ่ม Screenshot หรือข้อความประกาศแล้วลองใหม่");
      return false;
    } finally {
      setAnalyzing(false);
    }
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return notify(`ครบ ${MAX_PHOTOS} รูปแล้ว`);
    setStage("fallback"); setPreparing(true); setMessage("");
    try {
      const prepared: PhotoItem[] = [];
      for (const file of Array.from(files).slice(0, remaining)) prepared.push(await compressPhoto(file));
      const nextPhotos = [...photos, ...prepared];
      setPhotos(nextPhotos); setCoverId((current) => current || nextPhotos[0]?.id || "");
      if (files.length > remaining) notify(`รับ ${remaining} รูป — จำกัดรถละ ${MAX_PHOTOS} รูปใน V1`);
      await analyzeVehicle(nextPhotos, values.listingText, sourceUrl);
    } catch {
      setMessage("เตรียมรูปไม่สำเร็จ กรุณาลองเลือกรูปอีกครั้ง");
    } finally {
      setPreparing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function importMarketplace() {
    if (!sourceUrl.trim()) return setMessage("กรุณาวางลิงก์ Facebook Marketplace ก่อน");
    setImporting(true); setImportBlocked(false); setImportIssue(""); setMessage("");
    try {
      const response = await fetch("/api/marketplace-import", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: sourceUrl.trim() }),
      });
      const imported = await response.json() as MarketplaceImport;
      if (imported.status === "invalid_url") {
        setStage("start"); setMessage(imported.message || "Paste a Facebook Marketplace listing link.");
        return;
      }
      if (!response.ok || (imported.status !== "imported" && imported.status !== "partial")) {
        const issue: ImportIssue = imported.status === "cloud_setup_required" || imported.status === "connector_required"
          ? "setup" : imported.status === "login_required" ? "login" : "unavailable";
        setStage("fallback"); setImportBlocked(true); setImportIssue(issue); setMessage("");
        return;
      }
      const importedPhotos = (imported.images || []).slice(0, MAX_PHOTOS).map((dataUrl, index) => ({
        id: `marketplace-${Date.now()}-${index}`, name: `marketplace-image-${index + 1}.jpg`, dataUrl,
      }));
      const listingText = [imported.listing_text, imported.seller ? `Seller: ${imported.seller}` : "", imported.location ? `Location: ${imported.location}` : ""].filter(Boolean).join("\n\n");
      const nextUrl = imported.canonical_url || sourceUrl.trim();
      setPhotos(importedPhotos); setCoverId(importedPhotos[0]?.id || "");
      setSourceUrl(nextUrl);
      const prefill: Partial<FormValues> = {
        ...(imported.draft_fields || {}),
        listingText, sourcePrice: imported.source_price || "", seller: imported.seller || "",
        location: imported.location || "", sourcePlatform: imported.source_platform || "Facebook Marketplace",
      };
      setValues((current) => ({ ...current, ...Object.fromEntries(Object.entries(prefill).filter(([, value]) => Boolean(value))), listingText }));
      const analyzed = await analyzeVehicle(importedPhotos, listingText, nextUrl, prefill);
      if (analyzed && (imported.conflicts?.length || imported.missing?.length)) {
        setConflicts((current) => [...(imported.conflicts || []), ...(imported.missing || []).map((item) => `Need screenshot/photo evidence: ${item}`), ...current]);
      }
      if (analyzed && imported.status === "partial") {
        const galleryMessage = imported.expected_image_count && importedPhotos.length < imported.expected_image_count
          ? `Imported ${importedPhotos.length} of ${imported.expected_image_count} listing photos. Add screenshots/photos or reconnect Cloud Browser to complete the gallery.`
          : imported.gallery_complete
            ? `Imported all ${importedPhotos.length} reachable listing photos.`
            : "We imported what was available. Upload screenshots/photos to complete the details.";
        setMessage(galleryMessage);
      }
      if (!analyzed) {
        setValues((current) => ({
          ...current,
          customerDescriptionEn: readableValue(current.customerDescriptionEn)
            ? current.customerDescriptionEn
            : buildCustomerDescriptionEn(current),
        }));
        setAiMeta((current) => ({
          ...current,
          brand: prefill.brand ? { confidence: 70, status: "Need Review", evidence: ["Facebook public metadata"], alternatives: [] } : current.brand,
          model: prefill.model ? { confidence: 70, status: "Need Review", evidence: ["Facebook public metadata"], alternatives: [] } : current.model,
          year: prefill.year ? { confidence: 70, status: "Need Review", evidence: ["Facebook public metadata"], alternatives: [] } : current.year,
          grade: prefill.grade ? { confidence: 55, status: "Need Review", evidence: ["Facebook public metadata"], alternatives: [] } : current.grade,
          engine: prefill.engine ? { confidence: 55, status: "Need Review", evidence: ["Facebook public metadata"], alternatives: [] } : current.engine,
          transmission: prefill.transmission ? { confidence: 55, status: "Need Review", evidence: ["Facebook public metadata"], alternatives: [] } : current.transmission,
          drive: prefill.drive ? { confidence: 55, status: "Need Review", evidence: ["Facebook public metadata"], alternatives: [] } : current.drive,
          body: prefill.body ? { confidence: 55, status: "Need Review", evidence: ["Facebook public metadata"], alternatives: [] } : current.body,
        }));
        setConflicts([...(imported.conflicts || []), ...(imported.missing || []).map((item) => `Need screenshot/photo evidence: ${item}`)]);
        setSummary("Public Facebook metadata was imported. Add screenshots/photos to confirm price, seller, location, gallery, and current availability.");
        setStage("review");
        setMessage("Imported public metadata. Upload screenshots/photos to complete the missing details.");
      }
    } catch {
      setStage("fallback"); setImportBlocked(true); setImportIssue("unavailable"); setMessage("");
    } finally {
      setImporting(false);
    }
  }

  async function analyzeFallback() {
    if (!photos.length && !values.listingText.trim()) return setMessage("อัปโหลดรูปหรือวางข้อความประกาศก่อนวิเคราะห์");
    await analyzeVehicle(photos, values.listingText, sourceUrl);
  }

  function saveDraft() {
    if (!photos.length && !Object.values(values).some(readableValue)) return setMessage("ยังไม่มีข้อมูลสำหรับบันทึก Draft");
    const now = new Date().toISOString();
    const id = initialVehicle?.id || `v${Date.now()}`;
    const cover = photos.find((photo) => photo.id === coverId)?.dataUrl || photos[0]?.dataUrl || initialVehicle?.image || noPhoto;
    const corrections: VehicleCorrection[] = Object.entries(aiOriginal)
      .filter(([key, value]) => value && values[key as FieldKey] !== value)
      .map(([key, value]) => ({ field: key, aiValue: value || "", correctedValue: values[key as FieldKey], correctedAt: now }));
    const sourcePrice = Number(values.sourcePrice.replace(/[^0-9.]/g, "")) || 0;
    const sourceName = values.sourcePlatform || "Manual / photo import";
    const base: Vehicle = initialVehicle || {
      id, stockNo: `NK-${String(Date.now()).slice(-5)}`, brand: "", model: "", year: "", grade: "", engine: "",
      transmission: "", drive: "", body: "", mileage: "", color: "", sourcePrice: 0, sellingPrice: 0,
      state: "Waiting Review", availabilityVerified: false, image: noPhoto, plateMasked: "Need Review", vinMasked: "Need Review",
      sources: [], confidence: {}, timeline: [],
    };
    const vehicle: Vehicle = {
      ...base,
      brand: values.brand || "Need Review", model: values.model || "Need Review", year: values.year || "Need Review",
      grade: values.grade || "Need Review", engine: values.engine || "Need Review", engineCapacity: values.engineCapacity || "Need Review",
      transmission: values.transmission || "Need Review", drive: values.drive || "Need Review", body: values.body || "Need Review",
      cabType: values.cabType || "Need Review", mileage: values.mileage || "Need Review", color: values.color || "Need Review",
      vinChassis: values.vinChassis || "", registrationYear: values.registrationYear || "Need Review", sourcePrice,
      seller: values.seller || "Need Review", sourcePlatform: values.sourcePlatform || "Need Review", listingText: values.listingText,
      customerDescriptionEn: sanitizeCustomerDescriptionEn(values.customerDescriptionEn) || buildCustomerDescriptionEn(values),
      location: values.location || "Need Review", state: "Waiting Review", image: cover, coverImage: cover,
      images: photos.map((photo) => photo.dataUrl), vinMasked: values.vinChassis ? maskVin(values.vinChassis) : "Need Review",
      sources: [{
        id: initialVehicle?.sources?.[0]?.id || `s-${Date.now()}`, name: sourceName, seller: values.seller || "Need Review",
        price: sourcePrice, url: sourceUrl || "Not provided", lastVerified: "Not verified", status: "Needs verification",
      }, ...(initialVehicle?.sources?.slice(1) || [])],
      confidence: Object.fromEntries(Object.entries(aiMeta).map(([key, value]) => [key, value?.confidence || 0])),
      aiMeta: aiMeta as Record<string, AiFieldMeta>, corrections: [...(initialVehicle?.corrections || []), ...corrections], aiSummary: summary,
      sourceImport: {
        source_url: sourceUrl, source_platform: values.sourcePlatform,
        source_images: photos.map((photo) => photo.dataUrl.startsWith("https://") ? photo.dataUrl : photo.name),
        imported_at: now, source_listing_text: values.listingText, source_seller: values.seller, source_price: sourcePrice,
      },
      timeline: [
        ...(initialVehicle?.timeline || []),
        { id: `${id}-${Date.now()}-save`, time: "Just now", label: initialVehicle ? "Draft updated" : "Vehicle imported", detail: `${photos.length} photos · Link-first AI intake.` },
        { id: `${id}-${Date.now()}-ai`, time: "Just now", label: "AI parsed", detail: conflicts.length ? `${conflicts.length} conflict(s) require review.` : "Link, listing text and images analyzed together." },
        ...(corrections.length ? [{ id: `${id}-${Date.now()}-feedback`, time: "Just now", label: "User corrections saved", detail: `${corrections.length} correction(s) stored as AI feedback.` }] : []),
      ],
    };
    onSave(vehicle);
  }

  const visibleFields = reviewFields.filter((field) => readableValue(values[field.key]));
  const problemFields = visibleFields.filter((field) => aiMeta[field.key]?.status === "Conflict" || aiMeta[field.key]?.status === "Need Review");
  const cover = photos.find((photo) => photo.id === coverId) || photos[0];
  const busy = importing || preparing || analyzing;

  return <div className={`vehicle-editor link-first-editor stage-${stage}`}>
    <input ref={inputRef} className="hidden-photo-input" type="file" accept="image/*" multiple onChange={(event) => addPhotos(event.target.files)} />
    <div className="editor-head compact-editor-head">
      <div><p className="eyebrow">NK Cars · AI-first intake</p><h1>{initialVehicle ? `Edit ${initialVehicle.stockNo}` : "Add Vehicle"}</h1></div>
      <button className="button secondary" onClick={clearAll}>Clear All</button>
    </div>

    {stage === "start" ? <section className="link-import-card">
      <div className="import-mark">↗</div>
      <p className="eyebrow">Import Vehicle</p>
      <h2>Paste Facebook Marketplace Link</h2>
      <p className="import-subcopy">วางลิงก์เดียว แล้วให้ NK AI ดึงข้อมูลและรูปที่เข้าถึงได้มาสร้าง Draft</p>
      <label className="primary-url-field"><span>Facebook Marketplace URL</span><input inputMode="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} autoCapitalize="none" autoCorrect="off" /></label>
      <button className="button ai import-ai-button" disabled={busy} onClick={importMarketplace}>{importing ? <><i className="spinner" />กำลังอ่าน Listing และรูป…</> : "✦ Import & Analyze with NK AI"}</button>
      {importing ? <div className="cloud-browser-progress" aria-live="polite">
        <i className="spinner" /><div><b>Cloud Browser กำลังเปิด Listing</b><span>อ่านข้อมูลจริงและรูปสูงสุด 30 รูป แล้วส่งหลักฐานทั้งหมดให้ NK AI</span></div>
      </div> : null}
      {message ? <div className="inline-message" role="alert">{message}</div> : null}
      <div className="or-divider"><span>or</span></div>
      <div className="import-alternatives">
        <button className="alt-import-button" onClick={() => inputRef.current?.click()}><span>▧</span><b>Upload Photos</b><small>เลือกพร้อมกันได้ 30 รูป</small></button>
        <button className="alt-import-button" onClick={() => { setStage("fallback"); setShowText(true); }}><span>≡</span><b>Paste Listing Text</b><small>AI จะอ่านแทนการกรอก Specs</small></button>
      </div>
      <div className={`connector-note ${cloudStatus?.configured ? "connector-connected" : "connector-setup"}`}>
        <b><i /> Public metadata first · Cloud Browser {cloudStatus === null ? "checking" : cloudStatus.configured ? "connected" : "setup needed for full gallery"}</b>
        <span>{cloudStatus?.configured
          ? "ระบบจะใช้ metadata สาธารณะก่อน แล้วเปิดแกลเลอรีเพื่อเก็บรูปที่เข้าถึงได้สูงสุด 30 รูปและอ่านข้อความประกาศทั้งหมด"
          : "Facebook มักส่งข้อมูลสาธารณะมาเพียงภาพปก หากต้องการรูปทั้งหมดให้เชื่อม Cloud Browser หนึ่งครั้ง หรืออัปโหลด screenshot/photos เพื่อวิเคราะห์ต่อ"}</span>
      </div>
    </section> : null}

    {stage === "fallback" ? <>
      {importBlocked ? <section className="import-failed-card">
        <span>!</span><div>
          <h2>{importIssue === "setup" ? "Cloud Browser setup required" : importIssue === "login" ? "Facebook login required in Cloud Browser" : "Facebook metadata is not available from this session"}</h2>
          <p>{importIssue === "setup"
            ? "ต้องเชื่อม Browserless token + Facebook profile ครั้งเดียว · ทำจากมือถือได้ · ลิงก์เดิมถูกเก็บไว้แล้ว"
            : importIssue === "login"
              ? "เปิด Browserless Profile เพื่อยืนยัน Facebook แล้วกด Try link again · ลิงก์เดิมถูกเก็บไว้แล้ว"
              : "Facebook ไม่เปิด public metadata ให้ ChatGPT Site ในครั้งนี้ · ลิงก์เดิมถูกเก็บไว้แล้ว · อัปโหลด screenshot/photos เพื่อให้ NK AI วิเคราะห์ต่อ"}</p>
          <div className="cloud-browser-actions">
            {importIssue === "unavailable" && sourceUrl ? <a className="button secondary" href={sourceUrl} target="_blank" rel="noreferrer">Open Facebook listing ↗</a> : null}
            {(importIssue === "setup" || importIssue === "login") ? <a className="button secondary" href="https://www.browserless.io/account" target="_blank" rel="noreferrer">Open Browserless ↗</a> : null}
            {importIssue === "login" ? <button className="button secondary" disabled={busy} onClick={importMarketplace}>Try link again</button> : null}
          </div>
        </div>
      </section> : null}
      <section className="fallback-card">
        <p className="eyebrow">Continue with NK AI</p><h2>Upload Screenshots / Photos</h2>
        <p>เลือกรูปรถหรือ Screenshot Marketplace หลายรูปพร้อมกัน แล้ว AI จะวิเคราะห์ทั้งชุดเป็นรถคันเดียว</p>
        {sourceUrl ? <div className="kept-url"><span>Source URL kept</span><b>{sourceUrl}</b></div> : null}
        <button className="button primary wide fallback-upload" disabled={busy || photos.length >= MAX_PHOTOS} onClick={() => inputRef.current?.click()}>{preparing ? "กำลังเตรียมรูป…" : photos.length ? "＋ Add more photos" : "▧ Upload Screenshots / Photos"}</button>
        {photos.length ? <><div className="fallback-photo-head"><span>{photos.length}/{MAX_PHOTOS} photos</span><small>★ Cover · ← → Reorder · × Delete</small></div><PhotoGrid photos={photos} coverId={coverId} onCover={setCoverId} onMove={movePhoto} onDelete={removePhoto} /></> : null}
        <div className="or-divider"><span>or add text</span></div>
        {showText ? <label className="fallback-text"><span>Listing Text / ข้อความประกาศ</span><textarea rows={6} value={values.listingText} onChange={(event) => changeField("listingText", event.target.value)} /></label>
          : <button className="button secondary wide" onClick={() => setShowText(true)}>≡ Paste Listing Text</button>}
        {message ? <div className="inline-message" role="alert">{message}</div> : null}
        {analyzing ? <div className="analyzing-state"><i className="spinner" /><div><b>NK AI กำลังวิเคราะห์รูปทั้งหมดร่วมกัน</b><small>กำลังอ่านตัวรถ ป้าย VIN หน้าปัด และข้อความใน Screenshot</small></div></div>
          : <button className="button ai fallback-analyze" disabled={!photos.length && !values.listingText.trim()} onClick={analyzeFallback}>✦ Analyze with NK AI</button>}
      </section>
    </> : null}

    {stage === "review" ? <>
      <div className="review-page-title"><div><p className="eyebrow">AI Vehicle Draft</p><h2>Review what NK AI found</h2><p>แก้เฉพาะข้อมูลที่ผิด แล้วบันทึกเข้า Waiting Review</p></div><span className="analysis-ready">AI READY</span></div>
      <section className="imported-vehicle-hero">
        <div className="imported-cover">{cover ? <img src={cover.dataUrl} alt="Selected vehicle cover" /> : <img src={noPhoto} alt="No vehicle photo" />}<span>COVER</span></div>
        <div className="imported-source">
          <p className="eyebrow">Source</p><h3>{values.sourcePlatform || (sourceUrl ? "Facebook Marketplace" : "Photo import")}</h3>
          <strong className="source-price">{values.sourcePrice ? `฿${Number(values.sourcePrice.replace(/[^0-9.]/g, "")).toLocaleString()}` : "Price: Need Review"}</strong>
          {values.seller ? <p>Seller: <b>{values.seller}</b></p> : null}{values.location ? <p>Location: <b>{values.location}</b></p> : null}
          {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer">Open source listing ↗</a> : null}
          <button className="button secondary" onClick={() => inputRef.current?.click()}>＋ Add photos</button>
        </div>
      </section>
      {photos.length ? <section className="review-photo-section"><div><b>{photos.length} imported photos</b><small>เลือก Cover · ลบ · เรียงรูปได้</small></div><PhotoGrid photos={photos} coverId={coverId} onCover={setCoverId} onMove={movePhoto} onDelete={removePhoto} /></section> : null}
      {summary ? <div className="ai-summary"><span>✦</span><p>{summary}</p></div> : null}
      {problemFields.length || conflicts.length ? <section className="review-issues"><div><span>!</span><div><h3>Conflict / Need Review</h3><p>ตรวจเฉพาะช่องเหล่านี้ก่อนบันทึก</p></div></div>{conflicts.map((conflict) => <p key={conflict}>• {conflict}</p>)}</section> : null}
      <section className="extracted-review-card">
        <div className="extracted-review-head"><div><p className="eyebrow">AI extracted specifications</p><h2>{values.year} {values.brand} {values.model}</h2></div><button className="button secondary" disabled={analyzing} onClick={() => analyzeVehicle(photos, values.listingText, sourceUrl)}>{analyzing ? "Analyzing…" : "Re-analyze"}</button></div>
        {visibleFields.length ? <div className="review-field-grid">{visibleFields.map((field) => <ReviewField
          key={field.key} field={field} value={values[field.key]} meta={aiMeta[field.key]}
          editing={editingFields.has(field.key)} manual={manualFields.has(field.key)}
          onEdit={() => setEditingFields((current) => new Set(current).add(field.key))}
          onChange={(value) => changeField(field.key, value)}
        />)}</div> : <div className="no-extracted-fields"><b>AI ยังยืนยัน Specs ไม่ได้</b><p>เพิ่ม Screenshot ประกาศ ป้าย VIN หรือรูปหน้าปัด แล้วกด Re-analyze</p></div>}
        {values.listingText ? <details className="listing-description"><summary>Listing description</summary><textarea rows={7} value={values.listingText} onChange={(event) => changeField("listingText", event.target.value)} /></details> : null}
        <label className="customer-description-editor">
          <span>Customer English Description</span>
          <small>Public-safe English only. Seller, source, URL, contact, source price and sourcing location are excluded.</small>
          <textarea rows={6} value={values.customerDescriptionEn} onChange={(event) => changeField("customerDescriptionEn", event.target.value)} />
        </label>
      </section>
      {message ? <div className="inline-message" role="alert">{message}</div> : null}
      <div className="save-draft-bar"><button className="button secondary" onClick={onCancel}>Cancel</button><div><b>Vehicle Draft</b><small>สถานะหลังบันทึก: Waiting Review</small></div><button className="button primary" onClick={saveDraft}>Save Vehicle Draft →</button></div>
    </> : null}
  </div>;
}
