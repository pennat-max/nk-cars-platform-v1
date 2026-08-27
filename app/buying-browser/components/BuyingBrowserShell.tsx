"use client";

import Link from "next/link";
import { FolderKanban, Globe2, Heart, MapPin, MessageSquare, Search, UserRound } from "lucide-react";
import { customerInitials } from "../format";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { useI18n } from "../use-i18n";
import type { BuyingBrowserView, CustomerLanguage } from "../types";

const primaryNavItems = [
  { key: "browse", labelKey: "browse", href: "/buy", icon: Search },
  { key: "saved", labelKey: "saved", href: "/buy/saved", icon: Heart },
  { key: "cases", labelKey: "myCases", href: "/buy/cases", icon: FolderKanban },
  { key: "messages", labelKey: "messages", href: "/buy/messages", icon: MessageSquare },
] as const;
const mobileNavItems = [...primaryNavItems, { key: "account", labelKey: "account", href: "/buy/account", icon: UserRound }] as const;

function activeKey(view: BuyingBrowserView) {
  if (view === "source" || view === "web-browser" || view === "vehicle" || view === "paste" || view === "share" || view === "ask") return "browse";
  if (view === "case" || view === "pi") return "cases";
  if (view === "inspections") return "cases";
  return view;
}

export default function BuyingBrowserShell({ view, children }: { view: BuyingBrowserView; children: React.ReactNode }) {
  const { customer, state } = useBuyingBrowser();
  const { language, setLanguage, t } = useI18n();
  const selected = activeKey(view);
  return (
    <div className={`buying-browser view-${view}`} data-buying-browser-v1>
      <header className="bb-header">
        <div className="bb-header-inner">
          <Link className="bb-brand" href="/buy" aria-label="NK Cars Buying Browser home">
            <span>NK</span>
            <div><b>Cars</b><small>Buying Browser</small></div>
          </Link>
          <div className="bb-market-location" aria-label="Vehicle search location"><MapPin size={16} /><span><small>{t("searchArea")}</small><b>{t("bangkokMetro")}</b></span></div>
          <nav className="bb-desktop-nav" aria-label="Buying Browser navigation">
            {primaryNavItems.map((item) => { const Icon = item.icon; return <Link key={item.key} className={selected === item.key ? "active" : ""} href={item.href}><Icon size={17} />{t(item.labelKey)}</Link>; })}
          </nav>
          <label className="bb-language-selector" title={t("language")}><Globe2 size={16} /><span className="bb-sr-only">{t("language")}</span><select value={language} onChange={(event) => setLanguage(event.target.value as CustomerLanguage)} aria-label={t("language")}><option value="en">EN</option><option value="zh-CN">简体中文</option><option value="th">ไทย</option></select></label>
          <Link className="bb-account-button" href="/buy/account" aria-label="Open account"><span>{customerInitials(customer.displayName)}</span><div><b>{customer.displayName}</b><small>{customer.isPreview ? "Device account" : "NK account"}</small></div><UserRound size={17} /></Link>
        </div>
      </header>
      <main className="bb-main">{children}</main>
      <nav className="bb-bottom-nav" aria-label="Buying Browser mobile navigation">
        {mobileNavItems.map((item) => { const Icon = item.icon; const count = item.key === "saved" ? state.savedListingIds.length : item.key === "cases" ? state.cases.length : 0; return <Link key={item.key} className={selected === item.key ? "active" : ""} href={item.href}><span><Icon size={21} />{count > 0 && <i>{count > 9 ? "9+" : count}</i>}</span><b>{t(item.labelKey)}</b></Link>; })}
      </nav>
    </div>
  );
}
