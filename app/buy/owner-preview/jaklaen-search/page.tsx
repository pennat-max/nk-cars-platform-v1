import { readFile } from "node:fs/promises";
import path from "node:path";
import { Search, ShieldCheck } from "lucide-react";
import styles from "../../../buying-browser/JaklaenOwnerSearchLivePreview.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Candidate = {
  id: string;
  title: string;
  year: number | string;
  transmission: string;
  drive: string;
  mileageKm: number | null;
  priceThb: number | null;
  imageUrl: string | null;
  location: string;
  sourceUrl: string;
  foundAt: string;
};

type RawCandidate = Record<string, unknown> & {
  images?: unknown;
  source?: Record<string, unknown>;
};

function cleanText(value: unknown, fallback = "PENDING") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function safeCandidate(candidate: RawCandidate): Candidate {
  const titleParts = [candidate.year, candidate.brand, candidate.model].filter(Boolean);
  return {
    id: cleanText(candidate.candidate_id, `candidate-${Date.now()}`),
    title: titleParts.length ? titleParts.join(" ") : "Toyota Hilux Revo",
    year: candidate.year || "UNKNOWN",
    transmission: cleanText(candidate.transmission, "UNKNOWN"),
    drive: cleanText(candidate.drive_type, "UNKNOWN"),
    mileageKm: typeof candidate.mileage_km === "number" ? candidate.mileage_km : null,
    priceThb: typeof candidate.source_price_thb === "number" ? candidate.source_price_thb : null,
    imageUrl: Array.isArray(candidate.images) ? candidate.images.find((image: string) => /^https?:\/\//.test(image)) || null : null,
    location: cleanText(candidate.source?.location, "PENDING"),
    sourceUrl: cleanText(candidate.source?.source_url, ""),
    foundAt: cleanText(candidate.source?.observed_at, new Date().toISOString()),
  };
}

async function readLatestLiveResults(): Promise<{ searchedAt: string; listingsFound: number; candidates: Candidate[] }> {
  const raw = await readFile(path.join(process.cwd(), "jaklaen-live-search-result.json"), "utf8");
  const parsed = JSON.parse(raw);
  const result = parsed.result || parsed;
  return {
    searchedAt: parsed.searchedAt || result.searched_at || new Date().toISOString(),
    listingsFound: result.listings_found || 0,
    candidates: Array.isArray(result.candidates) ? result.candidates.slice(0, 3).map(safeCandidate) : [],
  };
}

function formatThb(value: number | null) {
  if (value === null) return "PENDING";
  return `THB ${value.toLocaleString("en-US")}`;
}

function formatMileage(value: number | null) {
  if (value === null) return "PENDING";
  return `${value.toLocaleString("en-US")} km`;
}

function formatFoundAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

export default async function JaklaenSearchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const shouldRun = params.run === "1";
  const query = typeof params.query === "string" ? params.query : "Toyota Hilux Revo";
  const results = shouldRun ? await readLatestLiveResults() : null;

  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Owner Preview</p>
          <h1>Jaklaen Live Search</h1>
          <p className={styles.summary}>ค้นหารถจริงจาก Facebook Marketplace แล้วแสดงผลใต้ปุ่มค้นหาเพื่อส่งต่อเข้า Candidate Review</p>
        </div>
        <div className={styles.readyBadge}>
          <ShieldCheck size={18} />
          Preview only
        </div>
      </section>

      <form className={styles.searchBox} action="/buy/owner-preview/jaklaen-search" method="get">
        <input type="hidden" name="run" value="1" />
        <label htmlFor="jaklaen-query">คำค้นหา</label>
        <div className={styles.searchRow}>
          <input id="jaklaen-query" name="query" defaultValue={query} />
          <button type="submit">
            <Search size={20} />
            สั่งจั๊กแล่นค้นหา
          </button>
        </div>
        <p className={styles.statusLine}>
          {results ? `พบผลค้นหาจริง ${results.listingsFound} รายการ แสดงตัวอย่าง ${results.candidates.length} คัน` : "พร้อมค้นหา Toyota Hilux Revo จาก Facebook Marketplace"}
        </p>
      </form>

      {results && results.candidates.length > 0 ? (
        <section className={styles.results} aria-label="Jaklaen live search results">
          <div className={styles.resultsHeader}>
            <div>
              <p className={styles.eyebrow}>Facebook Marketplace</p>
              <h2>รถที่จั๊กแล่นพบ</h2>
            </div>
            <strong>{results.candidates.length} คัน</strong>
          </div>
          <div className={styles.grid}>
            {results.candidates.map((candidate) => (
              <article className={styles.card} key={candidate.id}>
                <div className={styles.imageWrap}>
                  {candidate.imageUrl ? <img src={candidate.imageUrl} alt={candidate.title} /> : <div className={styles.noImage}>ไม่มีรูป</div>}
                  <span>NEEDS REVIEW</span>
                </div>
                <div className={styles.cardBody}>
                  <strong className={styles.price}>{formatThb(candidate.priceThb)}</strong>
                  <h3>{candidate.title}</h3>
                  <dl>
                    <div>
                      <dt>เกียร์</dt>
                      <dd>{candidate.transmission}</dd>
                    </div>
                    <div>
                      <dt>ขับเคลื่อน</dt>
                      <dd>{candidate.drive}</dd>
                    </div>
                    <div>
                      <dt>ไมล์</dt>
                      <dd>{formatMileage(candidate.mileageKm)}</dd>
                    </div>
                    <div>
                      <dt>พื้นที่</dt>
                      <dd>{candidate.location}</dd>
                    </div>
                  </dl>
                  <p className={styles.foundAt}>พบเมื่อ {formatFoundAt(candidate.foundAt || results.searchedAt)}</p>
                  {candidate.sourceUrl ? (
                    <a className={styles.sourceLink} href={candidate.sourceUrl} target="_blank" rel="noreferrer">
                      เปิดประกาศต้นทาง
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
