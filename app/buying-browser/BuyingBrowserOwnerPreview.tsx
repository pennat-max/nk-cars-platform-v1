"use client";

import Link from "next/link";
import { ArrowLeft, Database, ExternalLink, EyeOff, Gauge, LockKeyhole, Phone, ShieldAlert, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDateTime, formatThb } from "./format";
import type { BuyingBrowserState } from "./types";
import type { DemoInternalSourceRecord } from "./source-adapters/demo-internal-data";
import VehiclePhoto from "./components/VehiclePhoto";

export default function BuyingBrowserOwnerPreview({ records, storageCustomerId }: { records: DemoInternalSourceRecord[]; storageCustomerId: string }) {
  const [state, setState] = useState<BuyingBrowserState | null>(null);
  useEffect(() => {
    let nextState: BuyingBrowserState | null = null;
    try {
      const raw = window.localStorage.getItem(`nk-cars-buying-browser-v1:${storageCustomerId}`);
      if (raw) nextState = JSON.parse(raw) as BuyingBrowserState;
    } catch { nextState = null; }
    queueMicrotask(() => setState(nextState));
  }, [storageCustomerId]);
  const caseByListing = new Map((state?.cases || []).map((item) => [item.listingId, item]));
  return (
    <div className="buying-browser bb-owner-preview" data-buying-browser-owner-preview>
      <header className="bb-owner-header"><Link href="/buy"><ArrowLeft size={18} />Customer preview</Link><div><span>NK</span><div><b>Buying Browser</b><small>Owner / Internal Source Preview</small></div></div></header>
      <main>
        <section className="bb-page-heading"><div><p className="bb-kicker">Internal data boundary</p><h1>Source & Case Control</h1><p>Demo source facts are visible here but excluded from customer DTOs and customer routes.</p></div><span className="bb-status-chip pending"><ShieldAlert size={13} />Demo · not an auth boundary</span></section>
        <div className="bb-owner-warning"><LockKeyhole size={18} /><div><b>Production control required</b><p>This route contains demo data only. Real source/seller records require server-enforced Owner/Staff RBAC, tenant isolation, audit, and no client-side role switch.</p></div></div>
        <section className="bb-owner-kpis"><article><Database size={20} /><span><small>Source adapter</small><b>demo-thai-market</b></span></article><article><Gauge size={20} /><span><small>Adapter state</small><b>Fallback Ready</b></span></article><article><UserRound size={20} /><span><small>Preview cases</small><b>{state?.cases.length ?? 0}</b></span></article><article><EyeOff size={20} /><span><small>Customer redaction</small><b>Separate DTO</b></span></article></section>
        <section className="bb-owner-source-list">
          <div className="bb-section-heading"><div><p className="bb-kicker">Internal records</p><h2>Source results</h2></div><span>{records.length} demo records</span></div>
          {records.map((record) => { const vehicleCase = caseByListing.get(record.id); return <article key={record.id}>
            <VehiclePhoto listing={record} />
            <div className="bb-owner-source-main"><header><div><small>{record.sourceReference} · {record.sourcePlatform}</small><h3>{record.title}</h3></div><span className={vehicleCase ? "bb-status-chip requested" : "bb-status-chip pending"}>{vehicleCase ? vehicleCase.status : "No customer case"}</span></header><dl><div><dt>Seller</dt><dd>{record.sellerName}</dd></div><div><dt>Seller contact</dt><dd><Phone size={13} />{record.sellerPhone}</dd></div><div><dt>Exact source location</dt><dd>{record.exactLocation}</dd></div><div><dt>Observed source price</dt><dd>{formatThb(record.observedPriceThb)}</dd></div><div><dt>Observed at</dt><dd>{formatDateTime(record.observedAt)}</dd></div><div><dt>Availability</dt><dd>{vehicleCase?.availability ?? record.availability}</dd></div></dl><p>{record.internalNotes}</p></div>
            <div className="bb-owner-source-actions"><a className="bb-button secondary" href={record.sourceUrl} target="_blank" rel="noreferrer">Internal source URL<ExternalLink size={15} /></a>{vehicleCase && <Link className="bb-button primary" href={`/buy/cases/${encodeURIComponent(vehicleCase.id)}`}>Open customer case</Link>}</div>
          </article>; })}
        </section>
      </main>
    </div>
  );
}
