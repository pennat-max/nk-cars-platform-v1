import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RecordRow = {
  vehicleId: string;
  publicationStatus: string;
  customerRecord: unknown;
  internalRecord?: Record<string, unknown>;
  media?: Array<{ mediaId: string }>;
};

function privateHost(host: string) {
  const name = host.split(":")[0].replace(/^\[|\]$/g, "");
  return name === "localhost" || name === "127.0.0.1" || /^192\.168\./.test(name) || /^10\./.test(name)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(name) || /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(name);
}

async function records(): Promise<RecordRow[]> {
  const base = String(process.env.NK_QNAP_DATA_API_URL || "").replace(/\/$/, "");
  const token = String(process.env.NK_INTERNAL_API_TOKEN || "");
  if (!base || token.length < 20) throw new Error("ระบบข้อมูลยังไม่พร้อม");
  const response = await fetch(`${base}/v1/admin/jaklaen/candidates`, {
    headers: {
      authorization: `Bearer ${token}`,
      "x-nk-actor-id": "tony-private-preview",
      "x-nk-actor-email": "pennat@gmail.com",
      "x-nk-actor-roles": "OWNER",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("อ่านรายการรถไม่สำเร็จ");
  const payload = await response.json();
  return Array.isArray(payload?.records) ? payload.records : [];
}

function value(record: Record<string, unknown> | undefined, key: string, fallback = "รอตรวจ") {
  const raw = record?.[key];
  return typeof raw === "string" || typeof raw === "number" ? String(raw) : fallback;
}

export default async function LiveCandidatesPage() {
  const host = (await headers()).get("host") || "";
  if (!privateHost(host)) notFound();
  const all = await records();
  const cars = all.filter((item) => item.publicationStatus === "NEEDS_REVIEW" && item.customerRecord == null).slice(0, 30);
  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px 60px", fontFamily: "Arial, sans-serif", color: "#111827" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: "#b45309", fontWeight: 700, marginBottom: 8 }}>NK AUTO TRADE • สำหรับพี่คอม</p>
        <h1 style={{ fontSize: 34, margin: 0 }}>รถที่จั๊กกะแลตหาเข้ามา</h1>
        <p style={{ color: "#4b5563" }}>พบรถรอตรวจ {cars.length} คัน • ยังไม่ลงขายและยังไม่ติดต่อผู้ขาย</p>
      </header>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
        {cars.map((car) => {
          const detail = car.internalRecord;
          const media = car.media?.[0];
          return (
            <article key={car.vehicleId} style={{ border: "1px solid #e5e7eb", borderRadius: 18, overflow: "hidden", background: "white", boxShadow: "0 8px 24px rgba(15,23,42,.08)" }}>
              <div style={{ height: 210, background: "#e5e7eb" }}>
                {media ? <img src={`/api/buying-browser/owner-preview/media/${encodeURIComponent(car.vehicleId)}/${encodeURIComponent(media.mediaId)}`} alt="หลักฐานรถ" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
              </div>
              <div style={{ padding: 16 }}>
                <span style={{ display: "inline-block", color: "#92400e", background: "#fef3c7", padding: "5px 9px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>รอพี่คอมตรวจ</span>
                <h2 style={{ fontSize: 20, margin: "12px 0 8px" }}>{value(detail, "year")} {value(detail, "brand")} {value(detail, "model")}</h2>
                <strong style={{ fontSize: 24 }}>{Number(value(detail, "observedPriceThb", "0")).toLocaleString("th-TH")} บาท</strong>
                <p style={{ color: "#4b5563", marginBottom: 0 }}>พื้นที่: {value(detail, "generalLocation")}</p>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
