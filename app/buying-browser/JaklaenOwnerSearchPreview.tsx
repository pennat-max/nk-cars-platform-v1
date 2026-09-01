"use client";

import { ArrowLeft, CheckCircle2, Clock3, ExternalLink, Search, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import styles from "./JaklaenOwnerSearchPreview.module.css";

type SearchState = "idle" | "queued" | "searching" | "results";
type CandidateDecision = "pending" | "approved" | "rejected" | "more_info";

type Candidate = {
  id: string;
  image: string;
  title: string;
  year: number;
  price: number;
  mileage: number;
  location: string;
  transmission: string;
  drive: string;
  foundAt: string;
};

const demoCandidates: Candidate[] = [
  {
    id: "DEMO-CAND-001",
    image: "/vehicle-marketplace/owner-reviewed-2026-08-26/nk-mkt-01/fd2aade7890beda0.jpg",
    title: "Toyota Hilux Revo Double Cab",
    year: 2022,
    price: 765000,
    mileage: 65000,
    location: "กรุงเทพมหานคร",
    transmission: "AT",
    drive: "2WD",
    foundAt: "ตัวอย่างผลลัพธ์",
  },
  {
    id: "DEMO-CAND-002",
    image: "/vehicle-marketplace/owner-reviewed-2026-08-26/nk-mkt-01/e4d0761afd1e9d81.jpg",
    title: "Toyota Hilux Revo Prerunner",
    year: 2021,
    price: 719000,
    mileage: 78000,
    location: "นนทบุรี",
    transmission: "AT",
    drive: "2WD",
    foundAt: "ตัวอย่างผลลัพธ์",
  },
  {
    id: "DEMO-CAND-003",
    image: "/vehicle-marketplace/owner-reviewed-2026-08-26/nk-mkt-01/c500ea62da4f8865.jpg",
    title: "Toyota Hilux Revo 4x4",
    year: 2023,
    price: 839000,
    mileage: 42000,
    location: "ปทุมธานี",
    transmission: "AT",
    drive: "4WD",
    foundAt: "ตัวอย่างผลลัพธ์",
  },
];

function money(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}

export default function JaklaenOwnerSearchPreview() {
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [decisions, setDecisions] = useState<Record<string, CandidateDecision>>({});

  useEffect(() => {
    if (searchState !== "queued") return;
    const searchingTimer = window.setTimeout(() => setSearchState("searching"), 700);
    const resultTimer = window.setTimeout(() => setSearchState("results"), 1800);
    return () => {
      window.clearTimeout(searchingTimer);
      window.clearTimeout(resultTimer);
    };
  }, [searchState]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDecisions({});
    setSearchState("queued");
  }

  const visibleCandidates = demoCandidates.filter((candidate) => decisions[candidate.id] !== "rejected");

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link href="/buy/owner-preview/jaklaen-candidates"><ArrowLeft size={19} /> กลับ</Link>
        <div className={styles.brand}><span>NK</span><div><b>ค้นหารถกับจั๊กแล่น</b><small>Owner Preview</small></div></div>
        <span className={styles.previewBadge}>PREVIEW</span>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p>VEHICLE SOURCING</p>
            <h1>อยากได้รถแบบไหน สั่งค้นหาตรงนี้ได้เลย</h1>
            <span>กรอกเงื่อนไขครั้งเดียว แล้วรถที่จั๊กแล่นพบจะทยอยแสดงด้านล่าง</span>
          </div>
          <div className={styles.connection}><Clock3 size={17} /><div><b>กำลังรอเชื่อม Cloud Worker</b><small>หน้านี้ยังเป็นตัวอย่างหน้าจอ ไม่ได้ค้น Facebook จริง</small></div></div>
        </section>

        <form className={styles.searchCard} onSubmit={submitSearch}>
          <div className={styles.formHeading}><Search size={21} /><div><h2>เงื่อนไขค้นหา</h2><p>แก้เฉพาะช่องที่ต้องการ ช่องไหนไม่จำกัดปล่อยไว้ได้</p></div></div>
          <div className={styles.formGrid}>
            <label><span>ยี่ห้อ</span><input name="make" defaultValue="Toyota" /></label>
            <label><span>รุ่น</span><input name="model" defaultValue="Hilux Revo" /></label>
            <label><span>ปีต่ำสุด</span><input name="yearFrom" inputMode="numeric" defaultValue="2020" /></label>
            <label><span>ปีสูงสุด</span><input name="yearTo" inputMode="numeric" defaultValue="2024" /></label>
            <label><span>ราคาไม่เกิน (บาท)</span><input name="maxPrice" inputMode="numeric" defaultValue="850000" /></label>
            <label><span>เลขไมล์ไม่เกิน</span><input name="maxMileage" inputMode="numeric" defaultValue="120000" /></label>
            <label><span>เกียร์</span><select name="transmission" defaultValue="AT"><option value="ANY">ไม่จำกัด</option><option value="AT">AT</option><option value="MT">MT</option></select></label>
            <label><span>ระบบขับเคลื่อน</span><select name="drive" defaultValue="ANY"><option value="ANY">ไม่จำกัด</option><option value="2WD">2WD</option><option value="4WD">4WD</option></select></label>
            <label className={styles.wide}><span>พื้นที่ค้นหา</span><input name="location" defaultValue="กรุงเทพฯ และปริมณฑล" /></label>
            <label><span>จำนวนที่ต้องการ</span><select name="quantity" defaultValue="5"><option>3</option><option>5</option><option>10</option></select></label>
          </div>
          <button className={styles.searchButton} type="submit" disabled={searchState === "queued" || searchState === "searching"}>
            <Search size={19} />
            {searchState === "queued" ? "กำลังส่งงาน..." : searchState === "searching" ? "จั๊กแล่นกำลังค้นหา..." : "ทดลองสั่งจั๊กแล่นค้นหา"}
          </button>
          <p className={styles.safeNote}><ShieldCheck size={16} /> ทดลองได้เฉพาะหน้าจอ ยังไม่ติดต่อผู้ขาย ไม่ซื้อ ไม่จอง และไม่เผยแพร่รถ</p>
        </form>

        <section className={styles.results} aria-live="polite">
          <div className={styles.resultsHeading}>
            <div><p>ผลการค้นหา</p><h2>{searchState === "results" ? `พบ ${visibleCandidates.length} คัน` : "ยังไม่มีผลลัพธ์"}</h2></div>
            {searchState === "results" && <span>ข้อมูลตัวอย่าง MOCK</span>}
          </div>

          {searchState === "idle" && <div className={styles.empty}><Search size={30} /><b>กรอกเงื่อนไขแล้วกดค้นหา</b><span>ผลลัพธ์จะขึ้นตรงนี้ ไม่ต้องเปิด GitHub</span></div>}
          {(searchState === "queued" || searchState === "searching") && <div className={styles.loading}><i /><b>{searchState === "queued" ? "ส่งคำสั่งเข้าคิวแล้ว" : "จั๊กแล่นกำลังอ่านประกาศรถ"}</b><span>เมื่อเชื่อม Worker จริง รถแต่ละคันจะทยอยขึ้นโดยไม่ต้องรีเฟรช</span></div>}

          {searchState === "results" && (
            <div className={styles.cardGrid}>
              {visibleCandidates.map((candidate) => {
                const decision = decisions[candidate.id] || "pending";
                return (
                  <article className={styles.vehicleCard} key={candidate.id}>
                    <div className={styles.imageWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- existing private preview assets */}
                      <img src={candidate.image} alt="รถตัวอย่างสำหรับหน้า Preview" />
                      <span>MOCK</span>
                    </div>
                    <div className={styles.vehicleBody}>
                      <div className={styles.titleRow}><div><small>{candidate.id}</small><h3>{candidate.year} {candidate.title}</h3></div><b>฿{money(candidate.price)}</b></div>
                      <dl>
                        <div><dt>เลขไมล์</dt><dd>{money(candidate.mileage)} กม.</dd></div>
                        <div><dt>เกียร์ / ขับเคลื่อน</dt><dd>{candidate.transmission} / {candidate.drive}</dd></div>
                        <div><dt>พื้นที่</dt><dd>{candidate.location}</dd></div>
                        <div><dt>เวลาที่พบ</dt><dd>{candidate.foundAt}</dd></div>
                      </dl>
                      {decision !== "pending" && <p className={styles.decision}>{decision === "approved" ? "✓ เลือกคันนี้ไว้ตรวจสอบ" : "? ขอข้อมูลเพิ่มแล้ว"}</p>}
                      <div className={styles.cardActions}>
                        <button onClick={() => setDecisions((current) => ({ ...current, [candidate.id]: "approved" }))}><CheckCircle2 size={17} /> สนใจคันนี้</button>
                        <button onClick={() => setDecisions((current) => ({ ...current, [candidate.id]: "more_info" }))}>ขอข้อมูลเพิ่ม</button>
                        <button aria-label="ไม่เอาคันนี้" onClick={() => setDecisions((current) => ({ ...current, [candidate.id]: "rejected" }))}><X size={18} /></button>
                      </div>
                      <button className={styles.sourceButton} disabled><ExternalLink size={16} /> เปิดประกาศต้นทาง (มีเมื่อค้นจริง)</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
