"use client";

import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, ClipboardCheck, Clock3, Database, ExternalLink, FolderKanban, Gauge, Heart, Info, LockKeyhole, MessageSquare, RotateCcw, Send, ShieldCheck, UserRound, WifiOff } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { formatDateTime, formatUsdFromThb } from "../format";
import { useI18n } from "../use-i18n";
import PricingBreakdown from "../components/PricingBreakdown";
import CommercialReadiness from "../components/CommercialReadiness";
import QuotationPanel from "../components/QuotationPanel";
import ProformaInvoicePanel from "../components/ProformaInvoicePanel";
import VehiclePhoto from "../components/VehiclePhoto";

export function CasesScreen() {
  const { state } = useBuyingBrowser();
  const { t, availabilityLabel } = useI18n();
  if (!state.cases.length) return <section className="bb-empty-state"><FolderKanban size={31} /><h1>{t("noCasesTitle")}</h1><p>{t("noCasesText")}</p><Link className="bb-button primary" href="/buy">{t("browseVehicles")}</Link></section>;
  return (
    <>
      <section className="bb-page-heading"><div><p className="bb-kicker">{t("customerWorkspace")}</p><h1>{t("myCases")}</h1></div><div className="bb-case-heading-actions"><span className="bb-result-count">{t("caseCount", { count: state.cases.length })}</span><Link className="bb-button secondary" href="/buy/inspections"><ClipboardCheck size={16} />{t("inspections")}</Link></div></section>
      <section className="bb-case-list">
        {state.cases.map((item) => <Link key={item.id} href={`/buy/cases/${encodeURIComponent(item.id)}`} className="bb-case-card">
          <VehiclePhoto listing={item.vehicle} />
          <div><small>{item.id}</small><h2>{item.vehicle.title}</h2><p>{item.vehicle.generalLocation}, {t("thailand")} - {formatUsdFromThb(item.vehicle.observedPriceThb)}</p><span className={item.availability === "Availability Check Requested" ? "bb-status-chip requested" : "bb-status-chip pending"}><Clock3 size={13} />{availabilityLabel(item.availability)}</span></div>
          <strong>{item.inspectionQuote ? (item.inspectionQuote.status === "Quote Ready" ? t("inspectionQuoteReady") : t("inspectionAwaitingProvider")) : t("inspectionLocationPending")}</strong>
        </Link>)}
      </section>
    </>
  );
}

export function CaseDetailScreen({ caseId }: { caseId?: string }) {
  const { hydrated, findCaseById, requestCaseAvailability, requestCaseInspection, askCaseQuestion } = useBuyingBrowser();
  const vehicleCase = caseId ? findCaseById(caseId) : undefined;
  const [question, setQuestion] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const { language, t, availabilityLabel } = useI18n();
  if (!hydrated) return <section className="bb-loading-state"><span /><p>{t("loadingVehicleCase")}</p></section>;
  if (!vehicleCase) return <section className="bb-empty-state"><FolderKanban size={31} /><h1>{t("caseNotFound")}</h1><p>{t("caseNotFoundText")}</p><Link className="bb-button primary" href="/buy/cases"><ArrowLeft size={17} />{t("backToCases")}</Link></section>;

  function submitQuestion(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    askCaseQuestion(vehicleCase!.id, question);
    setQuestion("");
  }

  const quickQuestions = language === "zh-CN"
    ? ["这辆车还在吗？最低价格是多少？", "请说明当前价格结构和待确认费用。", "已知的规格和里程是多少？"]
    : language === "th"
      ? ["รถคันนี้ยังอยู่ไหม ราคาต่ำสุดเท่าไร?", "อธิบายโครงสร้างราคาและค่าใช้จ่ายที่รอยืนยัน", "สเป็กและเลขไมล์ที่ทราบมีอะไรบ้าง?"]
      : ["Is this vehicle still available?", "Show the current price structure and pending costs.", "What are the known specifications and mileage?"];

  return (
    <>
      <Link className="bb-back-link" href="/buy/cases"><ArrowLeft size={18} />{t("myCases")}</Link>
      <section className="bb-case-hero">
        <div className="bb-case-media"><VehiclePhoto listing={vehicleCase.vehicle} imageUrl={vehicleCase.vehicle.imageUrls[imageIndex] || vehicleCase.vehicle.imageUrls[0]} alt={`${vehicleCase.vehicle.title} case image ${imageIndex + 1}`} />{!vehicleCase.vehicle.demo && vehicleCase.vehicle.imageUrls.length > 1 && <div className="bb-case-thumbs" aria-label="Vehicle Case photos">{vehicleCase.vehicle.imageUrls.map((image, index) => <button key={index} className={index === imageIndex ? "active" : ""} onClick={() => setImageIndex(index)} aria-label={`Show case image ${index + 1}`}><VehiclePhoto listing={vehicleCase.vehicle} imageUrl={image} alt="" /></button>)}</div>}</div>
        <div><p className="bb-kicker">{vehicleCase.id}</p><h1>{vehicleCase.vehicle.title}</h1><p>{vehicleCase.vehicle.grade} · {vehicleCase.vehicle.generalLocation}, {t("thailand")}</p><div className="bb-status-row"><span className={vehicleCase.availability === "Availability Check Requested" ? "bb-status-chip requested" : "bb-status-chip pending"}><Clock3 size={13} />{availabilityLabel(vehicleCase.availability)}</span><span className="bb-status-chip market">{t("sourceVehicle")}</span></div></div>
      </section>

      <section className="bb-case-action-row" aria-label="Vehicle Case actions">
        <button disabled={vehicleCase.availability === "Availability Check Requested"} onClick={() => requestCaseAvailability(vehicleCase.id)}><Gauge size={20} /><span><b>{t("checkAvailability")}</b></span></button>
        <button disabled={!vehicleCase.inspectionQuote || vehicleCase.inspectionQuote.status === "Requested - Awaiting Provider"} onClick={() => requestCaseInspection(vehicleCase.id)}><ClipboardCheck size={20} /><span><b>{t("requestInspection")}</b><small>{vehicleCase.inspectionQuote ? formatUsdFromThb(vehicleCase.inspectionQuote.totalThb) : t("pending")}</small></span></button>
        <a href="#nk-ai-case-chat"><Bot size={20} /><span><b>{t("askNkAi")}</b></span></a>
      </section>

      <PricingBreakdown vehicleCase={vehicleCase} />
      <CommercialReadiness vehicleCase={vehicleCase} />
      <QuotationPanel vehicleCase={vehicleCase} />
      <ProformaInvoicePanel vehicleCase={vehicleCase} />

      <section className="bb-case-split">
        <div className="bb-case-facts">
          <div className="bb-section-heading"><div><p className="bb-kicker">{t("currentFacts")}</p><h2>{t("caseSummary")}</h2></div></div>
          <dl><div><dt>{t("vehiclePrice")}</dt><dd>{formatUsdFromThb(vehicleCase.vehicle.observedPriceThb)}</dd></div><div><dt>{t("priceObserved")}</dt><dd>{formatDateTime(vehicleCase.vehicle.observedAt)}</dd></div><div><dt>{t("availability")}</dt><dd>{availabilityLabel(vehicleCase.availability)}</dd></div><div><dt>{t("inspectionTravel")}</dt><dd>{vehicleCase.inspectionQuote ? `${formatUsdFromThb(vehicleCase.inspectionQuote.totalThb)} - ${vehicleCase.inspectionQuote.region}` : t("pending")}</dd></div><div><dt>{t("translation")}</dt><dd>{vehicleCase.vehicle.translationState === "Normalized" ? t("translatedFromThai") : t("needsReview")}</dd></div><div><dt>{t("lastCaseUpdate")}</dt><dd>{formatDateTime(vehicleCase.updatedAt)}</dd></div></dl>
          <p className="bb-honesty-note"><ShieldCheck size={16} />{t("customerPrivacyNote")}</p>
        </div>
        <div className="bb-case-timeline">
          <div className="bb-section-heading"><div><p className="bb-kicker">{t("auditHistory")}</p><h2>{t("caseTimeline")}</h2></div></div>
          <ol>{[...vehicleCase.timeline].reverse().map((item) => <li key={item.id}><span><CheckCircle2 size={15} /></span><div><b>{item.title}</b><p>{item.detail}</p><time>{formatDateTime(item.createdAt)}</time></div></li>)}</ol>
        </div>
      </section>

      <section className="bb-case-chat" id="nk-ai-case-chat">
        <div className="bb-section-heading"><div><p className="bb-kicker">{t("oneCustomerAssistant")}</p><h2>{t("nkAiAssistant")}</h2></div><span className="bb-status-chip market">{t("groundedPreview")}</span></div>
        <div className="bb-chat-messages">{vehicleCase.messages.map((message) => <article key={message.id} className={message.sender === "Customer" ? "customer" : "assistant"}><header><b>{message.sender}</b><small>{formatDateTime(message.createdAt)}</small></header><p>{message.text}</p><footer>{message.delivery}</footer></article>)}</div>
        <div className="bb-prompt-chips">{quickQuestions.map((prompt) => <button key={prompt} onClick={() => askCaseQuestion(vehicleCase.id, prompt)}>{prompt}</button>)}</div>
        <form onSubmit={submitQuestion}><label><Bot size={19} /><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t("askPlaceholder")} aria-label={t("askNkAi")} /></label><button type="submit" aria-label={t("sendQuestion")}><Send size={19} /></button></form>
        <p className="bb-ai-boundary"><Info size={14} />{t("aiBoundary")}</p>
      </section>
    </>
  );
}

export function InspectionsScreen() {
  const { state, requestCaseInspection } = useBuyingBrowser();
  const { t } = useI18n();
  const casesWithQuotes = state.cases.filter((item) => item.inspectionQuote);
  return (
    <>
      <section className="bb-page-heading"><div><p className="bb-kicker">{t("inspectionNetwork")}</p><h1>{t("inspectionTitle")}</h1></div></section>
      {!casesWithQuotes.length ? <section className="bb-empty-state"><ClipboardCheck size={31} /><h2>{t("pending")}</h2><Link className="bb-button primary" href="/buy">{t("browseVehicles")}</Link></section> : <section className="bb-inspection-list">{casesWithQuotes.map((item) => <article key={item.id}><VehiclePhoto listing={item.vehicle} /><div><small>{item.id}</small><h2>{item.vehicle.title}</h2><p>{item.inspectionQuote!.region}</p><dl><div><dt>{t("inspectionTravel")}</dt><dd>{formatUsdFromThb(item.inspectionQuote!.baseFeeThb)}</dd></div><div><dt>{t("travelZone")}</dt><dd>{formatUsdFromThb(item.inspectionQuote!.travelFeeThb)}</dd></div><div><dt>{t("total")}</dt><dd>{formatUsdFromThb(item.inspectionQuote!.totalThb)}</dd></div></dl><span className={item.inspectionQuote!.status.startsWith("Requested") ? "bb-status-chip requested" : "bb-status-chip market"}>{item.inspectionQuote!.status === "Quote Ready" ? t("inspectionQuoteReady") : t("inspectionAwaitingProvider")}</span></div><div className="bb-inspection-actions"><Link className="bb-button secondary" href={`/buy/cases/${encodeURIComponent(item.id)}`}>{t("openCase")}</Link><button className="bb-button primary" disabled={item.inspectionQuote!.status === "Requested - Awaiting Provider"} onClick={() => requestCaseInspection(item.id)}>{item.inspectionQuote!.status === "Requested - Awaiting Provider" ? t("pending") : t("requestInspection")}</button></div></article>)}</section>}
    </>
  );
}

export function MessagesScreen() {
  const { state } = useBuyingBrowser();
  const { t } = useI18n();
  const conversations = useMemo(() => state.cases.filter((item) => item.messages.length).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [state.cases]);
  return (
    <>
      <section className="bb-page-heading"><div><p className="bb-kicker">{t("conversationHistory")}</p><h1>{t("messagesTitle")}</h1></div><Link className="bb-button secondary" href="/buy/account"><UserRound size={17} />{t("account")}</Link></section>
      <section className="bb-general-thread"><header><Bot size={22} /><div><h2>{t("aiVehicleSearch")}</h2><p>{t("generalRequirements")}</p></div></header>{state.generalMessages.slice(-4).map((message) => <article key={message.id} className={message.sender === "Customer" ? "customer" : "assistant"}><b>{message.sender}</b><p>{message.text}</p><time>{formatDateTime(message.createdAt)}</time></article>)}<Link href="/buy/ask">{t("continueConversation")}</Link></section>
      {!conversations.length ? <section className="bb-empty-state"><MessageSquare size={30} /><h2>{t("noConversations")}</h2><p>{t("noConversationsText")}</p></section> : <section className="bb-conversation-list">{conversations.map((item) => { const last = item.messages[item.messages.length - 1]; return <Link key={item.id} href={`/buy/cases/${encodeURIComponent(item.id)}`}><VehiclePhoto listing={item.vehicle} alt="" /><div><small>{item.id}</small><h2>{item.vehicle.title}</h2><p><b>{last.sender}:</b> {last.text}</p></div><time>{formatDateTime(last.createdAt)}</time></Link>; })}</section>}
    </>
  );
}

export function AccountScreen() {
  const { customer, sourceStatus, state, workspaceSync, resetPreview } = useBuyingBrowser();
  const { t } = useI18n();
  const [confirmReset, setConfirmReset] = useState(false);

  function reset() {
    resetPreview();
    setConfirmReset(false);
  }
  return (
    <>
      <section className="bb-page-heading"><div><p className="bb-kicker">{t("nkCustomerAccount")}</p><h1>{t("account")}</h1><p>{t("accountIntro")}</p></div></section>
      <section className="bb-account-profile"><span><UserRound size={28} /></span><div><h2>{customer.displayName}</h2><p>{customer.email ?? t("localPreviewIdentity")}</p><dl><div><dt>{t("customerCountry")}</dt><dd>{customer.country}</dd></div><div><dt>{t("destinationPort")}</dt><dd>{customer.destinationPort}</dd></div><div><dt>{t("vehicleSearchArea")}</dt><dd>{t("bangkokMetro")}</dd></div></dl></div></section>
      <section className="bb-account-section"><div className="bb-section-heading"><div><p className="bb-kicker">{t("vehicleInventory")}</p><h2>{t("inventoryStorage")}</h2></div><span className={sourceStatus.live ? "bb-status-chip requested" : "bb-status-chip pending"}>{sourceStatus.live ? <Database size={13} /> : <WifiOff size={13} />}{t(sourceStatus.live ? "synchronized" : "fallbackActive")}</span></div><div className="bb-source-account-row"><div><b>{t("inventoryStorage")}</b><p>{t(sourceStatus.live ? "inventoryGroundingLive" : "inventoryGroundingFallback")}</p></div><a className="bb-button secondary" href="https://www.facebook.com/marketplace/" target="_blank" rel="noreferrer">{t("openSourceBrowser")}<ExternalLink size={16} /></a></div><p className="bb-security-note"><LockKeyhole size={16} />{t("inventoryPrivacy")}</p></section>
      <section className="bb-account-section"><div className="bb-section-heading"><div><p className="bb-kicker">{t("customerWorkspace")}</p><h2>{t(customer.isPreview ? "thisDevice" : "secureAccountData")}</h2></div><span className={`bb-status-chip ${workspaceSync.mode === "synced" ? "market" : workspaceSync.mode === "syncing" ? "requested" : "pending"}`}>{workspaceSync.mode === "synced" ? <Database size={13} /> : workspaceSync.mode === "syncing" ? <Clock3 size={13} /> : <WifiOff size={13} />}{t(workspaceSync.mode === "synced" ? "synchronized" : workspaceSync.mode === "syncing" ? "syncing" : "deviceLocal")}</span></div><p className="bb-workspace-status">{t(workspaceSync.mode === "synced" ? "workspaceSynced" : workspaceSync.mode === "syncing" ? "workspaceSyncing" : "workspaceDeviceLocal")}</p><dl className="bb-preview-stats"><div><dt>{t("savedVehicles")}</dt><dd><Heart size={17} />{state.savedListingIds.length}</dd></div><div><dt>{t("vehicleCases")}</dt><dd><FolderKanban size={17} />{state.cases.length}</dd></div><div><dt>{t("inspectionRequests")}</dt><dd><ClipboardCheck size={17} />{state.cases.filter((item) => item.inspectionQuote?.status === "Requested - Awaiting Provider").length}</dd></div></dl>{customer.isPreview && Boolean(customer.signInProviders?.length) && <div className="bb-social-sign-in" role="group" aria-label={t("signInSync")}>{customer.signInProviders!.map((option) => <Link className="bb-button secondary" href={option.path} key={option.provider}><UserRound size={17} />{t(option.provider === "google" ? "continueWithGoogle" : "continueWithApple")}</Link>)}</div>}{customer.isPreview && !customer.signInProviders?.length && customer.signInPath && <Link className="bb-button primary" href={customer.signInPath}><UserRound size={17} />{t("signInSync")}</Link>}{customer.isPreview && !customer.signInProviders?.length && !customer.signInPath && <p className="bb-security-note"><LockKeyhole size={16} />{t("accountSignInUnavailable")}</p>}{confirmReset ? <div className="bb-reset-confirm" role="group" aria-label={t("resetWorkspacePrompt")}><p>{t("resetWorkspacePrompt")}</p><div><button className="bb-button secondary" onClick={() => setConfirmReset(false)}>{t("cancel")}</button><button className="bb-button danger" onClick={reset}><RotateCcw size={17} />{t("clearWorkspaceData")}</button></div></div> : <button className="bb-button danger" onClick={() => setConfirmReset(true)}><RotateCcw size={17} />{t(customer.isPreview ? "resetDeviceData" : "resetAccountData")}</button>}</section>
      <p className="bb-honesty-note"><ShieldCheck size={16} />{t(customer.isPreview ? "anonymousDataNote" : "syncedDataNote")}</p>
    </>
  );
}
