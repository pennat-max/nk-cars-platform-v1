"use client";

import Link from "next/link";
import { Bot, Info, Search, Send } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { DEFAULT_FILTERS, filterListings } from "../domain.mjs";
import { formatDateTime } from "../format";
import ListingCard from "../components/ListingCard";

export default function AskScreen() {
  const { state, listings, askFindOne, sourceStatus } = useBuyingBrowser();
  const [question, setQuestion] = useState("");
  const [lastSearch, setLastSearch] = useState("");
  const matches = useMemo(() => lastSearch ? filterListings(listings, { ...DEFAULT_FILTERS, query: lastSearch }) : [], [lastSearch, listings]);

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
      <section className="bb-page-heading"><div><p className="bb-kicker">Grounded vehicle search</p><h1>Ask NK AI to Find One</h1><p>Describe the vehicle in your own words. Hard requirements remain visible and are not silently relaxed.</p></div></section>
      <section className="bb-ai-search-tool">
        <header><span><Bot size={25} /></span><div><h2>NK AI Assistant</h2><p>Searches the available customer-safe result set in this preview.</p></div></header>
        <div className="bb-ai-search-thread">{state.generalMessages.slice(-6).map((message) => <article key={message.id} className={message.sender === "Customer" ? "customer" : "assistant"}><b>{message.sender}</b><p>{message.text}</p><time>{formatDateTime(message.createdAt)}</time></article>)}</div>
        <div className="bb-prompt-chips"><button onClick={() => setQuestion("Toyota Hilux Revo 2020-2023, 4WD, AT, Double Cab, under THB 950,000")}>Revo 4WD AT</button><button onClick={() => setQuestion("Ford Ranger 2020-2022, 4WD, AT, Bangkok or Central Thailand")}>Ranger in Central</button><button onClick={() => setQuestion("Reliable Double Cab pickup under THB 700,000")}>Pickup under 700k</button></div>
        <form onSubmit={submit}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Example: Find a 2020-2022 Hilux Revo, 4WD, AT, Double Cab, under THB 950,000" aria-label="Describe the vehicle you want" /><button className="bb-button primary" type="submit"><Send size={18} />Search with NK AI</button></form>
        <p className="bb-ai-boundary"><Info size={14} />{sourceStatus.live ? "Results may use the connected authorized source adapter." : "Live source search is not connected. Results below are labeled demo data; the request remains in local preview history."}</p>
      </section>
      {lastSearch && <section className="bb-ai-results"><div className="bb-section-heading"><div><p className="bb-kicker">Customer-safe matches</p><h2>{matches.length ? `${matches.length} result${matches.length === 1 ? "" : "s"}` : "No current demo match"}</h2></div><Link href="/buy"><Search size={17} />Use full filters</Link></div>{matches.length ? <div className="bb-listing-grid">{matches.slice(0, 5).map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <div className="bb-empty-inline"><p>A real search requires an authorized source session. Your request was recorded locally and no result was invented.</p></div>}</section>}
    </>
  );
}
