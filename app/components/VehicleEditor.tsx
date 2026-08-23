"use client";

import { useRef, useState } from "react";
import type { AiFieldMeta, Vehicle, VehicleCorrection } from "../types";

type FieldKey =
  | "brand" | "model" | "year" | "grade" | "engine" | "engineCapacity"
  | "transmission" | "drive" | "body" | "cabType" | "mileage" | "color"
  | "vinChassis" | "registrationYear" | "sourcePrice" | "seller"
  | "sourcePlatform" | "listingText" | "location";

type FormValues = Record<FieldKey, string>;
type PhotoItem = { id: string; name: string; dataUrl: string };
type ExtractionResponse = {
  fields: Record<FieldKey, { value: string } & AiFieldMeta>;
  conflicts: string[];
  summary: string;
  image_count: number;
};

const MAX_PHOTOS = 30;
const emptyValues: FormValues = {
  brand: "", model: "", year: "", grade: "", engine: "", engineCapacity: "",
  transmission: "", drive: "", body: "", cabType: "", mileage: "", color: "",
  vinChassis: "", registrationYear: "", sourcePrice: "", seller: "",
  sourcePlatform: "", listingText: "", location: "",
};
const fieldGroups: { title: string; fields: { key: FieldKey; label: string; type?: string; wide?: boolean }[] }[] = [
  { title: "ข้อมูลรถ / Vehicle specs", fields: [
    { key: "brand", label: "Brand / ยี่ห้อ" }, { key: "model", label: "Model / รุ่น" },
    { key: "year", label: "Model Year / ปีรถ" }, { key: "grade", label: "Grade / เกรด" },
    { key: "engine", label: "Engine / เครื่องยนต์" }, { key: "engineCapacity", label: "Engine capacity / ความจุเครื่อง" },
    { key: "transmission", label: "Transmission / เกียร์" }, { key: "drive", label: "Drive / ระบบขับเคลื่อน" },
    { key: "body", label: "Body type / ตัวถัง" }, { key: "cabType", label: "Cab type / ประเภทแค็บ" },
    { key: "mileage", label: "Mileage / เลขไมล์" }, { key: "color", label: "Color / สี" },
    { key: "vinChassis", label: "VIN / Chassis" }, { key: "registrationYear", label: "Registration year / ปีจดทะเบียน" },
  ] },
  { title: "ข้อมูลต้นทาง / Source", fields: [
    { key: "sourcePrice", label: "Source price / ราคาต้นทาง", type: "number" },
    { key: "seller", label: "Seller / ผู้ขาย" },
    { key: "sourcePlatform", label: "Source platform / แพลตฟอร์ม" },
    { key: "location", label: "Location / พื้นที่" },
  ] },
];

const noPhoto = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='#e8edf2'/><text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' font-family='Arial' font-size='52' fill='#667383'>NO PHOTO</text></svg>");

function initialFromVehicle(vehicle?: Vehicle): FormValues {
  if (!vehicle) return { ...emptyValues };
  return {
    brand: vehicle.brand || "", model: vehicle.model || "", year: vehicle.year || "",
    grade: vehicle.grade || "", engine: vehicle.engine || "", engineCapacity: vehicle.engineCapacity || "",
    transmission: vehicle.transmission || "", drive: vehicle.drive || "", body: vehicle.body || "",
    cabType: vehicle.cabType || "", mileage: vehicle.mileage || "", color: vehicle.color || "",
    vinChassis: vehicle.vinChassis || "", registrationYear: vehicle.registrationYear || "",
    sourcePrice: vehicle.sourcePrice ? String(vehicle.sourcePrice) : "", seller: vehicle.seller || vehicle.sources?.[0]?.seller || "",
    sourcePlatform: vehicle.sourcePlatform || vehicle.sourceImport?.source_platform || "",
    listingText: vehicle.listingText || vehicle.sourceImport?.source_listing_text || "", location: vehicle.location || "",
  };
}

function photosFromVehicle(vehicle?: Vehicle): PhotoItem[] {
  const images = vehicle?.images?.length ? vehicle.images : vehicle?.image && !vehicle.image.startsWith("https://images.unsplash.com") ? [vehicle.image] : [];
  return images.map((dataUrl, index) => ({ id: `${vehicle?.id || "draft"}-${index}`, name: `saved-photo-${index + 1}.jpg`, dataUrl }));
}

function maskVin(value: string) {
  const clean = value.replace(/\s/g, "");
  if (clean.length < 7) return "Need Review";
  return `${clean.slice(0, 3)}••••••${clean.slice(-4)}`;
}

async function compressPhoto(file: File): Promise<PhotoItem> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error(`อ่านไฟล์ ${file.name} ไม่สำเร็จ`));
      element.src = objectUrl;
    });
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("อุปกรณ์นี้ไม่รองรับการเตรียมรูป");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { id: `${Date.now()}-${crypto.randomUUID()}`, name: file.name, dataUrl: canvas.toDataURL("image/jpeg", .82) };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function VehicleEditor({
  initialVehicle,
  onSave,
  onCancel,
  notify,
}: {
  initialVehicle?: Vehicle;
  onSave: (vehicle: Vehicle) => void;
  onCancel: () => void;
  notify: (message: string) => void;
}) {
  const [values, setValues] = useState<FormValues>(() => initialFromVehicle(initialVehicle));
  const [sourceUrl, setSourceUrl] = useState(initialVehicle?.sourceImport?.source_url || initialVehicle?.sources?.[0]?.url || "");
  const [photos, setPhotos] = useState<PhotoItem[]>(() => photosFromVehicle(initialVehicle));
  const [coverId, setCoverId] = useState(() => photosFromVehicle(initialVehicle)[0]?.id || "");
  const [aiMeta, setAiMeta] = useState<Partial<Record<FieldKey, AiFieldMeta>>>(initialVehicle?.aiMeta || {});
  const [aiOriginal, setAiOriginal] = useState<Partial<Record<FieldKey, string>>>({});
  const [manualFields, setManualFields] = useState<Set<FieldKey>>(new Set());
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [summary, setSummary] = useState(initialVehicle?.aiSummary || "");
  const [preparing, setPreparing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return notify(`ครบ ${MAX_PHOTOS} รูปแล้ว`);
    const selected = Array.from(files).slice(0, remaining);
    setPreparing(true);
    setError("");
    try {
      const prepared: PhotoItem[] = [];
      for (const file of selected) prepared.push(await compressPhoto(file));
      setPhotos((current) => [...current, ...prepared]);
      setCoverId((current) => current || prepared[0]?.id || "");
      if (files.length > remaining) notify(`เพิ่มได้ ${remaining} รูป — จำกัดรถละ ${MAX_PHOTOS} รูปใน V1`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "เตรียมรูปไม่สำเร็จ");
    } finally {
      setPreparing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= photos.length) return;
    setPhotos((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
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

  async function analyze() {
    if (!photos.length && !values.listingText.trim() && !sourceUrl.trim()) {
      return setError("เลือกรูป หรือใส่ข้อความ/ลิงก์ต้นทางอย่างน้อย 1 อย่างก่อนวิเคราะห์");
    }
    setAnalyzing(true);
    setError("");
    try {
      const response = await fetch("/api/vehicle-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: photos.map((photo) => photo.dataUrl), listingText: values.listingText, sourceUrl }),
      });
      const payload = await response.json() as ExtractionResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "NK AI วิเคราะห์ไม่สำเร็จ");
      const nextValues = { ...values };
      const nextMeta = { ...aiMeta };
      const nextOriginal = { ...aiOriginal };
      (Object.keys(emptyValues) as FieldKey[]).forEach((key) => {
        const field = payload.fields?.[key];
        if (!field) return;
        nextMeta[key] = { confidence: field.confidence, status: field.status, evidence: field.evidence, alternatives: field.alternatives };
        const canFill = !manualFields.has(key) && !nextValues[key].trim() && field.value && field.value !== "Unknown";
        if (canFill) {
          nextValues[key] = field.value;
          nextOriginal[key] = field.value;
        }
      });
      setValues(nextValues);
      setAiMeta(nextMeta);
      setAiOriginal(nextOriginal);
      setConflicts(payload.conflicts || []);
      setSummary(payload.summary || "");
      notify(`NK AI วิเคราะห์ ${payload.image_count || photos.length} รูปร่วมกันแล้ว`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "NK AI วิเคราะห์ไม่สำเร็จ");
    } finally {
      setAnalyzing(false);
    }
  }

  function clearAll() {
    setValues({ ...emptyValues });
    setSourceUrl("");
    setPhotos([]);
    setCoverId("");
    setAiMeta({});
    setAiOriginal({});
    setManualFields(new Set());
    setConflicts([]);
    setSummary("");
    setError("");
  }

  function saveDraft() {
    if (!photos.length && !values.brand.trim() && !values.model.trim() && !values.listingText.trim()) {
      return setError("ยังไม่มีข้อมูลสำหรับบันทึก Draft");
    }
    const now = new Date().toISOString();
    const id = initialVehicle?.id || `v${Date.now()}`;
    const cover = photos.find((photo) => photo.id === coverId)?.dataUrl || photos[0]?.dataUrl || initialVehicle?.image || noPhoto;
    const corrections: VehicleCorrection[] = Object.entries(aiOriginal)
      .filter(([key, value]) => value && values[key as FieldKey] !== value)
      .map(([key, value]) => ({ field: key, aiValue: value || "", correctedValue: values[key as FieldKey], correctedAt: now }));
    const sourcePrice = Number(values.sourcePrice.replace(/[^0-9.]/g, "")) || 0;
    const sourceName = values.sourcePlatform || "Manual / photo import";
    const base: Vehicle = initialVehicle || {
      id,
      stockNo: `NK-${String(Date.now()).slice(-5)}`,
      brand: "", model: "", year: "", grade: "", engine: "", transmission: "", drive: "", body: "",
      mileage: "", color: "", sourcePrice: 0, sellingPrice: 0, state: "Waiting Review",
      availabilityVerified: false, image: noPhoto, plateMasked: "Need Review", vinMasked: "Need Review",
      sources: [], confidence: {}, timeline: [],
    };
    const vehicle: Vehicle = {
      ...base,
      brand: values.brand || "Need Review", model: values.model || "Need Review", year: values.year || "Need Review",
      grade: values.grade || "Need Review", engine: values.engine || "Need Review", engineCapacity: values.engineCapacity || "Need Review",
      transmission: values.transmission || "Need Review", drive: values.drive || "Need Review", body: values.body || "Need Review",
      cabType: values.cabType || "Need Review", mileage: values.mileage || "Need Review", color: values.color || "Need Review",
      vinChassis: values.vinChassis || "", registrationYear: values.registrationYear || "Need Review",
      sourcePrice, seller: values.seller || "Need Review", sourcePlatform: values.sourcePlatform || "Need Review",
      listingText: values.listingText, location: values.location || "Need Review", state: "Waiting Review",
      image: cover, coverImage: cover, images: photos.map((photo) => photo.dataUrl),
      vinMasked: values.vinChassis ? maskVin(values.vinChassis) : "Need Review",
      sources: [{
        id: initialVehicle?.sources?.[0]?.id || `s-${Date.now()}`,
        name: sourceName, seller: values.seller || "Need Review", price: sourcePrice,
        url: sourceUrl || "Not provided", lastVerified: "Not verified", status: "Needs verification",
      }, ...(initialVehicle?.sources?.slice(1) || [])],
      confidence: Object.fromEntries(Object.entries(aiMeta).map(([key, value]) => [key, value?.confidence || 0])),
      aiMeta: aiMeta as Record<string, AiFieldMeta>, corrections: [...(initialVehicle?.corrections || []), ...corrections], aiSummary: summary,
      sourceImport: {
        source_url: sourceUrl,
        source_platform: values.sourcePlatform,
        source_images: photos.map((photo) => photo.name),
        imported_at: now,
        source_listing_text: values.listingText,
        source_seller: values.seller,
        source_price: sourcePrice,
      },
      timeline: [
        ...(initialVehicle?.timeline || []),
        { id: `${id}-${Date.now()}-save`, time: "Just now", label: initialVehicle ? "Draft updated" : "Vehicle imported", detail: `${photos.length} photos · AI-first mobile intake.` },
        ...(summary ? [{ id: `${id}-${Date.now()}-ai`, time: "Just now", label: "AI parsed", detail: conflicts.length ? `${conflicts.length} conflict(s) require review.` : "Multi-image extraction completed; uncertain values kept for review." }] : []),
        ...(corrections.length ? [{ id: `${id}-${Date.now()}-feedback`, time: "Just now", label: "User corrections saved", detail: `${corrections.length} correction(s) stored as AI feedback.` }] : []),
      ],
    };
    onSave(vehicle);
  }

  const canAnalyze = photos.length > 0 || Boolean(values.listingText.trim()) || Boolean(sourceUrl.trim());
  const analyzedCount = Object.keys(aiMeta).length;

  return <div className="vehicle-editor">
    <div className="editor-head">
      <div>
        <p className="eyebrow">AI-first vehicle intake</p>
        <h1>{initialVehicle ? `Edit ${initialVehicle.stockNo}` : "Add Vehicle"}</h1>
        <p>เลือกรูปหลายรูป → AI อ่านทั้งชุด → ตรวจข้อมูล → Save Draft</p>
      </div>
      <button className="button secondary" onClick={clearAll}>Clear All</button>
    </div>

    <div className="flow-strip" aria-label="Add vehicle workflow">
      <span className={photos.length ? "done" : "active"}><b>1</b>Select Photos</span>
      <span className={analyzing ? "active" : analyzedCount ? "done" : ""}><b>2</b>AI Extract</span>
      <span className={analyzedCount ? "active" : ""}><b>3</b>Review</span>
      <span><b>4</b>Save Draft</span>
    </div>

    <section className="intake-card photo-intake">
      <div className="intake-title">
        <div><span className="step-number">1</span><div><h2>เลือกรูปรถและภาพหน้าจอ</h2><p>เลือกพร้อมกันได้สูงสุด {MAX_PHOTOS} รูปจาก iPhone / Android</p></div></div>
        <strong>{photos.length}/{MAX_PHOTOS}</strong>
      </div>
      <label className={`multi-upload ${preparing ? "busy" : ""}`}>
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={(event) => addPhotos(event.target.files)} disabled={preparing || photos.length >= MAX_PHOTOS} />
        <span>＋</span><b>{preparing ? "กำลังเตรียมรูป…" : photos.length ? "เพิ่มรูปอีกชุด" : "เลือกหลายรูปพร้อมกัน"}</b>
        <small>รูปตัวรถ · หน้าปัด · VIN · ห้องเครื่อง · Screenshot Marketplace</small>
      </label>
      {photos.length > 0 && <>
        <p className="photo-help">แตะ ★ เพื่อเลือก Cover · ใช้ลูกศรเพื่อเรียงรูป · AI จะวิเคราะห์ทุกรูปพร้อมกัน</p>
        <div className="photo-grid">
          {photos.map((photo, index) => <article className={coverId === photo.id ? "cover" : ""} key={photo.id}>
            <img src={photo.dataUrl} alt={`Upload ${index + 1}`} />
            <span className="photo-index">{index + 1}</span>
            {coverId === photo.id && <span className="cover-badge">COVER</span>}
            <div className="photo-actions">
              <button type="button" onClick={() => setCoverId(photo.id)} aria-label={`Set photo ${index + 1} as cover`}>★</button>
              <button type="button" onClick={() => movePhoto(index, -1)} disabled={index === 0} aria-label="Move photo left">←</button>
              <button type="button" onClick={() => movePhoto(index, 1)} disabled={index === photos.length - 1} aria-label="Move photo right">→</button>
              <button type="button" className="delete" onClick={() => removePhoto(photo.id)} aria-label={`Delete photo ${index + 1}`}>×</button>
            </div>
          </article>)}
        </div>
      </>}
    </section>

    <section className="intake-card source-intake">
      <div className="intake-title"><div><span className="step-number">2</span><div><h2>Import from Marketplace</h2><p>ใส่ลิงก์หรือข้อความได้ถ้ามี — AI จะรวมกับรูปทั้งหมดก่อนสรุป</p></div></div></div>
      <label><span>Facebook Marketplace URL / Source URL</span><input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} /></label>
      <label><span>Listing text / ข้อความประกาศ</span><textarea rows={4} value={values.listingText} onChange={(event) => changeField("listingText", event.target.value)} /></label>
      <div className="fetch-placeholder">
        <div><b>Fetch listing images</b><small>เตรียมพร้อมเชื่อม Facebook / Meta API ในอนาคต</small></div>
        <button type="button" disabled>INTEGRATION READY</button>
      </div>
    </section>

    <section className="analyze-dock">
      <div><b>NK AI จะอ่าน {photos.length} รูปเป็นรถคันเดียว</b><small>ไม่แยกวิเคราะห์ทีละรูป และไม่เดาข้อมูลที่ไม่มีหลักฐาน</small></div>
      <button className="button ai" disabled={!canAnalyze || analyzing || preparing} onClick={analyze}>{analyzing ? <><i className="spinner" />กำลังอ่านรูปทั้งหมด…</> : "✦ Analyze with NK AI"}</button>
    </section>

    {error && <div className="editor-error" role="alert">⚠ {error}</div>}
    {conflicts.length > 0 && <div className="conflict-box"><b>Conflict / Need Review</b>{conflicts.map((item) => <p key={item}>• {item}</p>)}</div>}

    <section className="intake-card review-extraction">
      <div className="intake-title"><div><span className="step-number">3</span><div><h2>ตรวจข้อมูลที่ AI อ่านได้</h2><p>ช่องสีฟ้า = AI เติม · ช่องที่แก้เองจะถูกล็อกไม่ให้ AI ทับ</p></div></div>{analyzedCount > 0 && <span className="analysis-ready">AI READY</span>}</div>
      {summary && <div className="ai-summary"><span>✦</span><p>{summary}</p></div>}
      {fieldGroups.map((group) => <div className="field-group" key={group.title}>
        <h3>{group.title}</h3>
        <div className="editor-form-grid">
          {group.fields.map((field) => {
            const meta = aiMeta[field.key];
            const manual = manualFields.has(field.key);
            return <label className={`${meta && !manual ? "ai-filled" : ""} ${manual ? "manual-protected" : ""}`} key={field.key}>
              <span>{field.label}</span>
              <input type={field.type || "text"} value={values[field.key]} onChange={(event) => changeField(field.key, event.target.value)} />
              <small className="field-meta">
                {manual ? <em>🔒 Manual — AI will not overwrite</em> : meta ? <><em className={`status-${meta.status.replace(" ", "-").toLowerCase()}`}>{meta.status}</em><b>{meta.confidence}%</b></> : <em>ยังไม่ได้วิเคราะห์</em>}
              </small>
              {meta?.evidence?.[0] && <small className="evidence">Evidence: {meta.evidence[0]}</small>}
              {meta?.alternatives?.length ? <small className="alternatives">Possible: {meta.alternatives.join(" / ")}</small> : null}
            </label>;
          })}
        </div>
      </div>)}
      <div className="field-group">
        <h3>ข้อความประกาศที่รวมจากรูปและข้อความ</h3>
        <label className={`${aiMeta.listingText && !manualFields.has("listingText") ? "ai-filled" : ""} ${manualFields.has("listingText") ? "manual-protected" : ""}`}>
          <textarea rows={6} value={values.listingText} onChange={(event) => changeField("listingText", event.target.value)} />
          <small className="field-meta">{manualFields.has("listingText") ? <em>🔒 Manual — AI will not overwrite</em> : aiMeta.listingText ? <><em>{aiMeta.listingText.status}</em><b>{aiMeta.listingText.confidence}%</b></> : <em>ยังไม่ได้วิเคราะห์</em>}</small>
        </label>
      </div>
    </section>

    <div className="save-draft-bar">
      <button className="button secondary" onClick={onCancel}>Cancel</button>
      <div><b>{initialVehicle ? "Update vehicle draft" : "Create Vehicle Draft"}</b><small>สถานะหลังบันทึก: Waiting Review</small></div>
      <button className="button primary" onClick={saveDraft}>Save Draft →</button>
    </div>
  </div>;
}
