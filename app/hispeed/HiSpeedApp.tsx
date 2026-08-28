"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, FolderKanban, Gauge, Globe2, Heart, MapPin, MessageCircle, Search, ShieldCheck, Ship, SlidersHorizontal, UserRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useBuyingBrowser } from "../buying-browser/BuyingBrowserProvider";
import { calculatePricing, DEFAULT_FILTERS, filterListings, SHIPPING_DESTINATIONS, shippingPlanForSelection } from "../buying-browser/domain.mjs";
import { CUSTOMER_FX_THB_PER_USD, customerUsdInputToThb, formatDateTime, formatMileage, formatThb, formatUsdFromThb } from "../buying-browser/format";
import ProformaInvoicePanel from "../buying-browser/components/ProformaInvoicePanel";
import QuotationPanel from "../buying-browser/components/QuotationPanel";
import VehiclePhoto from "../buying-browser/components/VehiclePhoto";
import type { BrowseFilters, BuyingBrowserView, CustomerLanguage, CustomerListing, VehicleCase } from "../buying-browser/types";

type Copy = {
  nav: string[];
  logoLine: string;
  searchArea: string;
  language: string;
  heroTitle: string;
  heroSub: string;
  heroCta: string;
  searchPlaceholder: string;
  filters: string;
  verified: string;
  allThailand: string;
  bangkokMetro: string;
  price: string;
  year: string;
  location: string;
  transmission: string;
  mileage: string;
  any: string;
  save: string;
  saved: string;
  checkAvailability: string;
  ask: string;
  inspected: string;
  lastChecked: string;
  detail: string;
  keySpecs: string;
  priceDetail: string;
  shipping: string;
  shippingTitle: string;
  shippingSub: string;
  how: string[];
  trust: string[];
  emptySaved: string;
  shortlist: string;
  compare: string;
  addShipment: string;
  destination: string;
  quantity: string;
  chooseCountry: string;
  planning: string;
  perVehicle: string;
  savings: string;
  route: string;
  inland: string;
  requestQuote: string;
  cases: string;
  account: string;
  noCases: string;
  timeline: string;
  selected: string;
  quotePi: string;
  accountIntro: string;
};

const copy: Record<CustomerLanguage, Copy> = {
  "zh-CN": {
    nav: ["车辆", "收藏", "运输", "订单", "账户"],
    logoLine: "泰国车辆出口",
    searchArea: "泰国采购",
    language: "语言",
    heroTitle: "从泰国采购优质车辆",
    heroSub: "安全 · 透明 · 省心",
    heroCta: "查看已审核车辆",
    searchPlaceholder: "搜索品牌、车型、年份、地点",
    filters: "筛选",
    verified: "已审核车辆",
    allThailand: "泰国全境",
    bangkokMetro: "曼谷都会区",
    price: "价格",
    year: "年份",
    location: "地点",
    transmission: "变速箱",
    mileage: "里程",
    any: "不限",
    save: "收藏",
    saved: "已收藏",
    checkAvailability: "确认车辆是否可购买",
    ask: "咨询 HiSpeed",
    inspected: "已审核",
    lastChecked: "最后检查",
    detail: "车辆详情",
    keySpecs: "核心规格",
    priceDetail: "透明价格明细",
    shipping: "运输",
    shippingTitle: "拼箱运输更省",
    shippingSub: "一次运输 2–3 台车辆，降低每台运输成本",
    how: ["选择车辆", "确认车况与库存", "验车", "规划运输", "获取报价", "确认报价 / PI", "后续采购与出口"],
    trust: ["客户展示层不会显示卖家联系方式", "费用使用已配置规则", "库存状态来自同一后端"],
    emptySaved: "还没有收藏车辆",
    shortlist: "采购清单",
    compare: "对比",
    addShipment: "加入运输",
    destination: "目的地",
    quantity: "车辆数量",
    chooseCountry: "选择国家",
    planning: "Planning Estimate",
    perVehicle: "Estimated per vehicle",
    savings: "Savings per vehicle",
    route: "Route",
    inland: "内陆目的地费用未包含",
    requestQuote: "Request quote",
    cases: "我的订单",
    account: "账户",
    noCases: "还没有订单记录",
    timeline: "订单进度",
    selected: "已选择车辆",
    quotePi: "报价 / PI",
    accountIntro: "HiSpeed 客户来源会标记为 hispeed，车辆与 NK Cars 使用同一底层车辆身份。",
  },
  en: {
    nav: ["Vehicles", "Saved", "Shipping", "Cases", "Account"],
    logoLine: "Thailand vehicle export",
    searchArea: "Thailand sourcing",
    language: "Language",
    heroTitle: "Source quality vehicles from Thailand",
    heroSub: "Safe · Transparent · Simple",
    heroCta: "Browse verified vehicles",
    searchPlaceholder: "Search make, model, year, location",
    filters: "Filters",
    verified: "reviewed vehicles",
    allThailand: "All Thailand",
    bangkokMetro: "Bangkok Metro",
    price: "Price",
    year: "Year",
    location: "Location",
    transmission: "Transmission",
    mileage: "Mileage",
    any: "Any",
    save: "Save",
    saved: "Saved",
    checkAvailability: "Check Availability",
    ask: "Ask HiSpeed",
    inspected: "Reviewed",
    lastChecked: "Last checked",
    detail: "Vehicle detail",
    keySpecs: "Key specs",
    priceDetail: "Transparent price detail",
    shipping: "Shipping",
    shippingTitle: "Consolidate 2–3 cars to save",
    shippingSub: "Share one shipment and lower the estimated cost per vehicle.",
    how: ["Choose vehicles", "Confirm stock and condition", "Inspect", "Plan shipping", "Request quote", "Accept quote / PI", "Purchase and export later"],
    trust: ["Seller contact stays private", "Costs use configured rules", "Inventory status comes from the shared backend"],
    emptySaved: "No saved vehicles yet",
    shortlist: "Purchasing shortlist",
    compare: "Compare",
    addShipment: "Add to shipment",
    destination: "Destination",
    quantity: "Cars",
    chooseCountry: "Choose country",
    planning: "Planning Estimate",
    perVehicle: "Estimated per vehicle",
    savings: "Savings per vehicle",
    route: "Route",
    inland: "Inland destination cost not included",
    requestQuote: "Request quote",
    cases: "My cases",
    account: "Account",
    noCases: "No cases yet",
    timeline: "Order timeline",
    selected: "Vehicle selected",
    quotePi: "Quote / PI",
    accountIntro: "HiSpeed customer activity is marked as hispeed while vehicles keep the shared NK identity.",
  },
  th: {
    nav: ["รถ", "บันทึก", "ขนส่ง", "เคส", "บัญชี"],
    logoLine: "ส่งออกรถจากไทย",
    searchArea: "จัดหารถในไทย",
    language: "ภาษา",
    heroTitle: "จัดหารถคุณภาพจากประเทศไทย",
    heroSub: "ปลอดภัย · โปร่งใส · สะดวก",
    heroCta: "ดูรถที่ตรวจแล้ว",
    searchPlaceholder: "ค้นหายี่ห้อ รุ่น ปี พื้นที่",
    filters: "ตัวกรอง",
    verified: "รถที่ตรวจแล้ว",
    allThailand: "ทั่วไทย",
    bangkokMetro: "กรุงเทพฯ และปริมณฑล",
    price: "ราคา",
    year: "ปี",
    location: "พื้นที่",
    transmission: "เกียร์",
    mileage: "เลขไมล์",
    any: "ทั้งหมด",
    save: "บันทึก",
    saved: "บันทึกแล้ว",
    checkAvailability: "เช็คว่ารถยังซื้อได้ไหม",
    ask: "ปรึกษา HiSpeed",
    inspected: "ตรวจแล้ว",
    lastChecked: "ตรวจล่าสุด",
    detail: "รายละเอียดรถ",
    keySpecs: "สเปกสำคัญ",
    priceDetail: "รายละเอียดราคาโปร่งใส",
    shipping: "ขนส่ง",
    shippingTitle: "รวมส่ง 2–3 คันคุ้มกว่า",
    shippingSub: "แชร์ค่าระวางในรอบเดียว เพื่อลดต้นทุนต่อคัน",
    how: ["เลือกรถ", "ยืนยันสภาพและสต็อก", "ตรวจรถ", "วางแผนขนส่ง", "ขอใบเสนอราคา", "ยืนยันใบเสนอราคา / PI", "จัดซื้อและส่งออกภายหลัง"],
    trust: ["ไม่แสดงข้อมูลติดต่อผู้ขาย", "ค่าใช้จ่ายใช้กฎที่ตั้งค่าไว้", "สถานะรถมาจาก backend ชุดเดียวกัน"],
    emptySaved: "ยังไม่มีรถที่บันทึกไว้",
    shortlist: "รายการจัดซื้อ",
    compare: "เปรียบเทียบ",
    addShipment: "เพิ่มเข้าขนส่ง",
    destination: "ปลายทาง",
    quantity: "จำนวนรถ",
    chooseCountry: "เลือกประเทศ",
    planning: "Planning Estimate",
    perVehicle: "Estimated per vehicle",
    savings: "Savings per vehicle",
    route: "Route",
    inland: "ยังไม่รวมค่าขนส่งปลายทางในประเทศ",
    requestQuote: "ขอใบเสนอราคา",
    cases: "เคสของฉัน",
    account: "บัญชี",
    noCases: "ยังไม่มีเคส",
    timeline: "ไทม์ไลน์คำสั่งซื้อ",
    selected: "เลือกรถแล้ว",
    quotePi: "ใบเสนอราคา / PI",
    accountIntro: "กิจกรรมลูกค้า HiSpeed จะถูกระบุเป็น hispeed โดยรถยังใช้ identity เดียวกับ NK Cars",
  },
};

const navItems = [
  { view: "browse", href: "/hispeed", icon: Search },
  { view: "saved", href: "/hispeed/saved", icon: Heart },
  { view: "shipments", href: "/hispeed/shipments", icon: Ship },
  { view: "cases", href: "/hispeed/cases", icon: FolderKanban },
  { view: "account", href: "/hispeed/account", icon: UserRound },
] as const;

function activeView(view: BuyingBrowserView) {
  if (view === "vehicle") return "browse";
  if (view === "case" || view === "pi") return "cases";
  return view;
}

function useCopy() {
  const { language } = useBuyingBrowser();
  return copy[language];
}

function usd(value: number | null | undefined) {
  return value === null || value === undefined ? "Pending" : `USD ${value.toLocaleString("en-US")}`;
}

function HiSpeedShell({ view, children }: { view: BuyingBrowserView; children: React.ReactNode }) {
  const { language, setLanguage, state } = useBuyingBrowser();
  const text = useCopy();
  const selected = activeView(view);
  return (
    <div className={`hispeed hs-view-${view}`} data-hispeed-preview-v1 data-buying-browser-v1>
      <header className="hs-header">
        <Link className="hs-brand" href="/hispeed" aria-label="HiSpeed home"><span>Hi</span><div><b>HiSpeed</b><small>{text.logoLine}</small></div></Link>
        <div className="hs-search-area"><MapPin size={16} /><span>{text.searchArea}</span></div>
        <nav className="hs-desktop-nav" aria-label="HiSpeed navigation">{navItems.slice(0, 4).map((item, index) => { const Icon = item.icon; return <Link key={item.href} className={selected === item.view ? "active" : ""} href={item.href}><Icon size={17} />{text.nav[index]}</Link>; })}</nav>
        <label className="hs-lang" title={text.language}><Globe2 size={16} /><select value={language} onChange={(event) => setLanguage(event.target.value as CustomerLanguage)} aria-label={text.language}><option value="zh-CN">中文</option><option value="en">EN</option><option value="th">ไทย</option></select></label>
      </header>
      <main className="hs-main">{children}</main>
      <nav className="hs-bottom-nav" aria-label="HiSpeed mobile navigation">{navItems.map((item, index) => { const Icon = item.icon; const count = item.view === "saved" ? state.savedListingIds.length : item.view === "cases" ? state.cases.length : 0; return <Link key={item.href} className={selected === item.view ? "active" : ""} href={item.href}><span><Icon size={20} />{count > 0 && <i>{count > 9 ? "9+" : count}</i>}</span><b>{text.nav[index]}</b></Link>; })}</nav>
    </div>
  );
}

function SearchControls({ filters, setFilter }: { filters: BrowseFilters; setFilter: <K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) => void }) {
  const text = useCopy();
  const locationOptions = ["Bangkok Metro", "All Thailand", "Bangkok", "Nonthaburi", "Pathum Thani", "Samut Prakan", "Chon Buri"];
  return (
    <section className="hs-filter-row" aria-label="HiSpeed vehicle search">
      <label className="hs-search"><Search size={19} /><input value={filters.query} onChange={(event) => setFilter("query", event.target.value)} placeholder={text.searchPlaceholder} /></label>
      <label><span>{text.location}</span><select value={filters.location} onChange={(event) => setFilter("location", event.target.value)}>{locationOptions.map((location) => <option key={location} value={location}>{location === "Bangkok Metro" ? text.bangkokMetro : location === "All Thailand" ? text.allThailand : location}</option>)}</select></label>
      <label><span>{text.year}</span><select value={filters.yearFrom} onChange={(event) => setFilter("yearFrom", event.target.value)}>{["", "2020", "2021", "2022", "2023", "2024", "2025"].map((year) => <option key={year || "any"} value={year}>{year || text.any}</option>)}</select></label>
      <label><span>{text.price}</span><input inputMode="numeric" value={filters.priceMax} onChange={(event) => setFilter("priceMax", event.target.value.replace(/\D/g, ""))} placeholder="USD max" /></label>
      <button type="button"><SlidersHorizontal size={18} />{text.filters}</button>
    </section>
  );
}

function HiSpeedVehicleCard({ listing, selectable = false, selected = false, onSelect }: { listing: CustomerListing; selectable?: boolean; selected?: boolean; onSelect?: (id: string) => void }) {
  const { isSaved, toggleSaved } = useBuyingBrowser();
  const text = useCopy();
  const saved = isSaved(listing.id);
  return (
    <article className="hs-card" data-hispeed-vehicle-card data-listing-id={listing.id}>
      {selectable && <label className="hs-select"><input type="checkbox" checked={selected} onChange={() => onSelect?.(listing.id)} /><span /></label>}
      <Link className="hs-card-image" href={`/hispeed/vehicles/${encodeURIComponent(listing.id)}`}><VehiclePhoto listing={listing} /><em>{text.inspected}</em></Link>
      <button className={saved ? "hs-heart saved" : "hs-heart"} onClick={() => toggleSaved(listing.id)} aria-label={saved ? text.saved : text.save}><Heart size={20} fill={saved ? "currentColor" : "none"} /></button>
      <Link className="hs-card-copy" href={`/hispeed/vehicles/${encodeURIComponent(listing.id)}`}>
        <strong>{formatThb(listing.observedPriceThb)}</strong>
        <h2>{listing.year ?? text.year} {listing.brand} {listing.model}</h2>
        <p>{listing.transmission} · {formatMileage(listing.mileageKm)}</p>
        <footer><span><MapPin size={13} />{listing.generalLocation}</span><span><CheckCircle2 size={13} />{listing.availability === "Verified Available" ? "Verified" : "Check"}</span></footer>
      </Link>
    </article>
  );
}

function BrowseScreen({ savedOnly = false }: { savedOnly?: boolean }) {
  const { listings, state, saveAsCase } = useBuyingBrowser();
  const [filters, setFilters] = useState<BrowseFilters>({ ...DEFAULT_FILTERS });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const text = useCopy();
  const sourceListings = savedOnly ? listings.filter((item) => state.savedListingIds.includes(item.id)) : listings;
  const domainFilters = useMemo(() => ({ ...filters, priceMin: customerUsdInputToThb(filters.priceMin), priceMax: customerUsdInputToThb(filters.priceMax) }), [filters]);
  const visibleListings = useMemo(() => filterListings(sourceListings, domainFilters), [domainFilters, sourceListings]);
  function setFilter<K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }
  function addSelectedToShipment() {
    for (const listing of visibleListings.filter((item) => selectedIds.includes(item.id)).slice(0, 3)) saveAsCase(listing);
    window.setTimeout(() => window.location.assign("/hispeed/shipments"), 80);
  }
  return (
    <>
      {!savedOnly && <section className="hs-hero"><div><span>HiSpeed Export Marketplace</span><h1>{text.heroTitle}</h1><p>{text.heroSub}</p><a href="#hispeed-vehicles">{text.heroCta}</a></div><div className="hs-hero-stats"><b>{visibleListings.length}</b><span>{text.verified}</span><strong>THB 35 = USD 1</strong></div></section>}
      {savedOnly && <section className="hs-page-title"><div><span>{text.shortlist}</span><h1>{text.saved}</h1></div><button className="hs-primary" disabled={!selectedIds.length} onClick={addSelectedToShipment}><Ship size={18} />{text.addShipment}</button></section>}
      <SearchControls filters={filters} setFilter={setFilter} />
      {savedOnly && <section className="hs-shortlist"><b>{selectedIds.length} selected</b><button disabled={selectedIds.length < 2}>{text.compare}</button><button disabled={!selectedIds.length} onClick={addSelectedToShipment}>{text.addShipment}</button></section>}
      {!savedOnly && <section className="hs-commerce-band"><article><ShieldCheck size={22} /><b>{text.trust[0]}</b></article><article><Gauge size={22} /><b>{text.trust[1]}</b></article><article><CheckCircle2 size={22} /><b>{text.trust[2]}</b></article></section>}
      <section id="hispeed-vehicles" className="hs-grid" aria-label="HiSpeed vehicles">{visibleListings.length ? visibleListings.map((listing) => <HiSpeedVehicleCard key={listing.id} listing={listing} selectable={savedOnly} selected={selectedIds.includes(listing.id)} onSelect={(id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} />) : <div className="hs-empty">{savedOnly ? text.emptySaved : "No matches"}</div>}</section>
      {!savedOnly && <section className="hs-how"><h2>How it works</h2><ol>{text.how.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol></section>}
    </>
  );
}

function VehicleDetailScreen({ sourceId }: { sourceId?: string }) {
  const { listings, isSaved, toggleSaved, saveAsCase } = useBuyingBrowser();
  const [imageIndex, setImageIndex] = useState(0);
  const text = useCopy();
  const listing = listings.find((item) => item.id === sourceId);
  if (!listing) return <section className="hs-empty"><h1>Vehicle not found</h1><Link className="hs-primary" href="/hispeed"><ArrowLeft size={18} />Back</Link></section>;
  const pricing = calculatePricing({ vehiclePriceThb: listing.observedPriceThb, platformTransactionRate: 6, buyingServiceRate: 4, inspectionTravelThb: null, domesticTransportThb: null, repairModificationThb: null, exportShippingThb: null, containerLoadingFeeThb: null, otherAgreedThb: null });
  function openCase(action?: "availability" | "inspection") {
    const caseId = saveAsCase(listing!, action);
    window.location.assign(`/hispeed/cases/${encodeURIComponent(caseId)}`);
  }
  return (
    <>
      <Link className="hs-back" href="/hispeed"><ArrowLeft size={18} />{text.nav[0]}</Link>
      <article className="hs-detail" data-hispeed-vehicle-detail>
        <section className="hs-gallery">
          <VehiclePhoto listing={listing} imageUrl={listing.imageUrls[imageIndex]} />
          <div>{listing.imageUrls.slice(0, 8).map((image, index) => <button key={image} className={index === imageIndex ? "active" : ""} onClick={() => setImageIndex(index)}><VehiclePhoto listing={listing} imageUrl={image} alt="" /></button>)}</div>
        </section>
        <section className="hs-detail-summary">
          <span className="hs-chip"><CheckCircle2 size={14} />{text.inspected}</span>
          <h1>{listing.title}</h1>
          <p>{listing.grade} · {listing.color}</p>
          <strong>{formatThb(listing.observedPriceThb)}</strong>
          <small>{formatUsdFromThb(listing.observedPriceThb)} · {text.lastChecked}: {formatDateTime(listing.observedAt)}</small>
          <div className="hs-actions"><button className="hs-primary" onClick={() => openCase("availability")}><Gauge size={19} />{text.checkAvailability}</button><button onClick={() => openCase()}><MessageCircle size={19} />{text.ask}</button><button onClick={() => toggleSaved(listing.id)}><Heart size={19} fill={isSaved(listing.id) ? "currentColor" : "none"} />{isSaved(listing.id) ? text.saved : text.save}</button></div>
        </section>
      </article>
      <section className="hs-section"><h2>{text.keySpecs}</h2><dl className="hs-specs"><div><dt>{text.year}</dt><dd>{listing.year ?? "Pending"}</dd></div><div><dt>{text.transmission}</dt><dd>{listing.transmission}</dd></div><div><dt>{text.mileage}</dt><dd>{formatMileage(listing.mileageKm)}</dd></div><div><dt>{text.location}</dt><dd>{listing.generalLocation}</dd></div></dl><p>{listing.summary}</p></section>
      <section className="hs-section hs-price-detail"><h2>{text.priceDetail}</h2><div><span>Vehicle</span><b>{formatUsdFromThb(listing.observedPriceThb)}</b></div>{pricing.lines.slice(1).map((line) => <div key={line.key}><span>{line.key}</span><b>{line.amountThb === null ? "Pending" : formatUsdFromThb(line.amountThb)}</b></div>)}<p>Final quotation stays pending until HiSpeed/NK verifies availability, vehicle price, inspection, and shipping.</p></section>
      <section className="hs-shipping-promo"><Ship size={28} /><div><h2>{text.shippingTitle}</h2><p>{text.shippingSub}</p><Link href="/hispeed/shipments">{text.shipping}</Link></div></section>
    </>
  );
}

function ShipmentPlanner() {
  const { hydrated, state, updateCaseShippingPlan, requestCaseQuotation } = useBuyingBrowser();
  const text = useCopy();
  const primaryCase = state.cases[0];
  const selectedCountry = primaryCase?.shippingDestinationCountry || "";
  const selectedQuantity = primaryCase?.shippingVehicleQuantity || Math.min(3, Math.max(1, state.cases.length || 1));
  const plan = shippingPlanForSelection(selectedCountry, selectedQuantity);
  const one = shippingPlanForSelection(selectedCountry, 1);
  const saving = plan.planningPerVehicleUsdMid !== null && one.planningPerVehicleUsdMid !== null ? Math.max(0, one.planningPerVehicleUsdMid - plan.planningPerVehicleUsdMid) : null;
  if (!hydrated && !state.cases.length) return <section className="hs-empty">Loading...</section>;
  if (!state.cases.length) return <section className="hs-empty"><Ship size={30} /><h1>{text.shipping}</h1><p>{text.emptySaved}</p><Link className="hs-primary" href="/hispeed">{text.nav[0]}</Link></section>;
  function update(country: string, quantity = selectedQuantity) {
    if (primaryCase) updateCaseShippingPlan(primaryCase.id, { destinationCountry: country, vehicleQuantity: quantity });
  }
  return (
    <>
      <section className="hs-page-title"><div><span>{text.shipping}</span><h1>{text.shippingTitle}</h1><p>{text.shippingSub}</p></div><Link className="hs-primary" href="/hispeed/saved">{text.addShipment}</Link></section>
      <section className="hs-shipment" data-hispeed-shipment-planner>
        <div className="hs-shipment-controls"><label><span>{text.destination}</span><select value={selectedCountry} onChange={(event) => update(event.target.value)}><option value="">{text.chooseCountry}</option>{SHIPPING_DESTINATIONS.map((item) => <option key={item.country} value={item.country}>{item.country} - {item.port}</option>)}</select></label><label><span>{text.quantity}</span><select value={selectedQuantity} onChange={(event) => update(selectedCountry, Number(event.target.value))}>{[1, 2, 3].map((count) => <option key={count} value={count}>{count}{count === 3 ? " - best value" : ""}</option>)}</select></label></div>
        <div className="hs-shipment-metrics"><article><span>{text.planning}</span><b>{usd(plan.planningShipmentUsdMid)}</b></article><article><span>{text.perVehicle}</span><b>{usd(plan.planningPerVehicleUsdMid)}</b></article><article><span>{text.savings}</span><b>{usd(saving)}</b></article></div>
        <div className="hs-route-note"><b>{text.route}</b><p>{plan.routeType || "Choose destination"} · {plan.routeNote || text.inland}</p><p>3 cars include THB 25,000 rushing/loading: about USD {Math.round(25000 / CUSTOMER_FX_THB_PER_USD).toLocaleString("en-US")} per shipment, USD {Math.round((25000 / 3) / CUSTOMER_FX_THB_PER_USD).toLocaleString("en-US")} per car.</p></div>
        <section className="hs-shipment-slots">{Array.from({ length: selectedQuantity }, (_, index) => state.cases[index] || null).map((item, index) => item ? <article key={item.id}><VehiclePhoto listing={item.vehicle} /><div><small>Car {index + 1}</small><b>{item.vehicle.year} {item.vehicle.brand} {item.vehicle.model}</b><span>{formatUsdFromThb(item.vehicle.observedPriceThb)}</span></div><Link href={`/hispeed/cases/${encodeURIComponent(item.id)}`}>Open</Link></article> : <article key={index} className="empty"><span>{index + 1}</span><div><small>Open slot</small><b>{text.addShipment}</b></div><Link href="/hispeed/saved">Add</Link></article>)}</section>
        <footer><p>{text.planning}. Base freight comes from configured estimate/rate data; final freight requires NK confirmation.</p><button className="hs-primary" disabled={!selectedCountry} onClick={() => state.cases.slice(0, selectedQuantity).forEach((item) => requestCaseQuotation(item.id))}>{text.requestQuote}</button></footer>
      </section>
    </>
  );
}

function CasesScreen({ caseId }: { caseId?: string }) {
  const { hydrated, state, findCaseById, requestCaseAvailability, requestCaseInspection, askCaseQuestion } = useBuyingBrowser();
  const [question, setQuestion] = useState("");
  const text = useCopy();
  if (!hydrated && !state.cases.length) return <section className="hs-empty">Loading...</section>;
  const current = caseId ? findCaseById(caseId) : null;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (current && question.trim()) {
      askCaseQuestion(current.id, question);
      setQuestion("");
    }
  }
  if (current) return (
    <>
      <Link className="hs-back" href="/hispeed/cases"><ArrowLeft size={18} />{text.cases}</Link>
      <section className="hs-case-detail"><VehiclePhoto listing={current.vehicle} /><div><span>{current.id}</span><h1>{current.vehicle.title}</h1><p>{current.vehicle.generalLocation} · {formatUsdFromThb(current.vehicle.observedPriceThb)}</p><div className="hs-actions"><button className="hs-primary" onClick={() => requestCaseAvailability(current.id)}>{text.checkAvailability}</button><button onClick={() => requestCaseInspection(current.id)}>Inspection</button></div></div></section>
      <CaseTimeline vehicleCase={current} />
      <QuotationPanel vehicleCase={current} />
      <ProformaInvoicePanel vehicleCase={current} />
      <form className="hs-case-chat" onSubmit={submit}><label><MessageCircle size={18} /><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={text.ask} /></label><button>{text.ask}</button></form>
    </>
  );
  if (!state.cases.length) return <section className="hs-empty"><FolderKanban size={30} /><h1>{text.noCases}</h1><Link className="hs-primary" href="/hispeed">{text.nav[0]}</Link></section>;
  return <section className="hs-case-list"><div className="hs-page-title"><div><span>{text.timeline}</span><h1>{text.cases}</h1></div></div>{state.cases.map((item) => <Link key={item.id} href={`/hispeed/cases/${encodeURIComponent(item.id)}`}><VehiclePhoto listing={item.vehicle} /><div><small>{item.id}</small><h2>{item.vehicle.title}</h2><p>{item.availability} · {formatUsdFromThb(item.vehicle.observedPriceThb)}</p></div><Clock3 size={18} /></Link>)}</section>;
}

function CaseTimeline({ vehicleCase }: { vehicleCase: VehicleCase }) {
  const text = useCopy();
  const steps = [text.selected, text.how[1], text.how[2], text.how[3], text.how[4], text.quotePi, text.how[6]];
  return <section className="hs-section hs-timeline"><h2>{text.timeline}</h2><ol>{steps.map((step, index) => <li key={step} className={index < Math.min(2, vehicleCase.timeline.length + 1) ? "done" : ""}><span>{index + 1}</span><b>{step}</b></li>)}</ol></section>;
}

function AccountScreen() {
  const { customer, sourceStatus, state, workspaceSync } = useBuyingBrowser();
  const text = useCopy();
  return <section className="hs-account"><div className="hs-page-title"><div><span>HiSpeed</span><h1>{text.account}</h1><p>{text.accountIntro}</p></div></div><dl><div><dt>Customer</dt><dd>{customer.displayName}</dd></div><div><dt>Channel</dt><dd>{customer.acquisitionChannel || "hispeed"}</dd></div><div><dt>Inventory</dt><dd>{sourceStatus.label} · {sourceStatus.mode}</dd></div><div><dt>Workspace</dt><dd>{workspaceSync.mode}</dd></div><div><dt>{text.saved}</dt><dd>{state.savedListingIds.length}</dd></div><div><dt>{text.cases}</dt><dd>{state.cases.length}</dd></div></dl></section>;
}

export default function HiSpeedApp({ view, sourceId, caseId }: { view: BuyingBrowserView; sourceId?: string; caseId?: string }) {
  return (
    <HiSpeedShell view={view}>
      {view === "browse" && <BrowseScreen />}
      {view === "saved" && <BrowseScreen savedOnly />}
      {view === "vehicle" && <VehicleDetailScreen sourceId={sourceId} />}
      {view === "shipments" && <ShipmentPlanner />}
      {(view === "cases" || view === "case") && <CasesScreen caseId={view === "case" ? caseId : undefined} />}
      {view === "pi" && <CasesScreen caseId={caseId} />}
      {view === "account" && <AccountScreen />}
    </HiSpeedShell>
  );
}
