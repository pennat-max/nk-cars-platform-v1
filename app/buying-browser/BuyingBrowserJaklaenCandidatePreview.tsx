"use client";

/* eslint-disable @next/next/no-img-element -- Preview uses internal evidence thumbnails and screenshot mock assets. */

import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  EyeOff,
  FilePenLine,
  Info,
  LockKeyhole,
  MessageCircleQuestion,
  Play,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  jaklaenPreviewAudit,
  jaklaenPreviewCandidate,
  jaklaenPreviewFields,
  jaklaenPreviewQueueJobs,
  jaklaenPreviewSearchRequest,
  jaklaenPreviewStandingSearch,
  type JaklaenAuditEvent,
  type JaklaenCandidateStatus,
  type JaklaenReviewField,
  type JaklaenSearchRequest,
} from "./jaklaen-candidates";
import styles from "./BuyingBrowserJaklaenCandidatePreview.module.css";

type Tab = "search" | "standing" | "review";

function statusLabel(status: JaklaenCandidateStatus) {
  if (status === "NEEDS_REVIEW") return "Needs review";
  if (status === "NEED_MORE_INFO") return "Need more info";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function statusClass(status: JaklaenCandidateStatus) {
  if (status === "APPROVED") return "market";
  if (status === "REJECTED") return "danger";
  return "pending";
}

function money(value: number) {
  return `THB ${value.toLocaleString("en-US")}`;
}

function CriteriaSummary({ request }: { request: JaklaenSearchRequest }) {
  const criteria = request.criteria;
  return (
    <dl className={styles.criteria}>
      <div><dt>Make / Model / Grade</dt><dd>{criteria.make} {criteria.model} / {criteria.grade}</dd></div>
      <div><dt>Year range</dt><dd>{criteria.yearFrom}-{criteria.yearTo}</dd></div>
      <div><dt>Transmission / Drive</dt><dd>{criteria.transmission} / {criteria.driveType}</dd></div>
      <div><dt>Engine / Fuel</dt><dd>{criteria.engineFuel}</dd></div>
      <div><dt>Maximum price</dt><dd>{money(criteria.maxPriceThb)}</dd></div>
      <div><dt>Maximum mileage</dt><dd>{criteria.maxMileageKm.toLocaleString("en-US")} km</dd></div>
      <div><dt>Location / Radius</dt><dd>{criteria.location} / {criteria.radiusKm} km</dd></div>
      <div><dt>Quantity required</dt><dd>{criteria.quantityRequired} cars</dd></div>
      <div><dt>Sources</dt><dd>{criteria.sources.join(", ")}</dd></div>
      <div><dt>Requested by</dt><dd>{request.requestedByRole} - {request.requestedBy}</dd></div>
      <div><dt>Case reference</dt><dd>{request.customerCaseReference}</dd></div>
      <div><dt>Priority</dt><dd>{request.priority}</dd></div>
    </dl>
  );
}

export default function BuyingBrowserJaklaenCandidatePreview() {
  const [tab, setTab] = useState<Tab>("search");
  const [status, setStatus] = useState<JaklaenCandidateStatus>(jaklaenPreviewCandidate.status);
  const [fields, setFields] = useState<JaklaenReviewField[]>(jaklaenPreviewFields);
  const [audit, setAudit] = useState<JaklaenAuditEvent[]>(jaklaenPreviewAudit);
  const [note, setNote] = useState("");
  const [queueStatus, setQueueStatus] = useState("CANDIDATE_RETURNED");
  const candidate = jaklaenPreviewCandidate;
  const editedCount = useMemo(() => fields.filter((field) => field.value !== jaklaenPreviewFields.find((item) => item.key === field.key)?.value).length, [fields]);

  function updateField(key: string, value: string) {
    setFields((current) => current.map((field) => field.key === key ? { ...field, value, status: value === "UNKNOWN" || value === "PENDING" ? "Unknown" : "Need Review" } : field));
  }

  function record(action: JaklaenAuditEvent["action"], nextStatus?: JaklaenCandidateStatus) {
    const createdAt = new Date().toISOString();
    if (nextStatus) setStatus(nextStatus);
    setAudit((current) => [{
      id: `audit_preview_${createdAt}`,
      action,
      actor: "owner-preview",
      note: note.trim() || (action === "FIELD_EDITED" ? `${editedCount} field edit(s) recorded in preview.` : `${statusLabel(nextStatus || status)} selected in preview.`),
      createdAt,
    }, ...current]);
    setNote("");
  }

  function simulateSearchNow() {
    const createdAt = new Date().toISOString();
    setQueueStatus("CANDIDATE_RETURNED");
    setAudit((current) => [
      { id: `audit_candidate_${createdAt}`, action: "CANDIDATE_RETURNED", actor: "worker:jaklaen-hermes-preview", note: "Jaklaen returned one TEST/MOCK candidate to Candidate Review as NEEDS_REVIEW.", createdAt },
      { id: `audit_claim_${createdAt}`, action: "JOB_CLAIMED", actor: "worker:jaklaen-hermes-preview", note: "Worker token accepted. Job claimed from Jaklaen queue.", createdAt },
      { id: `audit_queue_${createdAt}`, action: "JOB_QUEUED", actor: "owner-preview", note: "SEARCH_NOW request created from app and queued immediately.", createdAt },
      ...current,
    ]);
  }

  return (
    <div className={`buying-browser bb-jaklaen-preview ${styles.root}`} data-jaklaen-candidate-review-preview>
      <header className="bb-owner-header">
        <div className="bb-owner-header-links"><Link href="/buy/account"><ArrowLeft size={18} />Account</Link><Link href="/buy/owner-preview/sourcing">Sourcing menu</Link></div>
        <div><span>NK</span><div><b>Jaklaen Intake</b><small>Search Queue V1 Preview</small></div></div>
      </header>
      <main>
        <section className="bb-page-heading">
          <div>
            <p className="bb-kicker">TEST/MOCK PREVIEW</p>
            <h1>Jaklaen Workbench</h1>
            <p>Owner and Staff can create search jobs from the app, schedule recurring searches, and review returned candidates before any publish step.</p>
          </div>
          <span className={`bb-status-chip ${statusClass(status)}`}>{statusLabel(status)}</span>
        </section>

        <section className="bb-owner-warning">
          <LockKeyhole size={18} />
          <div>
            <b>Preview only. No Production write, publish, seller contact, or payment action.</b>
            <p>Source URL, seller reference, screenshot, internal notes, and audit evidence stay Owner-only.</p>
          </div>
        </section>

        <nav className={styles.tabs} aria-label="Jaklaen workbench sections">
          <button className={tab === "search" ? styles.activeTab : ""} onClick={() => setTab("search")}><Search size={16} />Search Now</button>
          <button className={tab === "standing" ? styles.activeTab : ""} onClick={() => setTab("standing")}><CalendarClock size={16} />Standing Searches</button>
          <button className={tab === "review" ? styles.activeTab : ""} onClick={() => setTab("review")}><ClipboardCheck size={16} />Candidate Review</button>
        </nav>

        {tab === "search" && (
          <section className={styles.panel} data-jaklaen-search-now>
            <div className="bb-section-heading"><div><p className="bb-kicker">Search Now</p><h2>Create a SEARCH_NOW job</h2></div><span className="bb-status-chip pending">Owner / Staff / Case customer</span></div>
            <CriteriaSummary request={jaklaenPreviewSearchRequest} />
            <div className={styles.formGrid}>
              <label><span>Make</span><input defaultValue={jaklaenPreviewSearchRequest.criteria.make} /></label>
              <label><span>Model</span><input defaultValue={jaklaenPreviewSearchRequest.criteria.model} /></label>
              <label><span>Grade</span><input defaultValue={jaklaenPreviewSearchRequest.criteria.grade} /></label>
              <label><span>Max price</span><input defaultValue={money(jaklaenPreviewSearchRequest.criteria.maxPriceThb)} /></label>
              <label><span>Max mileage</span><input defaultValue={`${jaklaenPreviewSearchRequest.criteria.maxMileageKm.toLocaleString("en-US")} km`} /></label>
              <label><span>Quantity</span><select defaultValue={jaklaenPreviewSearchRequest.criteria.quantityRequired}><option>1</option><option>2</option><option>3</option></select></label>
            </div>
            <div className={styles.actions}>
              <button className="bb-button primary" onClick={simulateSearchNow}><Play size={16} />Create SEARCH_NOW job</button>
              <button className="bb-button secondary" onClick={() => setTab("review")}><ClipboardCheck size={16} />Open returned candidate</button>
            </div>
            <div className={styles.queue}>
              {jaklaenPreviewQueueJobs.filter((job) => job.mode === "SEARCH_NOW").map((job) => (
                <article key={job.jobId}>
                  <b>{job.jobId}</b><span>{queueStatus}</span>
                  <p>{job.safeStatus}</p>
                  <small>Claimed by {job.workerId}. Candidate: {job.returnedCandidateId}</small>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "standing" && (
          <section className={styles.panel} data-jaklaen-standing-searches>
            <div className="bb-section-heading"><div><p className="bb-kicker">Standing Searches</p><h2>Schedule recurring search jobs</h2></div><span className="bb-status-chip market">Active</span></div>
            <CriteriaSummary request={jaklaenPreviewStandingSearch} />
            <div className={styles.scheduleBox}>
              <div><b>Frequency</b><span>{jaklaenPreviewStandingSearch.schedule?.frequency}</span></div>
              <div><b>Run days</b><span>{jaklaenPreviewStandingSearch.schedule?.weekdays.join(", ")}</span></div>
              <div><b>Active hours</b><span>{jaklaenPreviewStandingSearch.schedule?.startTime}-{jaklaenPreviewStandingSearch.schedule?.endTime} {jaklaenPreviewStandingSearch.schedule?.timezone}</span></div>
              <div><b>Next job</b><span>System creates a new STANDING_SEARCH job only inside active hours.</span></div>
            </div>
            <p className="bb-security-note"><ShieldCheck size={16} />Owner can manage all standing searches. Staff can manage only granted scopes. Customer accounts cannot edit company standing searches.</p>
          </section>
        )}

        {tab === "review" && (
          <>
            <section className={styles.reviewGrid} data-jaklaen-candidate-review>
              <article className={styles.gallery}>
                <div className={styles.cover}><img src={candidate.images[0]} alt={`${candidate.listingTitle} evidence cover`} /></div>
                <div className={styles.thumbs}>
                  {candidate.images.map((image, index) => <img src={image} alt={`Candidate evidence ${index + 1}`} key={image} />)}
                </div>
                <a className="bb-button secondary" href={candidate.sourceUrl} target="_blank" rel="noreferrer">Open Source URL<ExternalLink size={16} /></a>
              </article>

              <article className={styles.summary}>
                <header>
                  <div><small>{candidate.candidateId}</small><h2>{candidate.listingTitle}</h2></div>
                  <span className="bb-status-chip pending">NEEDS_REVIEW by default</span>
                </header>
                <dl>
                  <div><dt>Source platform</dt><dd>{candidate.sourcePlatform}</dd></div>
                  <div><dt>Collected time</dt><dd>{candidate.collectedAt}</dd></div>
                  <div><dt>Confidence</dt><dd>{candidate.confidence}%</dd></div>
                  <div><dt>Seller reference</dt><dd>{candidate.sellerReference}</dd></div>
                  <div><dt>Missing fields</dt><dd>{candidate.missingFields.join(", ") || "None"}</dd></div>
                  <div><dt>Duplicate check</dt><dd>{candidate.duplicateSignals.join(" / ")}</dd></div>
                </dl>
                <div className={styles.screenshot}>
                  <b>Screenshot evidence</b>
                  <img src={candidate.screenshot} alt="Marketplace screenshot evidence preview" />
                </div>
              </article>
            </section>

            <section className={styles.fields}>
              <div className="bb-section-heading"><div><p className="bb-kicker">AI extracted fields</p><h2>Review and correct</h2></div><span>{fields.length} fields</span></div>
              {fields.map((field) => (
                <label key={field.key} className={styles.field}>
                  <span><b>{field.label}</b><small>{field.status} / {field.confidence}% / {field.evidence}</small></span>
                  <input value={field.value} onChange={(event) => updateField(field.key, event.target.value)} aria-label={field.label} />
                </label>
              ))}
              <label className={styles.note}><span>Comment / Why corrected?</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required in real Owner review when correcting, rejecting, or asking for more info." /></label>
              <div className={styles.actions}>
                <button className="bb-button secondary" onClick={() => record("FIELD_EDITED")}><FilePenLine size={16} />Save correction</button>
                <button className="bb-button secondary" onClick={() => record("NEED_MORE_INFO", "NEED_MORE_INFO")}><MessageCircleQuestion size={16} />Need more info</button>
                <button className="bb-button danger" onClick={() => record("REJECTED", "REJECTED")}><XCircle size={16} />Reject</button>
                <button className="bb-button primary" onClick={() => record("APPROVED", "APPROVED")}><CheckCircle2 size={16} />Approve candidate</button>
              </div>
              <p className="bb-security-note"><ShieldCheck size={16} />Approve candidate means internal candidate approved for next workflow only. It does not publish to Browse and does not contact the seller.</p>
            </section>
          </>
        )}

        <section className={styles.audit}>
          <div className="bb-section-heading"><div><p className="bb-kicker">Audit log</p><h2>Queue and review evidence</h2></div><EyeOff size={19} /></div>
          <ol>{audit.map((item) => <li key={item.id}><span>{item.action}</span><div><b>{item.actor}</b><p>{item.note}</p><time>{item.createdAt}</time></div></li>)}</ol>
          <p className="bb-honesty-note"><Info size={15} />Final approval still requires one real Toyota Hilux Revo candidate with real source URL, photos, screenshot, Candidate ID, and storage references. This Preview remains TEST/MOCK.</p>
        </section>
      </main>
    </div>
  );
}
