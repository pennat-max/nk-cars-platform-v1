"use client";

/* eslint-disable @next/next/no-img-element -- Owner evidence grid uses local, lazy-loaded source snapshots. */

import Link from "next/link";
import {
  ArrowLeft,
  Database,
  ExternalLink,
  EyeOff,
  Gauge,
  LockKeyhole,
  Phone,
  Save,
  Settings2,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import VehiclePhoto from "./components/VehiclePhoto";
import { formatDateTime, formatThb } from "./format";
import { DEFAULT_PRICING_SETTINGS, loadPricingSettings, savePricingSettings, TOTAL_NK_FEE_TARGET, type PricingSettings } from "./pricing-settings";
import type { InternalSourceRecord } from "./source-adapters/demo-internal-data";
import type { BuyingBrowserState } from "./types";

type OwnerPreviewProps = {
  records: InternalSourceRecord[];
  storageCustomerId: string;
};

export default function BuyingBrowserOwnerPreview({ records, storageCustomerId }: OwnerPreviewProps) {
  const [state, setState] = useState<BuyingBrowserState | null>(null);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>({ ...DEFAULT_PRICING_SETTINGS });
  const [pricingMessage, setPricingMessage] = useState("");

  useEffect(() => {
    let nextState: BuyingBrowserState | null = null;
    try {
      const raw = window.localStorage.getItem(`nk-cars-buying-browser-v1:${storageCustomerId}`);
      if (raw) nextState = JSON.parse(raw) as BuyingBrowserState;
    } catch {
      nextState = null;
    }
    const storedPricingSettings = loadPricingSettings();
    queueMicrotask(() => {
      setState(nextState);
      setPricingSettings(storedPricingSettings);
    });
  }, [storageCustomerId]);

  function updateRate(key: keyof PricingSettings, value: string) {
    setPricingMessage("");
    setPricingSettings((current) => ({ ...current, [key]: Number(value) }));
  }

  function persistPricingSettings() {
    try {
      const saved = savePricingSettings(pricingSettings);
      setPricingSettings(saved);
      setPricingMessage("Saved. New Vehicle Cases will use these rates; existing cases keep their recorded rates.");
    } catch {
      setPricingMessage(`The two NK components must be non-negative and total ${TOTAL_NK_FEE_TARGET}%.`);
    }
  }

  const cases = state?.cases || [];
  const caseByListing = new Map(cases.map((item) => [item.listingId, item]));
  const importedListingById = new Map((state?.importedListings || []).map((item) => [item.id, item]));
  const caseByCapture = new Map(
    cases.filter((item) => item.sourceCaptureId).map((item) => [item.sourceCaptureId, item]),
  );
  const sourceCaptures = state?.sourceCaptures || [];
  const capturedRecordCount = records.filter((record) => !record.demo).length;
  const browserCaptureCount = records.filter((record) => record.adapterId === "facebook-owner-browser-capture").length;
  const demoRecordCount = records.length - capturedRecordCount;

  return (
    <div className="buying-browser bb-owner-preview" data-buying-browser-owner-preview>
      <header className="bb-owner-header">
        <Link href="/buy"><ArrowLeft size={18} />Customer preview</Link>
        <div><span>NK</span><div><b>Buying Browser</b><small>Owner / Internal Source Preview</small></div></div>
      </header>
      <main>
        <section className="bb-page-heading">
          <div>
            <p className="bb-kicker">Internal data boundary</p>
            <h1>Source & Case Control</h1>
            <p>Customer-submitted source links and internal source facts stay outside customer-facing case details.</p>
          </div>
          <span className="bb-status-chip pending"><ShieldAlert size={13} />Preview / not an auth boundary</span>
        </section>
        <div className="bb-owner-warning">
          <LockKeyhole size={18} />
          <div>
            <b>Production control required</b>
            <p>This preview can show internal source links. Production requires server-enforced Owner/Staff RBAC, tenant isolation, encrypted persistence, audit, and no client-side role switch.</p>
          </div>
        </div>
        <section className="bb-owner-pricing-settings" data-owner-pricing-settings>
          <div className="bb-section-heading"><div><p className="bb-kicker">Deterministic pricing</p><h2>NK fee settings</h2></div><Settings2 size={20} /></div>
          <p>Owner-only configuration. Customer screens show monetary amounts and service inclusions, not these percentages.</p>
          <div className="bb-owner-rate-fields">
            <label><span>Platform & Transaction component</span><input type="number" min="0" max="10" step="0.1" value={pricingSettings.platformTransactionRate} onChange={(event) => updateRate("platformTransactionRate", event.target.value)} /><b>%</b></label>
            <label><span>Buying Service component</span><input type="number" min="0" max="10" step="0.1" value={pricingSettings.buyingServiceRate} onChange={(event) => updateRate("buyingServiceRate", event.target.value)} /><b>%</b></label>
            <div><span>Total NK fee target</span><strong>{pricingSettings.platformTransactionRate + pricingSettings.buyingServiceRate}%</strong></div>
          </div>
          <button className="bb-button primary" onClick={persistPricingSettings}><Save size={16} />Save pricing settings</button>
          {pricingMessage && <small role="status">{pricingMessage}</small>}
        </section>
        <section className="bb-owner-kpis">
          <article><Database size={20} /><span><small>Real source captures</small><b>{sourceCaptures.length + capturedRecordCount}</b></span></article>
          <article><Gauge size={20} /><span><small>Selected path</small><b>External Share Link</b></span></article>
          <article><UserRound size={20} /><span><small>Preview cases</small><b>{cases.length}</b></span></article>
          <article><EyeOff size={20} /><span><small>Customer redaction</small><b>Separate DTO</b></span></article>
        </section>

        {sourceCaptures.length > 0 && (
          <section className="bb-owner-source-list bb-real-source-captures" data-real-source-captures>
            <div className="bb-section-heading">
              <div><p className="bb-kicker">External browser handoff</p><h2>Real source captures</h2></div>
              <span>{sourceCaptures.length} captured link{sourceCaptures.length === 1 ? "" : "s"}</span>
            </div>
            {sourceCaptures.map((capture) => {
              const listing = importedListingById.get(capture.listingId);
              const vehicleCase = caseByCapture.get(capture.id);
              if (!listing) return null;
              return (
                <article key={capture.id}>
                  <VehiclePhoto listing={listing} />
                  <div className="bb-owner-source-main">
                    <header>
                      <div><small>{capture.sourceReference} / {capture.sourcePlatform}</small><h3>{listing.title}</h3></div>
                      <span className={vehicleCase ? "bb-status-chip requested" : "bb-status-chip pending"}>{vehicleCase ? vehicleCase.status : "Not saved as case"}</span>
                    </header>
                    <dl>
                      <div><dt>Capture method</dt><dd>External Share / Copy Link</dd></div>
                      <div><dt>Import status</dt><dd>{capture.importStatus}</dd></div>
                      <div><dt>Captured at</dt><dd>{formatDateTime(capture.capturedAt)}</dd></div>
                      <div><dt>Canonical source</dt><dd>{capture.canonicalUrl.includes("/marketplace/item/") ? "Marketplace item URL" : "Shared Facebook URL"}</dd></div>
                      <div><dt>Customer case</dt><dd>{vehicleCase?.id || "Pending"}</dd></div>
                    </dl>
                    <p>The Facebook login session stayed outside NK. Only the submitted link and accessible listing evidence were captured.</p>
                  </div>
                  <div className="bb-owner-source-actions">
                    <a className="bb-button secondary" href={capture.canonicalUrl} target="_blank" rel="noreferrer">Internal source URL<ExternalLink size={15} /></a>
                    {vehicleCase && <Link className="bb-button primary" href={`/buy/cases/${encodeURIComponent(vehicleCase.id)}`}>Open customer case</Link>}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section className="bb-owner-source-list">
          <div className="bb-section-heading">
            <div><p className="bb-kicker">Internal records</p><h2>Source results</h2></div>
            <span>{browserCaptureCount} browser captures / {capturedRecordCount - browserCaptureCount} POC / {demoRecordCount} demo</span>
          </div>
          {records.map((record) => {
            const vehicleCase = caseByListing.get(record.id);
            return (
              <article key={record.id}>
                <VehiclePhoto listing={record} />
                <div className="bb-owner-source-main">
                  <header>
                    <div><small>{record.sourceReference} / {record.sourcePlatform}</small><h3>{record.title}</h3></div>
                    <span className={vehicleCase ? "bb-status-chip requested" : "bb-status-chip pending"}>{vehicleCase ? vehicleCase.status : record.demo ? "No customer case" : "Captured POC"}</span>
                  </header>
                  <dl>
                    <div><dt>Seller</dt><dd>{record.sellerName}</dd></div>
                    <div><dt>Seller contact</dt><dd><Phone size={13} />{record.sellerPhone}</dd></div>
                    <div><dt>Exact source location</dt><dd>{record.exactLocation}</dd></div>
                    <div><dt>Observed source price</dt><dd>{formatThb(record.observedPriceThb)}</dd></div>
                    <div><dt>Observed at</dt><dd>{formatDateTime(record.observedAt)}</dd></div>
                    <div><dt>Availability</dt><dd>{vehicleCase?.availability ?? record.availability}</dd></div>
                    {record.originalMediaCount && <div><dt>Original media</dt><dd>{record.originalMediaCount} images</dd></div>}
                  </dl>
                  <p>{record.internalNotes}</p>
                </div>
                <div className="bb-owner-source-actions">
                  <a className="bb-button secondary" href={record.sourceUrl} target="_blank" rel="noreferrer">Internal source URL<ExternalLink size={15} /></a>
                  {record.spreadsheetUrl && <a className="bb-button secondary" href={record.spreadsheetUrl} target="_blank" rel="noreferrer">Google Sheet<ExternalLink size={15} /></a>}
                  {record.evidenceFolderUrl && <a className="bb-button secondary" href={record.evidenceFolderUrl} target="_blank" rel="noreferrer">Evidence folder<ExternalLink size={15} /></a>}
                  {vehicleCase && <Link className="bb-button primary" href={`/buy/cases/${encodeURIComponent(vehicleCase.id)}`}>Open customer case</Link>}
                </div>
                {!record.demo && record.imageUrls.length > 1 && (
                  <details className="bb-owner-media-review">
                    <summary>Review all {record.imageUrls.length} captured images</summary>
                    <div>
                      {record.imageUrls.map((imageUrl, index) => (
                        <a href={imageUrl} target="_blank" rel="noreferrer" key={imageUrl}>
                          <img src={imageUrl} alt={`${record.title} evidence ${index + 1}`} loading="lazy" />
                          <span>{index + 1}</span>
                        </a>
                      ))}
                    </div>
                  </details>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
