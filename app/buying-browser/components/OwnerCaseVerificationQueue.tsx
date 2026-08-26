"use client";

import { CheckCircle2, CircleDashed, FileCheck2, FileText, History, Save, ShieldCheck, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { formatDateTime, formatThb } from "../format";
import type { AvailabilityState, OwnerCaseQueueItem, OwnerCaseVerificationInput } from "../types";
import VehiclePhoto from "./VehiclePhoto";

const availabilityOptions: AvailabilityState[] = [
  "Availability Not Yet Confirmed",
  "Availability Check Requested",
  "Verified Available",
  "Price Changed",
  "Possibly Unavailable",
];

function inputValue(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function amount(value: string) {
  if (value.trim() === "") return null;
  return Number(value);
}

function initialForm(item: OwnerCaseQueueItem): Record<keyof OwnerCaseVerificationInput, string> {
  return {
    availability: item.vehicleCase.availability,
    actualVehiclePurchasePriceThb: inputValue(item.vehicleCase.actualVehiclePurchasePriceThb),
    inspectionTravelThb: item.vehicleCase.inspectionQuote?.status === "Quote Ready" ? inputValue(item.vehicleCase.inspectionQuote.totalThb) : "",
    domesticTransportThb: inputValue(item.vehicleCase.domesticTransportThb),
    repairModificationThb: inputValue(item.vehicleCase.repairModificationThb),
    exportShippingThb: inputValue(item.vehicleCase.exportShippingThb),
    otherAgreedThb: inputValue(item.vehicleCase.otherAgreedThb),
    evidenceNote: "",
  };
}

export default function OwnerCaseVerificationQueue({ initialCases }: { initialCases: OwnerCaseQueueItem[] }) {
  const [items, setItems] = useState(initialCases);
  const [selectedKey, setSelectedKey] = useState(initialCases[0] ? `${initialCases[0].workspaceUserId}:${initialCases[0].vehicleCase.id}` : "");
  const selected = useMemo(() => items.find((item) => `${item.workspaceUserId}:${item.vehicleCase.id}` === selectedKey) ?? items[0], [items, selectedKey]);
  const [form, setForm] = useState<Record<keyof OwnerCaseVerificationInput, string>>(() => initialCases[0] ? initialForm(initialCases[0]) : {} as Record<keyof OwnerCaseVerificationInput, string>);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  function selectCase(item: OwnerCaseQueueItem) {
    setSelectedKey(`${item.workspaceUserId}:${item.vehicleCase.id}`);
    setForm(initialForm(item));
    setStatus("");
  }

  async function refreshQueue() {
    const response = await fetch("/api/buying-browser/owner/cases", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error || "queue_refresh_failed");
    setItems(payload.cases || []);
    const current = (payload.cases || []).find((item: OwnerCaseQueueItem) => `${item.workspaceUserId}:${item.vehicleCase.id}` === selectedKey);
    if (current) setForm(initialForm(current));
  }

  async function save() {
    if (!selected || saving) return;
    setSaving(true);
    setStatus("");
    const verification: OwnerCaseVerificationInput = {
      availability: form.availability as AvailabilityState,
      actualVehiclePurchasePriceThb: amount(form.actualVehiclePurchasePriceThb),
      inspectionTravelThb: amount(form.inspectionTravelThb),
      domesticTransportThb: amount(form.domesticTransportThb),
      repairModificationThb: amount(form.repairModificationThb),
      exportShippingThb: amount(form.exportShippingThb),
      otherAgreedThb: amount(form.otherAgreedThb),
      evidenceNote: form.evidenceNote,
    };
    try {
      const response = await fetch("/api/buying-browser/owner/cases", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceUserId: selected.workspaceUserId,
          caseId: selected.vehicleCase.id,
          expectedRevision: selected.workspaceRevision,
          verification,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (response.status === 409) {
        await refreshQueue();
        setStatus("Customer data changed while this form was open. The latest Case has been reloaded; review it before saving again.");
        return;
      }
      if (!response.ok) throw new Error(payload?.error || "case_update_failed");
      const updated = payload.case as OwnerCaseQueueItem;
      setItems((current) => current.map((item) => {
        if (item.workspaceUserId !== updated.workspaceUserId) return item;
        if (item.vehicleCase.id === updated.vehicleCase.id) return { ...updated, auditEvents: [...updated.auditEvents, ...item.auditEvents.filter((event) => !updated.auditEvents.some((newEvent) => newEvent.id === event.id))] };
        return { ...item, workspaceRevision: updated.workspaceRevision, workspaceUpdatedAt: updated.workspaceUpdatedAt };
      }));
      setForm(initialForm(updated));
      setStatus("Saved with an append-only Owner audit event. No quotation, PI, payment, purchase, or external message was issued.");
    } catch {
      setStatus("Could not save this verification. No Case data was changed.");
    } finally {
      setSaving(false);
    }
  }

  async function issueQuotation() {
    if (!selected || saving) return;
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/buying-browser/owner/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "issue_quotation", workspaceUserId: selected.workspaceUserId, caseId: selected.vehicleCase.id, expectedRevision: selected.workspaceRevision }),
      });
      const payload = await response.json().catch(() => null);
      if (response.status === 409) {
        await refreshQueue();
        setStatus("Customer data changed while this Case was open. Review the latest verified facts before issuing the quotation.");
        return;
      }
      if (!response.ok) throw new Error(payload?.error || "quotation_issue_failed");
      const updated = payload.case as OwnerCaseQueueItem;
      setItems((current) => current.map((item) => item.workspaceUserId === updated.workspaceUserId && item.vehicleCase.id === updated.vehicleCase.id ? { ...updated, auditEvents: [...updated.auditEvents, ...item.auditEvents.filter((event) => !updated.auditEvents.some((newEvent) => newEvent.id === event.id))] } : item.workspaceUserId === updated.workspaceUserId ? { ...item, workspaceRevision: updated.workspaceRevision, workspaceUpdatedAt: updated.workspaceUpdatedAt } : item));
      setStatus(`Quotation ${updated.vehicleCase.quotation?.number} issued from the verified pricing snapshot. PI and payment remain disabled.`);
    } catch {
      setStatus("Quotation was not issued. Confirm that the customer requested it and every readiness item is verified.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bb-owner-case-queue" data-owner-case-verification-queue>
      <div className="bb-section-heading">
        <div><p className="bb-kicker">Authenticated operations</p><h2>Vehicle Case verification queue</h2></div>
        <span className="bb-status-chip requested">{items.length} case{items.length === 1 ? "" : "s"}</span>
      </div>
      <p>Confirm only facts supported by current evidence. Empty cost fields remain Pending; enter 0 only when the charge is confirmed not to apply.</p>
      {!selected ? (
        <div className="bb-owner-case-empty"><FileText size={24} /><b>No signed-in customer Vehicle Cases yet</b><p>Cases will appear after a signed-in customer saves a vehicle or requests availability, inspection, or quotation review.</p></div>
      ) : (
        <div className="bb-owner-case-layout">
          <aside aria-label="Customer Vehicle Cases">
            {items.map((item) => {
              const key = `${item.workspaceUserId}:${item.vehicleCase.id}`;
              return <button className={key === `${selected.workspaceUserId}:${selected.vehicleCase.id}` ? "active" : ""} key={key} onClick={() => selectCase(item)}>
                <VehiclePhoto listing={item.vehicleCase.vehicle} />
                <span><small>{item.vehicleCase.id}</small><b>{item.vehicleCase.vehicle.title}</b><em>{item.customerEmail}</em></span>
                {item.vehicleCase.quotationRequest ? <FileText size={16} /> : <CircleDashed size={16} />}
              </button>;
            })}
          </aside>
          <div className="bb-owner-case-editor">
            <header>
              <VehiclePhoto listing={selected.vehicleCase.vehicle} />
              <div><small>{selected.vehicleCase.id}</small><h3>{selected.vehicleCase.vehicle.title}</h3><p><UserRound size={13} />{selected.customerDisplayName} · {selected.customerEmail}</p></div>
              <span className={`bb-status-chip ${selected.quotationReadiness.ready ? "market" : "pending"}`}>{selected.quotationReadiness.ready ? <CheckCircle2 size={13} /> : <CircleDashed size={13} />}{selected.quotationReadiness.status}</span>
            </header>
            <div className="bb-owner-case-fields">
              <label><span>Availability</span><select value={form.availability} onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value }))}>{availabilityOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label><span>Actual vehicle purchase price (THB)</span><input type="number" min="1" step="1" value={form.actualVehiclePurchasePriceThb} onChange={(event) => setForm((current) => ({ ...current, actualVehiclePurchasePriceThb: event.target.value }))} placeholder="Pending" /></label>
              <label><span>Inspection & travel (THB)</span><input type="number" min="0" step="1" value={form.inspectionTravelThb} onChange={(event) => setForm((current) => ({ ...current, inspectionTravelThb: event.target.value }))} placeholder="Pending" /></label>
              <label><span>Domestic transport (THB)</span><input type="number" min="0" step="1" value={form.domesticTransportThb} onChange={(event) => setForm((current) => ({ ...current, domesticTransportThb: event.target.value }))} placeholder="Pending" /></label>
              <label><span>Repair / modification (THB)</span><input type="number" min="0" step="1" value={form.repairModificationThb} onChange={(event) => setForm((current) => ({ ...current, repairModificationThb: event.target.value }))} placeholder="Pending" /></label>
              <label><span>Export / shipping (THB)</span><input type="number" min="0" step="1" value={form.exportShippingThb} onChange={(event) => setForm((current) => ({ ...current, exportShippingThb: event.target.value }))} placeholder="Pending" /></label>
              <label><span>Other agreed charges (THB)</span><input type="number" min="0" step="1" value={form.otherAgreedThb} onChange={(event) => setForm((current) => ({ ...current, otherAgreedThb: event.target.value }))} placeholder="Pending" /></label>
              <label className="wide"><span>Verification evidence / reason</span><textarea rows={3} maxLength={1000} value={form.evidenceNote} onChange={(event) => setForm((current) => ({ ...current, evidenceNote: event.target.value }))} placeholder="Example: Seller confirmed availability and current price by phone at 14:30; shipping remains pending." /></label>
            </div>
            <div className="bb-owner-case-readiness">
              <div><ShieldCheck size={18} /><span><b>{selected.quotationReadiness.pendingCount} pending readiness item{selected.quotationReadiness.pendingCount === 1 ? "" : "s"}</b><small>PI remains blocked until an approved final quotation is accepted.</small></span></div>
              <div className="bb-owner-case-commands"><button className="bb-button secondary" disabled={saving || !selected.quotationReadiness.ready || !selected.vehicleCase.quotationRequest || selected.vehicleCase.quotation?.status === "Issued - Awaiting Acceptance" || selected.vehicleCase.quotation?.status === "Accepted"} onClick={issueQuotation}><FileCheck2 size={16} />Issue quotation</button><button className="bb-button primary" disabled={saving || form.evidenceNote.trim().length < 3} onClick={save}><Save size={16} />{saving ? "Saving..." : "Save verified facts"}</button></div>
            </div>
            {status && <p className="bb-owner-case-status" role="status">{status}</p>}
            <div className="bb-owner-case-audit">
              <h4><History size={16} />Recent Owner audit</h4>
              {selected.auditEvents.length ? selected.auditEvents.slice(0, 3).map((event) => <article key={event.id}><b>{event.evidenceNote}</b><span>{formatDateTime(event.createdAt)}</span>{event.action === "owner_case_verification_updated" && <small>Vehicle price: {formatThb(event.oldValue.actualVehiclePurchasePriceThb as number | null)} → {formatThb(event.newValue.actualVehiclePurchasePriceThb as number | null)}</small>}</article>) : <p>No Owner verification event recorded yet.</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
