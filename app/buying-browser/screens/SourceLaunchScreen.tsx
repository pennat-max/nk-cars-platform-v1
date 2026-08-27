"use client";

import Link from "next/link";
import { ExternalLink, Globe2, Link2, Share2, ShieldCheck, TabletSmartphone } from "lucide-react";
import { useI18n } from "../use-i18n";

export default function SourceLaunchScreen() {
  const { t } = useI18n();
  return (
    <>
      <section className="bb-page-heading">
        <div>
          <p className="bb-kicker">{t("realMarketplaceFlow")}</p>
          <h1>{t("browseFacebookSaveNk")}</h1>
          <p>{t("sourceShareIntro")}</p>
        </div>
      </section>
      <section className="bb-facebook-handoff" data-real-source-launch>
        <div><span><Globe2 size={21} /></span><div><b>{t("facebookSessionStays")}</b><p>{t("noFacebookCredentials")}</p></div></div>
        <a className="bb-button primary" href="https://www.facebook.com/marketplace/" target="_blank" rel="noreferrer">{t("openFacebookMarketplace")}<ExternalLink size={16} /></a>
        <ol>
          <li>{t("stepSearchMarketplace")}</li>
          <li>{t("stepOpenShare")}</li>
          <li>{t("stepChooseSaveNk")}</li>
        </ol>
        <div className="bb-source-safety"><Share2 size={16} /><p>{t("shareExtensionNotice")}</p></div>
      </section>
      <section className="bb-paste-tool bb-browser-entry">
        <div className="bb-section-heading"><div><p className="bb-kicker">{t("webAppCompanion")}</p><h2>{t("tryNkWebBrowser")}</h2></div><span><TabletSmartphone size={20} /></span></div>
        <p>{t("webBrowserIntro")}</p>
        <Link className="bb-button primary" href="/buy/browser">{t("openNkWebBrowser")}</Link>
      </section>
      <section className="bb-paste-tool">
        <div className="bb-section-heading"><div><p className="bb-kicker">{t("otherNkPaths")}</p><h2>{t("continueInsideNk")}</h2></div><span><ShieldCheck size={20} /></span></div>
        <div className="bb-fallback-actions">
          <Link className="bb-button secondary" href="/buy/browse">{t("browseSavedResults")}</Link>
          <Link className="bb-button secondary" href="/buy/paste"><Link2 size={17} />{t("lastResortPaste")}</Link>
        </div>
      </section>
    </>
  );
}
