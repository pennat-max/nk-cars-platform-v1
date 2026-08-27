"use client";

import { ArrowLeft, Bot, CheckCircle2, ClipboardPaste, ExternalLink, Globe2, Languages, Link2, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useI18n } from "../use-i18n";

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
  const { t } = useI18n();
  const [listingUrl, setListingUrl] = useState("");
  const [opened, setOpened] = useState(false);
  const [message, setMessage] = useState("");
  const validListingUrl = useMemo(() => facebookVehicleUrl(listingUrl), [listingUrl]);

  function openMarketplace() {
    setOpened(true);
    setMessage(t("facebookOpenedMessage"));
    window.open(MARKETPLACE_URL, "_blank", "noopener,noreferrer");
  }

  async function pasteLink() {
    try {
      const value = await navigator.clipboard.readText();
      const url = facebookVehicleUrl(value);
      if (!url) {
        setMessage(t("invalidClipboardLink"));
        return;
      }
      setListingUrl(url);
      setMessage(t("linkDetected"));
    } catch {
      setMessage(t("clipboardUnavailable"));
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validListingUrl) {
      setMessage(t("validLinkFirst"));
      return;
    }
    window.location.assign(`/buy/share?url=${encodeURIComponent(validListingUrl)}&source=web_browser_companion`);
  }

  function runAction(action: string) {
    if (!validListingUrl) {
      setMessage(t("chooseVehicleFirst"));
      return;
    }
    window.location.assign(`/buy/share?url=${encodeURIComponent(validListingUrl)}&source=web_browser_companion&action=${encodeURIComponent(action)}`);
  }

  return (
    <section className="bb-web-browser" data-web-browser-companion>
      <header className="bb-browser-chrome">
        <button type="button" aria-label={t("backToNk")} onClick={() => window.history.back()}><ArrowLeft size={19} /></button>
        <div className="bb-browser-address"><ShieldCheck size={15} /><span><small>{t("secureSource")}</small><b>facebook.com/marketplace</b></span></div>
        <button type="button" aria-label={t("reloadMarketplace")} onClick={openMarketplace}><RefreshCw size={18} /></button>
      </header>

      <div className="bb-browser-stage">
        <div className="bb-browser-source-mark"><Globe2 size={26} /><span>facebook</span></div>
        <h1>{t("browseRealMarketplace")}</h1>
        <p>{t("facebookSessionNotice")}</p>
        <button className="bb-button primary bb-browser-open" type="button" onClick={openMarketplace}>{t("openFacebookMarketplace")}<ExternalLink size={17} /></button>
        <div className={`bb-browser-session ${opened ? "active" : ""}`}>
          <span>{opened ? <CheckCircle2 size={18} /> : <Search size={18} />}</span>
          <div><b>{t(opened ? "marketplaceTabOpened" : "readyToBrowse")}</b><small>{t(opened ? "marketplaceOpenedHelp" : "facebookExternalHelp")}</small></div>
        </div>
      </div>

      <form className="bb-browser-capture" onSubmit={submit}>
        <label htmlFor="nk-browser-url"><Link2 size={17} /><input id="nk-browser-url" value={listingUrl} onChange={(event) => { setListingUrl(event.target.value); setMessage(""); }} inputMode="url" placeholder={t("pasteFacebookLink")} /></label>
        <button type="button" onClick={pasteLink} aria-label={t("pasteVehicleLink")}><ClipboardPaste size={18} /></button>
        <button className="bb-button primary" type="submit" disabled={!validListingUrl}>{t("saveToNk")}</button>
      </form>

      {message && <p className="bb-browser-message" role="status">{message}</p>}

      <nav className="bb-browser-actions" aria-label={t("nkVehicleActions")}>
        <button type="button" onClick={() => runAction("save")} disabled={!validListingUrl}><Link2 size={19} /><span>{t("saveToNk")}</span></button>
        <button type="button" onClick={() => runAction("translate")} disabled={!validListingUrl}><Languages size={19} /><span>{t("translateAction")}</span></button>
        <button type="button" onClick={() => runAction("ask_ai")} disabled={!validListingUrl}><Bot size={19} /><span>{t("askNkAi")}</span></button>
        <button type="button" onClick={() => runAction("check_car")} disabled={!validListingUrl}><CheckCircle2 size={19} /><span>{t("checkCar")}</span></button>
      </nav>
    </section>
  );
}
