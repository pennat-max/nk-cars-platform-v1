"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useState } from "react";
import styles from "./AiDevelopmentOfficePreview.module.css";

const workers = [
  { role: "Product AI", duty: "สรุปโจทย์และเกณฑ์รับงาน", icon: Sparkles },
  { role: "Frontend AI", duty: "เตรียมหน้าจอและ interaction", icon: Bot },
  { role: "Backend AI", duty: "วางขอบเขต service และข้อมูล", icon: Bot },
  { role: "QA AI", duty: "ตรวจ Test / Build evidence", icon: ClipboardCheck },
  { role: "Security AI", duty: "ตรวจ guardrail และข้อมูลอ่อนไหว", icon: ShieldCheck },
] as const;

const queue = [
  { state: "รอทำ", title: "แตก Owner brief เป็น acceptance checklist", tone: "waiting" },
  { state: "กำลังทำ", title: "ประกอบ Mobile Owner Preview", tone: "working" },
  { state: "รอตรวจ", title: "ตรวจ responsive viewport 390px", tone: "review" },
  { state: "ติดปัญหา", title: "PENDING — ยังไม่มีหลักฐาน accessibility", tone: "blocked" },
  { state: "เสร็จแล้ว", title: "กำหนดขอบเขต Mock-only", tone: "done" },
] as const;

export default function AiDevelopmentOfficePreview() {
  const [workerEnabled, setWorkerEnabled] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState("");
  const [draftStatus, setDraftStatus] = useState("ยังไม่ได้เพิ่มเข้าคิวจำลอง");

  function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraftStatus(draft.trim() ? "บันทึกร่างในหน้าจอนี้แล้ว — Preview เท่านั้น" : "PENDING — กรุณากรอกคำสั่งงาน");
  }

  return (
    <div className={styles.office} data-ai-office-preview>
      <header className={styles.topbar}>
        <Link href="/buy/account" aria-label="กลับไปหน้าบัญชี Owner"><ArrowLeft size={19} />กลับ</Link>
        <div className={styles.brand}><span>NK</span><div><b>NK Cars</b><small>Owner Workspace</small></div></div>
        <span className={styles.previewPill}>MOCK / PREVIEW</span>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>AI OFFICE · PHASE 2</p>
            <h1>AI Development Office</h1>
            <p>พื้นที่จำลองสำหรับพี่คอมตรวจทีม AI คิวงาน หลักฐาน และรายการรออนุมัติบนมือถือ</p>
          </div>
          <div className={styles.heroBadge}><LockKeyhole size={17} /><span><b>Preview เท่านั้น</b><small>ไม่มี Worker จริงทำงาน</small></span></div>
        </section>

        <aside className={styles.safety} aria-label="ขอบเขตความปลอดภัย">
          <ShieldCheck size={21} />
          <div><b>MOCK / PREVIEW · ปลอดภัยสำหรับการตรวจ UI</b><p>ไม่เรียก API, ไม่ใช้ Credential, ไม่ส่งข้อความภายนอก และไม่เขียนข้อมูลจริง</p></div>
        </aside>

        <section className={styles.panel}>
          <div className={styles.sectionHead}><div><p className={styles.eyebrow}>THAI TASK BRIEF</p><h2>ร่างคำสั่งงาน</h2></div><span className={styles.mockTag}>MOCK</span></div>
          <form onSubmit={submitDraft} className={styles.taskForm}>
            <label htmlFor="ai-task">งานที่ต้องการให้ทีม AI เตรียม</label>
            <textarea id="ai-task" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="เช่น ตรวจหน้า Owner Preview ที่ 390px และสรุปหลักฐาน..." rows={4} />
            <div className={styles.formFoot}><span role="status">{draftStatus}</span><button type="submit"><Send size={17} />เพิ่มร่างงาน</button></div>
          </form>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p className={styles.eyebrow}>DISABLED BY DEFAULT</p><h2>ทีม AI จำลอง</h2></div><span className={styles.mockTag}>5 WORKERS · MOCK</span></div>
          <div className={styles.workerGrid}>
            {workers.map(({ role, duty, icon: Icon }) => {
              const enabled = Boolean(workerEnabled[role]);
              return <article className={styles.workerCard} key={role}>
                <div className={styles.workerIcon}><Icon size={20} /></div>
                <div className={styles.workerCopy}><h3>{role}</h3><p>{duty}</p><span className={enabled ? styles.enabled : styles.disabled}>{enabled ? "เปิดใน Mock UI" : "ปิดใช้งาน"}</span></div>
                <button type="button" className={styles.toggle} role="switch" aria-checked={enabled} aria-label={`${enabled ? "ปิด" : "เปิด"} ${role} ใน Mock UI`} onClick={() => setWorkerEnabled((current) => ({ ...current, [role]: !enabled }))}><span /></button>
              </article>;
            })}
          </div>
          <p className={styles.boundary}><LockKeyhole size={15} />Toggle เปลี่ยนเฉพาะ local React state — ไม่เชื่อม Tool, API หรือ Worker runtime</p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}><div><p className={styles.eyebrow}>WORK QUEUE</p><h2>คิวงานจำลอง</h2></div><span className={styles.mockTag}>PREVIEW</span></div>
          <div className={styles.queueList}>{queue.map((item, index) => <article className={styles.queueCard} key={item.state}><span className={`${styles.queueState} ${styles[item.tone]}`}>{item.state}</span><div><small>MOCK-{String(index + 1).padStart(2, "0")}</small><h3>{item.title}</h3></div><span className={styles.queueNumber}>0{index + 1}</span></article>)}</div>
        </section>

        <div className={styles.twoColumn}>
          <section className={styles.panel}>
            <div className={styles.sectionHead}><div><p className={styles.eyebrow}>QA EVIDENCE</p><h2>หลักฐาน Test / Build</h2></div><span className={styles.mockTag}>MOCK / PREVIEW</span></div>
            <div className={styles.evidence}><div><CheckCircle2 size={18} /><span><b>Targeted route test</b><small>MOCK EVIDENCE · PASS 4/4</small></span></div><div><CheckCircle2 size={18} /><span><b>390px responsive check</b><small>MOCK EVIDENCE · PASS · ไม่มี horizontal overflow</small></span></div><div><CheckCircle2 size={18} /><span><b>Local Preview build</b><small>MOCK EVIDENCE · PASS · ไม่ได้ Deploy</small></span></div></div>
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHead}><div><p className={styles.eyebrow}>OWNER GATE</p><h2>รอ Owner อนุมัติ</h2></div><span className={styles.pending}>1 PENDING</span></div>
            <article className={styles.approval}><div><span>MOCK / PREVIEW</span><h3>AI Office V1 Preview</h3><p>ตรวจ UI, สถานะ และหลักฐานก่อนอนุญาตขั้นต่อไป</p></div><button type="button" disabled>อนุมัติ — Preview เท่านั้น</button></article>
          </section>
        </div>

        <section className={styles.panel}>
          <div className={styles.sectionHead}><div><p className={styles.eyebrow}>IMMUTABLE-STYLE PREVIEW</p><h2>Audit Log</h2></div><span className={styles.mockTag}>MOCK</span></div>
          <ol className={styles.timeline}>
            <li><span /><div><time>09:30</time><b>สร้าง Preview workspace</b><p>Actor: Owner Preview · ไม่มีการเขียนข้อมูลจริง</p></div></li>
            <li><span /><div><time>09:34</time><b>เพิ่ม Mock queue 5 สถานะ</b><p>Result: UI state only</p></div></li>
            <li><span /><div><time>PENDING</time><b>Owner review</b><p>หยุดรอการอนุมัติ · ห้าม Merge หรือ Production deploy</p></div></li>
          </ol>
        </section>
      </main>
    </div>
  );
}
