"use client";

import { ArrowLeft, Bot, CheckCircle2, ClipboardPaste, ExternalLink, Globe2, Languages, Link2, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

const MARKETPLACE_URL = "https://www.facebook.com/marketplace/";

function facebookVehicleUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (url.protocol !== "https:" || (host !== "facebook.com" && !host.endsWith(".facebook.com"))) return "";
    return url.href;
  } catch {
    return "";
  }
}

export default function WebBrowserScreen() {
  const [listingUrl, setListingUrl] = useState("");
  const [opened, setOpened] = useState(false);
  const [message, setMessage] = useState("");
  const validListingUrl = useMemo(() => facebookVehicleUrl(listingUrl), [listingUrl]);

  function openMarketplace() {
    setOpened(true);
    setMessage("Facebook opened in its own secure tab. Return here after copying or sharing the vehicle link.");
    window.open(MARKETPLACE_URL, "_blank", "noopener,noreferrer");
  }

  async function pasteLink() {
    try {
      const value = await navigator.clipboard.readText();
      const url = facebookVehicleUrl(value);
      if (!url) {
        setMessage("Clipboard does not contain a valid HTTPS Facebook vehicle link.");
        return;
      }
      setListingUrl(url);
      setMessage("Vehicle link detected. Save it to NK when ready.");
    } catch {
      setMessage("Clipboard access is unavailable. Paste the vehicle link into the address field.");
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validListingUrl) {
      setMessage("Paste a valid HTTPS Facebook vehicle link first.");
      return;
    }
    window.location.assign(`/buy/share?url=${encodeURIComponent(validListingUrl)}&source=web_browser_companion`);
  }

  function runAction(action: string) {
    if (!validListingUrl) {
      setMessage("Open a vehicle in Facebook, copy its link, then return and paste it here.");
      return;
    }
    window.location.assign(`/buy/share?url=${encodeURIComponent(validListingUrl)}&source=web_browser_companion&action=${encodeURIComponent(action)}`);
  }

  return (
    <section className="bb-web-browser" data-web-browser-companion>
      <header className="bb-browser-chrome">
        <button type="button" aria-label="Back to NK Cars" onClick={() => window.history.back()}><ArrowLeft size={19} /></button>
        <div className="bb-browser-address"><ShieldCheck size={15} /><span><small>Secure source</small><b>facebook.com/marketplace</b></span></div>
        <button type="button" aria-label="Reload Facebook Marketplace" onClick={openMarketplace}><RefreshCw size={18} /></button>
      </header>

      <div className="bb-browser-stage">
        <div className="bb-browser-source-mark"><Globe2 size={26} /><span>facebook</span></div>
        <h1>Browse the real Marketplace</h1>
        <p>Facebook opens using your own account and session. NK cannot read your password, cookies, MFA, CAPTCHA, searches, or other Facebook activity.</p>
        <button className="bb-button primary bb-browser-open" type="button" onClick={openMarketplace}>Open Facebook Marketplace<ExternalLink size={17} /></button>
        <div className={`bb-browser-session ${opened ? "active" : ""}`}>
          <span>{opened ? <CheckCircle2 size={18} /> : <Search size={18} />}</span>
          <div><b>{opened ? "Marketplace tab opened" : "Ready to browse"}</b><small>{opened ? "Search normally, open a vehicle, then Copy Link or Share back to NK." : "Facebook remains outside the web app because Facebook blocks embedded web pages."}</small></div>
        </div>
      </div>

      <form className="bb-browser-capture" onSubmit={submit}>
        <label htmlFor="nk-browser-url"><Link2 size={17} /><input id="nk-browser-url" value={listingUrl} onChange={(event) => { setListingUrl(event.target.value); setMessage(""); }} inputMode="url" placeholder="Paste Facebook vehicle link" /></label>
        <button type="button" onClick={pasteLink} aria-label="Paste vehicle link from clipboard"><ClipboardPaste size={18} /></button>
        <button className="bb-button primary" type="submit" disabled={!validListingUrl}>Save to NK</button>
      </form>

      {message && <p className="bb-browser-message" role="status">{message}</p>}

      <nav className="bb-browser-actions" aria-label="NK vehicle actions">
        <button type="button" onClick={() => runAction("save")} disabled={!validListingUrl}><Link2 size={19} /><span>Save to NK</span></button>
        <button type="button" onClick={() => runAction("translate")} disabled={!validListingUrl}><Languages size={19} /><span>Translate</span></button>
        <button type="button" onClick={() => runAction("ask_ai")} disabled={!validListingUrl}><Bot size={19} /><span>Ask NK AI</span></button>
        <button type="button" onClick={() => runAction("check_car")} disabled={!validListingUrl}><CheckCircle2 size={19} /><span>Check Car</span></button>
      </nav>
    </section>
  );
}
