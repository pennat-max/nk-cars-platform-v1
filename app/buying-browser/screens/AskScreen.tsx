"use client";

import Link from "next/link";
import { Bot, CheckCircle2, Info, Search, Send, TriangleAlert } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { formatDateTime } from "../format";
import { useI18n } from "../use-i18n";
import ListingCard from "../components/ListingCard";
import { parseWantedRequest, rankVehicleMatches } from "../vehicle-matcher.mjs";
import type { CustomerListing } from "../types";

type MatchCheck = { label: string; result: "match" | "mismatch" | "unknown" };
type MatchResult = { listing: CustomerListing; checks: MatchCheck[]; score: number; unknown: number; category: "confirmed" | "possible" | "not_match" };

export default function AskScreen() {
  const { state, listings, askFindOne, saveWantedRequest, sourceStatus } = useBuyingBrowser();
  const { language, t } = useI18n();
  const [question, setQuestion] = useState("");
  const [lastSearch, setLastSearch] = useState("");
  const [searchQueued, setSearchQueued] = useState(false);
  const request = useMemo(() => lastSearch ? parseWantedRequest(lastSearch) : null, [lastSearch]);
  const matches = useMemo<MatchResult[]>(() => request ? rankVehicleMatches(listings, request) : [], [request, listings]);
  const prompts = language === "zh-CN" ? ["寻找 2020 年以上 Toyota Hilux Revo 4WD AT 双排座，预算不超过 700,000 泰铢", "寻找 Bangkok 的 Ford Ranger AT", "寻找价格低于 600,000 泰铢的可靠双排座皮卡"] : language === "th" ? ["หา Toyota Hilux Revo ปี 2020 ขึ้นไป 4WD AT 4 ประตู งบไม่เกิน 700,000 บาท", "หา Ford Ranger เกียร์ออโต้ ในกรุงเทพ", "หารถกระบะ 4 ประตูที่เชื่อถือได้ ราคาไม่เกิน 600,000 บาท"] : ["Toyota Hilux Revo year 2020 or newer, 4WD, AT, Double Cab, under THB 700,000", "Ford Ranger AT in Bangkok", "Reliable Double Cab pickup under THB 600,000"];

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    askFindOne(trimmed);
    setLastSearch(trimmed);
    setSearchQueued(false);
    setQuestion("");
  }

  function queueSearch() {
    if (!request) return;
    saveWantedRequest(request.originalText, { ...request.must, ...request.flexible });
    askFindOne(`Vehicle search request queued for NK review: ${request.originalText}. No seller contact is authorized.`);
    setSearchQueued(true);
  }

  const criteria = request ? [
    ["Brand", request.must.brand], ["Model", request.must.model], ["Year from", request.must.yearFrom],
    ["Maximum price", request.must.priceMaxThb ? `THB ${request.must.priceMaxThb.toLocaleString("en-US")}` : null],
    ["Transmission", request.must.transmission], ["Drive", request.must.drive], ["Body / Cab", request.must.body],
    ["Flexible mileage", request.flexible.mileageMax ? `${request.flexible.mileageMax.toLocaleString("en-US")} km` : null],
  ].filter((item) => item[1]) : [];

  return (
    <>
      <section className="bb-page-heading"><div><p className="bb-kicker">{t("groundedVehicleSearch")}</p><h1>{t("askNkAi")}</h1></div></section>
      <section className="bb-ai-search-tool">
        <header><span><Bot size={25} /></span><div><h2>{t("nkAiAssistant")}</h2><p>Describe the vehicle you want. NK separates required criteria from flexible preferences and never treats unknown specifications as matches.</p></div></header>
        <div className="bb-ai-search-thread">{state.generalMessages.slice(-6).map((message) => <article key={message.id} className={message.sender === "Customer" ? "customer" : "assistant"}><b>{message.sender}</b><p>{message.text}</p><time>{formatDateTime(message.createdAt)}</time></article>)}</div>
        <div className="bb-prompt-chips">{prompts.map((prompt) => <button key={prompt} onClick={() => setQuestion(prompt)}>{prompt}</button>)}</div>
        <form onSubmit={submit}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={prompts[0]} aria-label={t("askNkAi")} /><button className="bb-button primary" type="submit"><Send size={18} />{t("askNkAi")}</button></form>
        <p className="bb-ai-boundary"><Info size={14} />{t(sourceStatus.live ? "inventoryGroundingLive" : "inventoryGroundingFallback")}</p>
      </section>

      {request && <section className="bb-wanted-request">
        <div className="bb-section-heading"><div><p className="bb-kicker">Vehicle wanted request</p><h2>Your criteria</h2></div></div>
        {criteria.length ? <div className="bb-wanted-criteria">{criteria.map(([label, value]) => <span key={String(label)}><small>{label}</small><b>{value}</b></span>)}</div> : <p>NK could not identify enough specific criteria. Add a model, year, transmission, or maximum budget.</p>}
        <p><b>Required:</b> model, year, budget, transmission, drive and body when supplied. <b>Flexible:</b> mileage preference. Missing vehicle facts stay Unknown.</p>
      </section>}

      {request && <section className="bb-ai-results"><div className="bb-section-heading"><div><p className="bb-kicker">Evidence-backed matches</p><h2>{matches.length ? `${matches.length} possible matches` : t("noApprovedMatch")}</h2></div><Link href="/buy"><Search size={17} />{t("useFullFilters")}</Link></div>
        {matches.length ? <div className="bb-ranked-matches">{matches.slice(0, 5).map((match) => <article key={match.listing.id} className="bb-ranked-match"><div className="bb-match-verdict">{match.category === "confirmed" ? <CheckCircle2 size={18} /> : <TriangleAlert size={18} />}<b>{match.category === "confirmed" ? `Confirmed match ${match.score}%` : `Possible match ${match.score}% · ${match.unknown} unknown`}</b></div><ListingCard listing={match.listing} /><ul>{match.checks.map((check) => <li key={check.label} data-result={check.result}><b>{check.label}:</b> {check.result === "match" ? "Matches" : check.result === "unknown" ? "Unknown — needs verification" : "Does not match"}</li>)}</ul></article>)}</div> : <div className="bb-empty-inline"><p>No current vehicle meets all confirmed required criteria. NK can queue this request for future sourcing without contacting sellers.</p></div>}
        <button className="bb-button primary" type="button" disabled={searchQueued || request.recognized < 2} onClick={queueSearch}>{searchQueued ? "Request recorded" : "Ask NK to keep searching"}</button>
        {searchQueued && <p className="bb-safe-note">Request recorded in your workspace. It does not authorize seller contact, reservation, negotiation, or payment.</p>}
      </section>}

      {state.wantedRequests?.length > 0 && <section className="bb-wanted-history">
        <div className="bb-section-heading"><div><p className="bb-kicker">My vehicle searches</p><h2>{state.wantedRequests.length} active request{state.wantedRequests.length === 1 ? "" : "s"}</h2></div></div>
        {state.wantedRequests.slice(0, 5).map((item) => <article key={item.id}><div><b>{item.originalText}</b><small>Request {item.id.split("-").slice(-1)[0]} · No seller contact authorized</small></div><span>{item.status === "received" ? "Request received" : item.status.replaceAll("_", " ")}</span></article>)}
      </section>}
    </>
  );
}
