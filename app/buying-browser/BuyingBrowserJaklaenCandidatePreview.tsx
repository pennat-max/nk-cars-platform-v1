"use client";

/* eslint-disable @next/next/no-img-element -- Preview uses internal evidence thumbnails and screenshot mock assets. */

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, EyeOff, FilePenLine, Info, LockKeyhole, MessageCircleQuestion, ShieldCheck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  jaklaenPreviewAudit,
  jaklaenPreviewCandidate,
  jaklaenPreviewFields,
  type JaklaenAuditEvent,
  type JaklaenCandidateStatus,
  type JaklaenReviewField,
} from "./jaklaen-candidates";
import styles from "./BuyingBrowserJaklaenCandidatePreview.module.css";

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

export default function BuyingBrowserJaklaenCandidatePreview() {
  const [status, setStatus] = useState<JaklaenCandidateStatus>(jaklaenPreviewCandidate.status);
  const [fields, setFields] = useState<JaklaenReviewField[]>(jaklaenPreviewFields);
  const [audit, setAudit] = useState<JaklaenAuditEvent[]>(jaklaenPreviewAudit);
  const [note, setNote] = useState("");
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

  return (
    <div className={`buying-browser bb-jaklaen-preview ${styles.root}`} data-jaklaen-candidate-review-preview>
      <header className="bb-owner-header">
        <div className="bb-owner-header-links"><Link href="/buy/account"><ArrowLeft size={18} />Account</Link><Link href="/buy/owner-preview/sourcing">Sourcing menu</Link></div>
        <div><span>NK</span><div><b>Jaklaen Intake</b><small>Candidate Review V1 Preview</small></div></div>
      </header>
      <main>
        <section className="bb-page-heading">
          <div>
            <p className="bb-kicker">TEST/MOCK PREVIEW</p>
            <h1>Candidate Review</h1>
            <p>Owner checks candidate evidence, fixes fields, and decides Approve, Reject, or Need More Info. Approval here does not publish.</p>
          </div>
          <span className={`bb-status-chip ${statusClass(status)}`}>{statusLabel(status)}</span>
        </section>

        <section className="bb-owner-warning">
          <LockKeyhole size={18} />
          <div>
            <b>Preview only. Internal evidence boundary stays closed.</b>
            <p>This page uses TEST/MOCK fixture data. Source URL, seller reference, screenshot, and audit details are Owner-only and must never enter customer DTOs.</p>
          </div>
        </section>

        <section className={styles.reviewGrid}>
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
              <span><b>{field.label}</b><small>{field.status} · {field.confidence}% · {field.evidence}</small></span>
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

        <section className={styles.audit}>
          <div className="bb-section-heading"><div><p className="bb-kicker">Audit log</p><h2>Every change recorded</h2></div><EyeOff size={19} /></div>
          <ol>{audit.map((item) => <li key={item.id}><span>{item.action}</span><div><b>{item.actor}</b><p>{item.note}</p><time>{item.createdAt}</time></div></li>)}</ol>
          <p className="bb-honesty-note"><Info size={15} />Final proof still requires one real Toyota Hilux Revo candidate with real source URL, photos, screenshot, and QNAP storage references.</p>
        </section>
      </main>
    </div>
  );
}
