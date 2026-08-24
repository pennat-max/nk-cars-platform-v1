"use client";

import Link from "next/link";
import { ClipboardCheck, FolderKanban, Heart, MapPin, MessageSquare, Search, UserRound } from "lucide-react";
import { customerInitials } from "../format";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import type { BuyingBrowserView } from "../types";

const navItems = [
  { key: "browse", label: "Browse", href: "/buy", icon: Search },
  { key: "saved", label: "Saved", href: "/buy/saved", icon: Heart },
  { key: "cases", label: "My Cases", href: "/buy/cases", icon: FolderKanban },
  { key: "inspections", label: "Inspections", href: "/buy/inspections", icon: ClipboardCheck },
  { key: "messages", label: "Messages", href: "/buy/messages", icon: MessageSquare },
] as const;

function activeKey(view: BuyingBrowserView) {
  if (view === "source" || view === "vehicle" || view === "paste" || view === "share" || view === "ask") return "browse";
  if (view === "case") return "cases";
  if (view === "account") return "messages";
  return view;
}

export default function BuyingBrowserShell({ view, children }: { view: BuyingBrowserView; children: React.ReactNode }) {
  const { customer, state } = useBuyingBrowser();
  const selected = activeKey(view);
  return (
    <div className="buying-browser" data-buying-browser-v1>
      <header className="bb-header">
        <div className="bb-header-inner">
          <Link className="bb-brand" href="/buy" aria-label="NK Cars Buying Browser home">
            <span>NK</span>
            <div><b>Cars</b><small>Buying Browser</small></div>
          </Link>
          <div className="bb-market-location" aria-label="Vehicle search location"><MapPin size={16} /><span><small>Search area</small><b>Thailand</b></span></div>
          <nav className="bb-desktop-nav" aria-label="Buying Browser navigation">
            {navItems.map((item) => { const Icon = item.icon; return <Link key={item.key} className={selected === item.key ? "active" : ""} href={item.href}><Icon size={17} />{item.label}</Link>; })}
          </nav>
          <Link className="bb-account-button" href="/buy/account" aria-label="Open account"><span>{customerInitials(customer.displayName)}</span><div><b>{customer.displayName}</b><small>{customer.isPreview ? "Preview account" : "NK account"}</small></div><UserRound size={17} /></Link>
        </div>
      </header>
      <main className="bb-main">{children}</main>
      <nav className="bb-bottom-nav" aria-label="Buying Browser mobile navigation">
        {navItems.map((item) => { const Icon = item.icon; const count = item.key === "saved" ? state.savedListingIds.length : item.key === "cases" ? state.cases.length : 0; return <Link key={item.key} className={selected === item.key ? "active" : ""} href={item.href}><span><Icon size={21} />{count > 0 && <i>{count > 9 ? "9+" : count}</i>}</span><b>{item.label}</b></Link>; })}
      </nav>
    </div>
  );
}
