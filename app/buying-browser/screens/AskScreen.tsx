"use client";

import Link from "next/link";
import { Bot, Info, Search, Send } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { DEFAULT_FILTERS, filterListings } from "../domain.mjs";
import { formatDateTime } from "../format";
import { useI18n } from "../use-i18n";
import ListingCard from "../components/ListingCard";

export default function AskScreen() {
  const { state, listings, askFindOne, sourceStatus } = useBuyingBrowser();
  const { language, t } = useI18n();
  const [question, setQuestion] = useState("");
  const [lastSearch, setLastSearch] = useState("");
  const matches = useMemo(() => lastSearch ? filterListings(listings, { ...DEFAULT_FILTERS, query: lastSearch }) : [], [lastSearch, listings]);
  const prompts = language === "zh-CN" ? ["寻找 2020-2023 Toyota Hilux Revo 4WD AT 双排座", "寻找 Bangkok 或泰国中部的 Ford Ranger", "寻找价格低于 USD 20,000 的可靠双排座皮卡"] : language === "th" ? ["หา Toyota Hilux Revo ปี 2020-2023 4WD AT Double Cab", "หา Ford Ranger ในกรุงเทพหรือภาคกลาง", "หารถกระบะ Double Cab ที่เชื่อถือได้ต่ำกว่า USD 20,000"] : ["Toyota Hilux Revo 2020-2023, 4WD, AT, Double Cab, under USD 27,200", "Ford Ranger 2020-2022, 4WD, AT, Bangkok or Central Thailand", "Reliable Double Cab pickup under USD 20,000"];

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    askFindOne(trimmed);
    const keyTerms = trimmed.match(/(?:toyota|hilux|revo|vigo|ford|ranger|isuzu|d-max|mitsubishi|triton|nissan|navara|bangkok|rayong|chiang mai|khon kaen|4wd|2wd)/gi)?.join(" ") || trimmed;
    setLastSearch(keyTerms);
    setQuestion("");
  }

  return (
    <>
      <section className="bb-page-heading"><div><p className="bb-kicker">Grounded vehicle search</p><h1>{t("askNkAi")}</h1></div></section>
      <section className="bb-ai-search-tool">
        <header><span><Bot size={25} /></span><div><h2>{t("nkAiAssistant")}</h2></div></header>
        <div className="bb-ai-search-thread">{state.generalMessages.slice(-6).map((message) => <article key={message.id} className={message.sender === "Customer" ? "customer" : "assistant"}><b>{message.sender}</b><p>{message.text}</p><time>{formatDateTime(message.createdAt)}</time></article>)}</div>
        <div className="bb-prompt-chips">{prompts.map((prompt) => <button key={prompt} onClick={() => setQuestion(prompt)}>{prompt}</button>)}</div>
        <form onSubmit={submit}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={prompts[0]} aria-label={t("askNkAi")} /><button className="bb-button primary" type="submit"><Send size={18} />{t("askNkAi")}</button></form>
        <p className="bb-ai-boundary"><Info size={14} />{t(sourceStatus.live ? "inventoryGroundingLive" : "inventoryGroundingFallback")}</p>
      </section>
      {lastSearch && <section className="bb-ai-results"><div className="bb-section-heading"><div><p className="bb-kicker">Customer-safe matches</p><h2>{matches.length ? `${matches.length} result${matches.length === 1 ? "" : "s"}` : "No current approved match"}</h2></div><Link href="/buy"><Search size={17} />Use full filters</Link></div>{matches.length ? <div className="bb-listing-grid">{matches.slice(0, 5).map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <div className="bb-empty-inline"><p>No approved staged vehicle matches this request. The request was recorded locally and no result was invented.</p></div>}</section>}
    </>
  );
}
