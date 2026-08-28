"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  CirclePause,
  CirclePlay,
  Clock3,
  Gauge,
  ListChecks,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserPlus,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ConnectorProfilesSnapshot } from "./connector-profiles";
import {
  BANGKOK_METRO_LOCATIONS,
  SOURCING_WEEKDAYS,
  defaultSourcingRuleInput,
  type HermesCommand,
  type SourcingAutomationSnapshot,
  type SourcingRuleInput,
  type SourcingRuleRecord,
  type SourcingWeekday,
} from "./sourcing-automation";

const DAY_LABELS: Record<SourcingWeekday, string> = { mon: "จ.", tue: "อ.", wed: "พ.", thu: "พฤ.", fri: "ศ.", sat: "ส.", sun: "อา." };
const LOCATION_LABELS: Record<string, string> = {
  Bangkok: "กรุงเทพฯ",
  Nonthaburi: "นนทบุรี",
  "Pathum Thani": "ปทุมธานี",
  "Samut Prakan": "สมุทรปราการ",
  "Samut Sakhon": "สมุทรสาคร",
  "Nakhon Pathom": "นครปฐม",
  Phetchaburi: "เพชรบุรี",
};

const EMPTY_CONNECTOR_PROFILES: ConnectorProfilesSnapshot = {
  connected: false,
  message: "Local connector profile control is not configured.",
  profiles: [],
};

function editableRule(rule: SourcingRuleRecord): SourcingRuleInput {
  return {
    id: rule.id,
    name: rule.name,
    active: rule.active,
    priority: rule.priority,
    brand: rule.brand,
    model: rule.model,
    yearFrom: rule.yearFrom,
    yearTo: rule.yearTo,
    maxSourcePriceThb: rule.maxSourcePriceThb,
    dailyLimit: rule.dailyLimit,
    locations: rule.locations,
    requiredKeywords: rule.requiredKeywords,
    excludedKeywords: rule.excludedKeywords,
    sourceAdapter: rule.sourceAdapter,
    bodyType: rule.bodyType,
    schedule: rule.schedule,
    expectedRevision: rule.revision,
  };
}

function splitKeywords(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 20);
}

function statusLabel(value: string) {
  return ({
    not_configured: "ยังไม่เชื่อมต่อ",
    ready: "พร้อมทำงาน",
    running: "กำลังทำงาน",
    paused: "หยุดชั่วคราว",
    login_required: "ต้องเข้าสู่ระบบต้นทาง",
    error: "ต้องตรวจสอบ",
  } as Record<string, string>)[value] || "ไม่ทราบสถานะ";
}

function profileStatusLabel(value: string) {
  return ({
    ready: "Ready",
    paused: "Paused",
    login_required: "Login required",
    error: "Check needed",
  } as Record<string, string>)[value] || "Unknown";
}

export default function BuyingBrowserOwnerSourcing({ initialSnapshot, previewMode = false }: { initialSnapshot: SourcingAutomationSnapshot; previewMode?: boolean }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [connectorProfiles, setConnectorProfiles] = useState<ConnectorProfilesSnapshot>(EMPTY_CONNECTOR_PROFILES);
  const [selectedId, setSelectedId] = useState(initialSnapshot.rules[0]?.id || "new");
  const [form, setForm] = useState<SourcingRuleInput>(initialSnapshot.rules[0] ? editableRule(initialSnapshot.rules[0]) : defaultSourcingRuleInput());
  const [profileForm, setProfileForm] = useState({ profileId: "fb-buyer-02", label: "Facebook Buyer 02" });
  const [busy, setBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState("");
  const [message, setMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    if (!previewMode) void refreshProfiles();
  }, [previewMode]);

  function selectRule(rule: SourcingRuleRecord) {
    setSelectedId(rule.id);
    setForm(editableRule(rule));
    setMessage("");
  }

  function newRule() {
    setSelectedId("new");
    setForm(defaultSourcingRuleInput());
    setMessage("");
  }

  function update<K extends keyof SourcingRuleInput>(key: K, value: SourcingRuleInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  function toggleLocation(location: string) {
    const locations = form.locations.includes(location) ? form.locations.filter((item) => item !== location) : [...form.locations, location];
    update("locations", locations);
  }

  function toggleDay(day: SourcingWeekday) {
    const weekdays = form.schedule.weekdays.includes(day) ? form.schedule.weekdays.filter((item) => item !== day) : [...form.schedule.weekdays, day];
    update("schedule", { ...form.schedule, weekdays });
  }

  async function refreshProfiles() {
    try {
      const response = await fetch("/api/buying-browser/owner/connector-profiles", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok && response.status !== 503) throw new Error(typeof payload?.error === "string" ? payload.error : "connector_profiles_request_failed");
      setConnectorProfiles(payload as ConnectorProfilesSnapshot);
      setProfileMessage("");
    } catch {
      setConnectorProfiles(EMPTY_CONNECTOR_PROFILES);
      setProfileMessage("Connector profile control is not reachable.");
    }
  }

  async function addProfile() {
    setProfileBusy("add");
    setProfileMessage("");
    try {
      const response = await fetch("/api/buying-browser/owner/connector-profiles", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "connector_profile_request_failed");
      await refreshProfiles();
      setProfileMessage(`Profile ${payload.profile_id} added.`);
    } catch (error) {
      const code = error instanceof Error ? error.message : "connector_profile_request_failed";
      setProfileMessage(code === "duplicate_profile_id" ? "Profile already exists." : "Profile could not be added.");
    } finally {
      setProfileBusy("");
    }
  }

  async function controlProfile(action: "check" | "open_login" | "pause" | "login_required", profileId: string) {
    setProfileBusy(`${action}:${profileId}`);
    setProfileMessage("");
    try {
      const response = await fetch("/api/buying-browser/owner/connector-profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, profileId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "connector_profile_request_failed");
      await refreshProfiles();
      setProfileMessage(action === "open_login" ? `Login browser opened for ${payload.profile_id}.` : `Profile ${payload.profile_id} updated.`);
    } catch {
      setProfileMessage("Profile command failed. Check the connector service.");
    } finally {
      setProfileBusy("");
    }
  }

  async function request(method: "PUT" | "POST", body: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/buying-browser/owner/sourcing", {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "sourcing_request_failed");
      const next = payload as SourcingAutomationSnapshot;
      setSnapshot(next);
      if (method === "PUT") {
        const saved = form.id ? next.rules.find((rule) => rule.id === form.id) : next.rules.at(-1);
        if (saved) {
          setSelectedId(saved.id);
          setForm(editableRule(saved));
        }
      }
      setMessage(method === "PUT" ? "บันทึกกฎแล้ว" : "ส่งคำสั่งให้ Hermes แล้ว");
    } catch (error) {
      const code = error instanceof Error ? error.message : "sourcing_request_failed";
      setMessage(code === "sourcing_control_unavailable" ? "ยังเชื่อมต่อ QNAP/Hermes ไม่ได้ จึงยังไม่มีคำสั่งถูกส่ง" : code === "sourcing_revision_conflict" ? "กฎถูกแก้จากอีกอุปกรณ์ กรุณาโหลดหน้าใหม่" : "ตรวจสอบข้อมูลกฎและลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  function saveRule() {
    void request("PUT", form);
  }

  function command(action: HermesCommand) {
    void request("POST", { action, ruleId: selectedId === "new" ? null : selectedId });
  }

  return (
    <div className="buying-browser bb-owner-preview" data-owner-sourcing-automation data-preview-mode={previewMode || undefined}>
      <header className="bb-owner-header">
        <div className="bb-owner-header-links"><Link href={previewMode ? "/buy/account" : "/buy/owner"}><ArrowLeft size={18} />{previewMode ? "Back to Account" : "Source & Case Control"}</Link></div>
        <div><span>NK</span><div><b>Sourcing Automation</b><small>{previewMode ? "Interactive Owner menu preview" : "Owner / Hermes Control"}</small></div></div>
      </header>
      <main>
        <section className="bb-page-heading">
          <div><p className="bb-kicker">Owner sourcing control</p><h1>ตั้งค่าดึงรถอัตโนมัติ</h1><p>กำหนดรถเป้าหมาย จำนวนต่อวัน และช่วงเวลาทำงาน แล้วส่งคำสั่งให้ Hermes ผ่าน QNAP</p></div>
          <span className={`bb-status-chip ${snapshot.connected && !previewMode ? "requested" : "pending"}`}>{snapshot.connected && !previewMode ? <ShieldCheck size={13} /> : <WifiOff size={13} />}{previewMode ? "Preview only" : snapshot.connected ? "QNAP connected" : "Fail closed"}</span>
        </section>

        <div className={snapshot.connected && !previewMode ? "bb-owner-sourcing-note" : "bb-owner-warning"}>
          {snapshot.connected && !previewMode ? <Bot size={18} /> : <WifiOff size={18} />}
          <div><b>{previewMode ? "ทดลองเลือกค่าได้โดยยังไม่บันทึก" : statusLabel(snapshot.hermesState)}</b><p>{previewMode ? "ค่าที่เลือกอยู่เฉพาะบนหน้านี้ ระบบจะไม่บันทึกกฎหรือส่งคำสั่งให้ Hermes จนกว่าจะเข้าสู่ระบบ Owner และเชื่อม QNAP" : snapshot.message}</p></div>
        </div>

        <section className="bb-owner-kpis">
          <article><Bot size={20} /><span><small>Hermes</small><b>{statusLabel(snapshot.hermesState)}</b></span></article>
          <article><Search size={20} /><span><small>Browser Profile</small><b>{statusLabel(snapshot.browserProfileState)}</b></span></article>
          <article><ListChecks size={20} /><span><small>คิวปัจจุบัน</small><b>{snapshot.queueDepth}</b></span></article>
          <article><Gauge size={20} /><span><small>คันที่ประมวลผลวันนี้</small><b>{snapshot.processedToday}</b></span></article>
        </section>

        <section className="bb-owner-hermes-actions" aria-label="Hermes commands">
          <button className="bb-button primary" disabled={previewMode || busy || !snapshot.connected} onClick={() => command("run_now")}><CirclePlay size={17} />ทำงานตอนนี้</button>
          <button className="bb-button secondary" disabled={previewMode || busy || !snapshot.connected || snapshot.hermesState === "paused"} onClick={() => command("pause")}><CirclePause size={17} />หยุดชั่วคราว</button>
          <button className="bb-button secondary" disabled={previewMode || busy || !snapshot.connected || snapshot.hermesState !== "paused"} onClick={() => command("resume")}><CirclePlay size={17} />ทำงานต่อ</button>
          <small>คำสั่งจะหยุดเองเมื่อพบ Login Required, MFA, CAPTCHA, rate limit หรือถึงจำนวนสูงสุดต่อวัน</small>
        </section>

        <section className="bb-owner-profile-control" aria-label="Hermes browser profiles">
          <div className="bb-section-heading">
            <div><p className="bb-kicker">Hermes profiles</p><h2>Facebook browser login</h2></div>
            <span className={`bb-status-chip ${connectorProfiles.connected && !previewMode ? "requested" : "pending"}`}>{connectorProfiles.connected && !previewMode ? <ShieldCheck size={13} /> : <WifiOff size={13} />}{previewMode ? "Preview only" : connectorProfiles.connected ? "Connector ready" : "Not configured"}</span>
          </div>
          <p>{connectorProfiles.message}</p>
          <div className="bb-owner-profile-grid">
            {connectorProfiles.profiles.map((profile) => (
              <article key={profile.profile_id}>
                <div>
                  <b>{profile.label || profile.profile_id}</b>
                  <small>{profile.profile_id} / {profileStatusLabel(profile.state)}{profile.reason ? ` / ${profile.reason}` : ""}</small>
                </div>
                <div>
                  <button className="bb-button secondary" disabled={previewMode || !connectorProfiles.connected || profileBusy !== ""} onClick={() => controlProfile("check", profile.profile_id)}><RefreshCw size={16} />Check</button>
                  <button className="bb-button primary" disabled={previewMode || !connectorProfiles.connected || profileBusy !== ""} onClick={() => controlProfile("open_login", profile.profile_id)}><Search size={16} />Open Login</button>
                  <button className="bb-button secondary" disabled={previewMode || !connectorProfiles.connected || profileBusy !== ""} onClick={() => controlProfile("pause", profile.profile_id)}><CirclePause size={16} />Pause</button>
                </div>
              </article>
            ))}
            {!connectorProfiles.profiles.length && <p>No connector profiles are available yet.</p>}
          </div>
          <div className="bb-owner-profile-add">
            <label><span>Profile ID</span><input value={profileForm.profileId} maxLength={64} onChange={(event) => setProfileForm((current) => ({ ...current, profileId: event.target.value }))} /></label>
            <label><span>Label</span><input value={profileForm.label} maxLength={100} onChange={(event) => setProfileForm((current) => ({ ...current, label: event.target.value }))} /></label>
            <button className="bb-button secondary" disabled={previewMode || !connectorProfiles.connected || profileBusy !== ""} onClick={addProfile}><UserPlus size={16} />Add profile</button>
          </div>
          <div className="bb-owner-sourcing-safety"><ShieldCheck size={17} /><p>This menu never accepts Facebook passwords. It only opens the authorized browser profile so the account owner can sign in directly with Facebook.</p></div>
          {profileMessage && <p className="bb-owner-case-status" role="status">{profileMessage}</p>}
        </section>

        <section className="bb-owner-sourcing-layout">
          <aside>
            <div className="bb-section-heading"><div><p className="bb-kicker">Sourcing rules</p><h2>กฎค้นหารถ</h2></div><button type="button" title="เพิ่มกฎ" onClick={newRule}><Plus size={18} /></button></div>
            {snapshot.rules.map((rule) => <button type="button" className={selectedId === rule.id ? "active" : ""} onClick={() => selectRule(rule)} key={rule.id}><span><b>{rule.name}</b><small>{rule.yearFrom}-{rule.yearTo} / สูงสุด {rule.dailyLimit} คันต่อวัน</small></span><em>{rule.active ? "Active" : "Paused"}</em></button>)}
            {!snapshot.rules.length && <p>ยังไม่มีกฎที่บันทึกไว้ ใช้แบบฟอร์มตัวอย่าง Toyota pickup 2020+ เพื่อเริ่มต้น</p>}
          </aside>

          <div className="bb-owner-sourcing-form">
            <div className="bb-section-heading"><div><p className="bb-kicker">Rule editor</p><h2>{selectedId === "new" ? "สร้างกฎใหม่" : "แก้ไขกฎ"}</h2></div><span className="bb-status-chip pending">Owner only</span></div>
            <div className="bb-owner-sourcing-fields">
              <label className="wide"><span>ชื่อกฎ</span><input value={form.name} maxLength={100} onChange={(event) => update("name", event.target.value)} /></label>
              <label><span>สถานะ</span><select value={form.active ? "active" : "paused"} onChange={(event) => update("active", event.target.value === "active")}><option value="active">Active</option><option value="paused">Paused</option></select></label>
              <label><span>ความสำคัญ</span><select value={form.priority} onChange={(event) => update("priority", event.target.value as SourcingRuleInput["priority"])}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
              <label><span>ยี่ห้อ</span><input value={form.brand} maxLength={50} onChange={(event) => update("brand", event.target.value)} /></label>
              <label><span>รุ่น (เว้นว่างได้)</span><input value={form.model} maxLength={80} placeholder="Hilux Revo" onChange={(event) => update("model", event.target.value)} /></label>
              <label><span>ปีเริ่มต้น</span><input type="number" min="1990" max={new Date().getUTCFullYear() + 1} value={form.yearFrom} onChange={(event) => update("yearFrom", Number(event.target.value))} /></label>
              <label><span>ปีสิ้นสุด</span><input type="number" min={form.yearFrom} max={new Date().getUTCFullYear() + 1} value={form.yearTo} onChange={(event) => update("yearTo", Number(event.target.value))} /></label>
              <label><span>จำนวนสูงสุดต่อวัน</span><input type="number" min="1" max="50" value={form.dailyLimit} onChange={(event) => update("dailyLimit", Number(event.target.value))} /></label>
              <label><span>ราคาต้นทางสูงสุด (THB)</span><input type="number" min="1" placeholder="ไม่จำกัด" value={form.maxSourcePriceThb ?? ""} onChange={(event) => update("maxSourcePriceThb", event.target.value ? Number(event.target.value) : null)} /></label>
              <label className="wide"><span>คำที่ต้องมี แยกด้วย comma</span><input value={form.requiredKeywords.join(", ")} onChange={(event) => update("requiredKeywords", splitKeywords(event.target.value))} /></label>
              <label className="wide"><span>คำที่ไม่ต้องการ แยกด้วย comma</span><input value={form.excludedKeywords.join(", ")} onChange={(event) => update("excludedKeywords", splitKeywords(event.target.value))} /></label>
            </div>

            <fieldset className="bb-owner-sourcing-options"><legend><MapPin size={15} />พื้นที่ค้นหา</legend><div>{BANGKOK_METRO_LOCATIONS.map((location) => <label key={location}><input type="checkbox" checked={form.locations.includes(location)} onChange={() => toggleLocation(location)} /><span>{LOCATION_LABELS[location]}</span></label>)}</div></fieldset>
            <fieldset className="bb-owner-sourcing-options"><legend><CalendarDays size={15} />วันทำงาน</legend><div>{SOURCING_WEEKDAYS.map((day) => <label key={day}><input type="checkbox" checked={form.schedule.weekdays.includes(day)} onChange={() => toggleDay(day)} /><span>{DAY_LABELS[day]}</span></label>)}</div></fieldset>
            <div className="bb-owner-sourcing-schedule"><label><Clock3 size={15} /><span>เริ่ม</span><input type="number" min="0" max="23" value={form.schedule.startHour} onChange={(event) => update("schedule", { ...form.schedule, startHour: Number(event.target.value) })} /></label><label><Clock3 size={15} /><span>สิ้นสุด</span><input type="number" min="1" max="24" value={form.schedule.endHour} onChange={(event) => update("schedule", { ...form.schedule, endHour: Number(event.target.value) })} /></label><small>เวลา Asia/Bangkok</small></div>

            <div className="bb-owner-sourcing-safety"><ShieldCheck size={17} /><p>Hermes เก็บเฉพาะข้อมูลที่เข้าถึงได้ตามสิทธิ์ ส่งเข้า Needs Review และตรวจรถซ้ำ ระบบนี้ไม่ auto-publish ไม่ส่งข้อความผู้ขาย และไม่ข้าม Login, MFA หรือ CAPTCHA</p></div>
            <button className="bb-button primary" disabled={previewMode || busy || !snapshot.connected} onClick={saveRule}><Save size={17} />{busy ? "กำลังบันทึก..." : "บันทึกกฎ"}</button>
            {message && <p className="bb-owner-case-status" role="status">{message}</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
