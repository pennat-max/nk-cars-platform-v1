"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock3, CreditCard, FolderKanban, Gauge, Globe2, Heart, MapPin, Maximize2, MessageCircle, Search, ShieldCheck, Ship, SlidersHorizontal, UserRound, WalletCards, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useBuyingBrowser } from "../buying-browser/BuyingBrowserProvider";
import { DEFAULT_FILTERS, filterListings, SHIPPING_DESTINATIONS, shippingPlanForSelection } from "../buying-browser/domain.mjs";
import { CUSTOMER_FX_THB_PER_USD, formatDateTime, formatMileage } from "../buying-browser/format";
import ProformaInvoicePanel from "../buying-browser/components/ProformaInvoicePanel";
import QuotationPanel from "../buying-browser/components/QuotationPanel";
import VehiclePhoto from "../buying-browser/components/VehiclePhoto";
import type { BrowseFilters, BuyingBrowserView, CustomerLanguage, CustomerListing, VehicleCase } from "../buying-browser/types";
import { buildHiSpeedQuoteSnapshot, calculateHiSpeedPurchasePlan, formatHiSpeedMoneyFromThb, formatHiSpeedMoneyFromUsd, hiSpeedFxDisclosure, hiSpeedMoneyInputToThb, hispeedCurrencyForLanguage, HISPEED_PURCHASE_PLANS, normalizeHiSpeedPlan } from "./hispeed-commercial.mjs";

type HiSpeedPlanId = "standard" | "flex";

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

const commercialCopy = {
  "zh-CN": {
    choosePlan: "选择付款方案",
    standardPlan: "标准方案",
    flexPlan: "HiSpeed 灵活付款方案",
    recommended: "推荐 / 总价更优",
    flexible: "灵活现金流 / 需审核批准",
    lowerPrice: "更低车辆总价",
    preserveCash: "发运前支付更少，保留更多流动资金",
    included: "车辆价格已包含 HiSpeed 采购及服务费用。",
    vehicleSellingPrice: "车辆销售价",
    paymentTimeline: "付款时间线",
    quoteSnapshot: "报价快照",
    inspectionWallet: "HiSpeed 验车钱包 / 验车额度",
    inspectionPolicy: "确认库存可先进行。实地验车/出行前，客户需批准并支付验车及出行费用，除非已有单独批准的信用政策。",
    newCustomer: "新客户：派单前支付验车/出行费用",
    regularCustomer: "常规客户：可使用 HiSpeed Wallet 余额",
    vipCustomer: "经批准经销商/VIP：按单独批准账期处理",
    purchaseCredit: "如 Owner 配置，符合条件的验车费用可抵扣成功购车；金额不在此预览硬编码。",
    flexStatus: "Flex 审核状态",
    flexSafety: "Flex 不会自动批准。放行车辆或运输文件前必须满足批准的付款节点。",
    confirmed: "Confirmed",
    estimate: "Estimate",
    notCalculated: "Not calculated",
    valid: "有效期 3 天",
  },
  en: {
    choosePlan: "Choose Payment Plan",
    standardPlan: "Standard Plan",
    flexPlan: "HiSpeed Flex Plan",
    recommended: "Recommended / Best Price",
    flexible: "Flexible Cash Flow / Subject to Approval",
    lowerPrice: "Lower total vehicle price",
    preserveCash: "Pay less before shipment and preserve working capital",
    included: "Vehicle price includes HiSpeed sourcing and service margin.",
    vehicleSellingPrice: "Vehicle Selling Price",
    paymentTimeline: "Payment timeline",
    quoteSnapshot: "Quote snapshot",
    inspectionWallet: "HiSpeed Inspection Wallet / Inspection Credit",
    inspectionPolicy: "Availability can be checked first. Before physical inspection or travel, the customer must approve and pay inspection/travel unless an approved credit policy exists.",
    newCustomer: "New customer: pay inspection/travel before dispatch",
    regularCustomer: "Regular customer: may use HiSpeed Wallet balance",
    vipCustomer: "Approved dealer/VIP: separately approved credit terms only",
    purchaseCredit: "If configured by Owner, eligible inspection cost may be credited toward a successful purchase; no amount is hard-coded in this preview.",
    flexStatus: "Flex review status",
    flexSafety: "Flex is never automatically approved. Vehicle or document release stays blocked until approved payment milestones are met.",
    confirmed: "Confirmed",
    estimate: "Estimate",
    notCalculated: "Not calculated",
    valid: "Valid for 3 days",
  },
  th: {
    choosePlan: "เลือกแผนชำระเงิน",
    standardPlan: "แผนมาตรฐาน",
    flexPlan: "HiSpeed Flex",
    recommended: "แนะนำ / ราคารวมดีกว่า",
    flexible: "ยืดหยุ่นเงินหมุนเวียน / ต้องอนุมัติ",
    lowerPrice: "ราคารถรวมต่ำกว่า",
    preserveCash: "จ่ายก่อนส่งน้อยลง ช่วยรักษาเงินหมุนเวียน",
    included: "ราคารถรวมค่าจัดหาและบริการของ HiSpeed แล้ว",
    vehicleSellingPrice: "ราคาขายรถ",
    paymentTimeline: "ไทม์ไลน์การชำระเงิน",
    quoteSnapshot: "ภาพรวมใบเสนอราคา",
    inspectionWallet: "HiSpeed Inspection Wallet / Inspection Credit",
    inspectionPolicy: "เช็ก availability ได้ก่อน แต่ก่อนออกตรวจ/เดินทาง ลูกค้าต้องอนุมัติและชำระค่าตรวจ/เดินทาง เว้นแต่มีนโยบายเครดิตที่อนุมัติแยกต่างหาก",
    newCustomer: "ลูกค้าใหม่: ชำระค่าตรวจ/เดินทางก่อน dispatch",
    regularCustomer: "ลูกค้าประจำ: ใช้ยอด HiSpeed Wallet ได้ถ้ามี",
    vipCustomer: "Dealer/VIP ที่อนุมัติแล้ว: ใช้เครดิตตามเงื่อนไขที่อนุมัติแยกเท่านั้น",
    purchaseCredit: "ถ้า Owner ตั้งค่าไว้ ค่า inspection ที่เข้าเงื่อนไขอาจนำไปเครดิตเมื่อซื้อสำเร็จ โดยยังไม่ hard-code จำนวนเงินใน preview นี้",
    flexStatus: "สถานะพิจารณา Flex",
    flexSafety: "Flex จะไม่ถูกอนุมัติอัตโนมัติ และจะไม่ปล่อยรถ/เอกสารก่อนถึง payment milestone ที่อนุมัติ",
    confirmed: "Confirmed",
    estimate: "Estimate",
    notCalculated: "Not calculated",
    valid: "มีอายุ 3 วัน",
  },
} satisfies Record<CustomerLanguage, Record<string, string>>;

const paymentCopy = {
  "zh-CN": {
    title: "付款请求示例",
    method: "付款方式",
    bankTransfer: "仅转账至 HiSpeed 公司银行账户",
    notConfigured: "公司账户资料需由 Owner 配置；预览不显示真实银行资料。",
    proof: "上传付款凭证不代表自动确认收款。HiSpeed 财务确认实际到账后，状态才会变为 Confirmed。",
    secure: "Secure Vehicles",
    beforeShipment: "Before Shipment",
    beforeContainerClose: "关柜前补足80%",
    containerClose: "关柜付款",
    destination: "Destination Milestone",
    totalDue: "本次应付",
    status: "状态",
    awaiting: "Awaiting Payment",
    notIssued: "Not Issued Yet",
    flexPending: "Pending Flex Approval",
    finance: "Finance confirmation required",
    customerAction: "客户操作：转账后上传凭证 / SWIFT reference",
  },
  en: {
    title: "Payment Request Example",
    method: "Payment Method",
    bankTransfer: "Bank transfer to HiSpeed company account only",
    notConfigured: "Company bank details must be configured by Owner; real bank details are not shown in preview.",
    proof: "Uploading proof does not confirm payment automatically. Status changes to Confirmed only after HiSpeed Finance verifies actual received funds.",
    secure: "Secure Vehicles",
    beforeShipment: "Before Shipment",
    beforeContainerClose: "Before Container Closing",
    containerClose: "Container Closing",
    destination: "Destination Milestone",
    totalDue: "Total due",
    status: "Status",
    awaiting: "Awaiting Payment",
    notIssued: "Not Issued Yet",
    flexPending: "Pending Flex Approval",
    finance: "Finance confirmation required",
    customerAction: "Customer action: transfer funds, then upload proof / SWIFT reference",
  },
  th: {
    title: "ตัวอย่าง Payment Request",
    method: "วิธีชำระเงิน",
    bankTransfer: "โอนเข้าบัญชีธนาคารชื่อบริษัท HiSpeed เท่านั้น",
    notConfigured: "ข้อมูลบัญชีบริษัทต้องให้ Owner ตั้งค่า ยังไม่แสดงบัญชีจริงใน preview",
    proof: "การอัปโหลดสลิปยังไม่ถือว่าชำระสำเร็จ สถานะจะเป็น Confirmed หลัง Finance ตรวจพบยอดเงินจริงเท่านั้น",
    secure: "Secure Vehicles",
    beforeShipment: "Before Shipment",
    beforeContainerClose: "ก่อนปิดตู้ให้ครบ 80%",
    containerClose: "ตอนปิดตู้",
    destination: "Destination Milestone",
    totalDue: "ยอดเรียกเก็บ",
    status: "สถานะ",
    awaiting: "Awaiting Payment",
    notIssued: "Not Issued Yet",
    flexPending: "Pending Flex Approval",
    finance: "ต้องให้ Finance ยืนยันยอดเงินจริง",
    customerAction: "ลูกค้าโอนเงิน แล้วอัปโหลดสลิป / SWIFT reference",
  },
} satisfies Record<CustomerLanguage, Record<string, string>>;

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

function useCommercialCopy() {
  const { language } = useBuyingBrowser();
  return commercialCopy[language];
}

function usePaymentCopy() {
  const { language } = useBuyingBrowser();
  return paymentCopy[language];
}

function useHiSpeedMoney() {
  const { language } = useBuyingBrowser();
  const fx = hispeedCurrencyForLanguage(language);
  return {
    currency: fx.currency,
    fromThb: (value: number | null | undefined) => formatHiSpeedMoneyFromThb(value, language),
    fromUsd: (value: number | null | undefined) => formatHiSpeedMoneyFromUsd(value, language),
    inputToThb: (value: string) => hiSpeedMoneyInputToThb(value, language),
    disclosure: hiSpeedFxDisclosure(language),
  };
}

function hiSpeedVehiclePrice(listing: CustomerListing, planId: HiSpeedPlanId = "standard") {
  return calculateHiSpeedPurchasePlan({ sourceCostThb: listing.observedPriceThb, planId }).vehicleSellingPriceThb;
}

function PaymentPlanSelector({
  listing,
  selectedPlan,
  onChange,
}: {
  listing: CustomerListing;
  selectedPlan: HiSpeedPlanId;
  onChange: (planId: HiSpeedPlanId) => void;
}) {
  const { language } = useBuyingBrowser();
  const c = useCommercialCopy();
  const money = useHiSpeedMoney();
  return (
    <section className="hs-section hs-plan-selector" data-hispeed-payment-plans>
      <div className="hs-section-head"><CreditCard size={22} /><h2>{c.choosePlan}</h2></div>
      <div className="hs-plan-grid">
        {(["standard", "flex"] as const).map((planId) => {
          const plan = calculateHiSpeedPurchasePlan({ sourceCostThb: listing.observedPriceThb, planId });
          const meta = HISPEED_PURCHASE_PLANS[planId];
          return (
            <button key={planId} type="button" className={selectedPlan === planId ? "active" : ""} onClick={() => onChange(planId)}>
              <span>{planId === "standard" ? c.recommended : c.flexible}</span>
              <h3>{planId === "standard" ? c.standardPlan : c.flexPlan}</h3>
              <strong>{money.fromThb(plan.vehicleSellingPriceThb)}</strong>
              <p>{meta.positioning[language]}</p>
              <small>{planId === "standard" ? c.lowerPrice : c.preserveCash}</small>
            </button>
          );
        })}
      </div>
      <p className="hs-commercial-note">{c.included}</p>
    </section>
  );
}

function PaymentTimeline({ listing, planId }: { listing: CustomerListing; planId: HiSpeedPlanId }) {
  const { language } = useBuyingBrowser();
  const c = useCommercialCopy();
  const money = useHiSpeedMoney();
  const plan = calculateHiSpeedPurchasePlan({ sourceCostThb: listing.observedPriceThb, planId });
  return (
    <section className="hs-section hs-payment-timeline" data-hispeed-payment-timeline>
      <div className="hs-section-head"><Clock3 size={22} /><h2>{c.paymentTimeline}</h2></div>
      <ol>
        {plan.schedule.map((step, index) => (
          <li key={step.key}>
            <span>{index + 1}</span>
            <div><b>{step.percent}%</b><p>{step.timing[language]}</p></div>
            <strong>{money.fromThb(step.amountThb)}</strong>
          </li>
        ))}
        <li className="complete"><span>{plan.schedule.length + 1}</span><div><b>100%</b><p>Complete before the approved release workflow continues.</p></div><strong>{money.fromThb(plan.vehicleSellingPriceThb)}</strong></li>
      </ol>
      {planId === "flex" && <p className="hs-commercial-note">{c.flexSafety}</p>}
    </section>
  );
}

function InspectionWalletPanel({ vehicleCase }: { vehicleCase?: VehicleCase | null }) {
  const c = useCommercialCopy();
  const money = useHiSpeedMoney();
  return (
    <section className="hs-section hs-wallet" data-hispeed-inspection-wallet>
      <div className="hs-section-head"><WalletCards size={22} /><h2>{c.inspectionWallet}</h2></div>
      <p>{c.inspectionPolicy}</p>
      <dl>
        <div><dt>{c.newCustomer}</dt><dd>{vehicleCase?.inspectionQuote ? money.fromThb(vehicleCase.inspectionQuote.totalThb) : c.notCalculated}</dd></div>
        <div><dt>{c.regularCustomer}</dt><dd>Wallet balance required</dd></div>
        <div><dt>{c.vipCustomer}</dt><dd>Owner approval required</dd></div>
      </dl>
      <p className="hs-commercial-note">{c.purchaseCredit}</p>
    </section>
  );
}

function HiSpeedQuoteSnapshot({ vehicleCase, selectedPlan }: { vehicleCase: VehicleCase; selectedPlan: HiSpeedPlanId }) {
  const c = useCommercialCopy();
  const money = useHiSpeedMoney();
  const shippingEstimateThb = vehicleCase.exportShippingThb ?? null;
  const snapshot = buildHiSpeedQuoteSnapshot({
    vehicleId: vehicleCase.listingId,
    sourceCostThb: vehicleCase.actualVehiclePurchasePriceThb ?? vehicleCase.vehicle.observedPriceThb,
    planId: selectedPlan,
    flexStatus: selectedPlan === "flex" ? vehicleCase.hispeedFlexStatus : "FLEX_NOT_REQUESTED",
    inspectionTravelThb: vehicleCase.inspectionQuote?.totalThb ?? null,
    shippingEstimateThb,
    otherApprovedCostsThb: vehicleCase.otherAgreedThb ?? null,
    fxRateThbPerUsd: CUSTOMER_FX_THB_PER_USD,
  });
  const lines = [
    { key: "vehicle", label: c.vehicleSellingPrice, amountThb: snapshot.vehicleSellingPriceThb, status: snapshot.statuses.vehicle },
    { key: "inspectionTravel", label: "Inspection / travel", amountThb: snapshot.inspectionTravelThb, status: snapshot.statuses.inspectionTravel },
    { key: "shipping", label: "Shipping", amountThb: snapshot.shippingEstimateThb, status: snapshot.statuses.shipping },
    { key: "other", label: "Other approved costs", amountThb: snapshot.otherApprovedCostsThb || null, status: snapshot.statuses.other },
  ];
  return (
    <section className="hs-section hs-quote-snapshot" data-hispeed-quote-snapshot>
      <div className="hs-section-head"><ShieldCheck size={22} /><h2>{c.quoteSnapshot}</h2></div>
      <div className="hs-quote-total"><span>{selectedPlan === "standard" ? c.standardPlan : c.flexPlan}</span><b>{money.fromThb(snapshot.knownTotalThb)}</b><small>{c.valid} · {money.disclosure}</small></div>
      <dl>{lines.map((line) => <div key={line.key}><dt>{line.label}</dt><dd><b>{money.fromThb(line.amountThb)}</b><span>{line.status}</span></dd></div>)}</dl>
      <PaymentTimeline listing={vehicleCase.vehicle} planId={selectedPlan} />
      {selectedPlan === "flex" && <p className="hs-flex-status">{c.flexStatus}: {snapshot.flexStatus}</p>}
    </section>
  );
}

function PaymentRequestExample({ vehicleCases }: { vehicleCases: VehicleCase[] }) {
  const pay = usePaymentCopy();
  const money = useHiSpeedMoney();
  const groups = [
    { key: "secure", title: pay.secure, status: pay.awaiting, steps: ["deposit", "initial"] },
    { key: "beforeContainerClose", title: pay.beforeContainerClose, status: pay.notIssued, steps: ["beforeContainerClose"] },
    { key: "beforeShipment", title: pay.beforeShipment, status: pay.notIssued, steps: ["beforeShipment"] },
    { key: "containerClose", title: pay.containerClose, status: pay.notIssued, steps: ["containerClose"] },
    { key: "destination", title: pay.destination, status: pay.flexPending, steps: ["destination"] },
  ];
  const rows = groups.map((group) => {
    const items = vehicleCases.flatMap((vehicleCase) => {
      const planId = normalizeHiSpeedPlan(vehicleCase.hispeedPaymentPlan) as HiSpeedPlanId;
      const purchase = calculateHiSpeedPurchasePlan({ sourceCostThb: vehicleCase.actualVehiclePurchasePriceThb ?? vehicleCase.vehicle.observedPriceThb, planId });
      return purchase.schedule
        .filter((step) => group.steps.includes(step.key))
        .map((step) => ({ vehicleCase, planId, step, amountThb: step.amountThb }));
    });
    return { ...group, items, totalThb: items.reduce((total, item) => total + (item.amountThb || 0), 0) };
  }).filter((group) => group.items.length);
  return (
    <section className="hs-section hs-payment-requests" data-hispeed-payment-request-example>
      <div className="hs-section-head"><CreditCard size={22} /><h2>{pay.title}</h2></div>
      <div className="hs-bank-method"><b>{pay.method}</b><p>{pay.bankTransfer}</p><small>{pay.notConfigured}</small></div>
      <div className="hs-request-list">
        {rows.map((group, index) => (
          <article key={group.key}>
            <header><div><span>{`HS-PR-2026-${String(128 + index).padStart(6, "0")}`}</span><h3>{group.title}</h3></div><strong>{money.fromThb(group.totalThb)}</strong></header>
            <dl>
              {group.items.map(({ vehicleCase, planId, step }) => (
                <div key={`${vehicleCase.id}-${step.key}`}>
                  <dt>{vehicleCase.vehicle.year} {vehicleCase.vehicle.brand} {vehicleCase.vehicle.model}</dt>
                  <dd><span>{planId === "standard" ? "Standard" : "Flex"} · {step.percent}%</span><b>{money.fromThb(step.amountThb)}</b></dd>
                </div>
              ))}
            </dl>
            <footer><span>{pay.status}: {group.status}</span><span>{pay.finance}</span></footer>
          </article>
        ))}
      </div>
      <p className="hs-commercial-note">{pay.customerAction}. {pay.proof}</p>
    </section>
  );
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
  const money = useHiSpeedMoney();
  const locationOptions = ["Bangkok Metro", "All Thailand", "Bangkok", "Nonthaburi", "Pathum Thani", "Samut Prakan", "Chon Buri"];
  return (
    <section className="hs-filter-row" aria-label="HiSpeed vehicle search">
      <label className="hs-search"><Search size={19} /><input value={filters.query} onChange={(event) => setFilter("query", event.target.value)} placeholder={text.searchPlaceholder} /></label>
      <label><span>{text.location}</span><select value={filters.location} onChange={(event) => setFilter("location", event.target.value)}>{locationOptions.map((location) => <option key={location} value={location}>{location === "Bangkok Metro" ? text.bangkokMetro : location === "All Thailand" ? text.allThailand : location}</option>)}</select></label>
      <label><span>{text.year}</span><select value={filters.yearFrom} onChange={(event) => setFilter("yearFrom", event.target.value)}>{["", "2020", "2021", "2022", "2023", "2024", "2025"].map((year) => <option key={year || "any"} value={year}>{year || text.any}</option>)}</select></label>
      <label><span>{text.price}</span><input inputMode="numeric" value={filters.priceMax} onChange={(event) => setFilter("priceMax", event.target.value.replace(/\D/g, ""))} placeholder={`${money.currency} max`} /></label>
      <button type="button"><SlidersHorizontal size={18} />{text.filters}</button>
    </section>
  );
}

function HiSpeedVehicleCard({ listing, selectable = false, selected = false, onSelect }: { listing: CustomerListing; selectable?: boolean; selected?: boolean; onSelect?: (id: string) => void }) {
  const { isSaved, toggleSaved } = useBuyingBrowser();
  const text = useCopy();
  const money = useHiSpeedMoney();
  const saved = isSaved(listing.id);
  return (
    <article className="hs-card" data-hispeed-vehicle-card data-listing-id={listing.id}>
      {selectable && <label className="hs-select"><input type="checkbox" checked={selected} onChange={() => onSelect?.(listing.id)} /><span /></label>}
      <Link className="hs-card-image" href={`/hispeed/vehicles/${encodeURIComponent(listing.id)}`}><VehiclePhoto listing={listing} /><em>{text.inspected}</em></Link>
      <button className={saved ? "hs-heart saved" : "hs-heart"} onClick={() => toggleSaved(listing.id)} aria-label={saved ? text.saved : text.save}><Heart size={20} fill={saved ? "currentColor" : "none"} /></button>
      <Link className="hs-card-copy" href={`/hispeed/vehicles/${encodeURIComponent(listing.id)}`}>
        <strong>{money.fromThb(hiSpeedVehiclePrice(listing))}</strong>
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
  const c = useCommercialCopy();
  const money = useHiSpeedMoney();
  const sourceListings = savedOnly ? listings.filter((item) => state.savedListingIds.includes(item.id)) : listings;
  const domainFilters = useMemo(() => ({ ...filters, priceMin: money.inputToThb(filters.priceMin), priceMax: money.inputToThb(filters.priceMax) }), [filters, money]);
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
      {!savedOnly && <section className="hs-hero"><div><span>HiSpeed Export Marketplace</span><h1>{text.heroTitle}</h1><p>{text.heroSub}</p><a href="#hispeed-vehicles">{text.heroCta}</a></div><div className="hs-hero-stats"><b>{visibleListings.length}</b><span>{text.verified}</span><strong>{money.disclosure}</strong></div></section>}
      {savedOnly && <section className="hs-page-title"><div><span>{text.shortlist}</span><h1>{text.saved}</h1></div><button className="hs-primary" disabled={!selectedIds.length} onClick={addSelectedToShipment}><Ship size={18} />{text.addShipment}</button></section>}
      <SearchControls filters={filters} setFilter={setFilter} />
      {savedOnly && <section className="hs-shortlist"><b>{selectedIds.length} selected</b><button disabled={selectedIds.length < 2}>{text.compare}</button><button disabled={!selectedIds.length} onClick={addSelectedToShipment}>{text.addShipment}</button></section>}
      {!savedOnly && <section className="hs-commerce-band"><article><ShieldCheck size={22} /><b>{text.trust[0]}</b></article><article><Gauge size={22} /><b>{text.trust[1]}</b></article><article><CheckCircle2 size={22} /><b>{text.trust[2]}</b></article></section>}
      <section id="hispeed-vehicles" className="hs-grid" aria-label="HiSpeed vehicles">{visibleListings.length ? visibleListings.map((listing) => <HiSpeedVehicleCard key={listing.id} listing={listing} selectable={savedOnly} selected={selectedIds.includes(listing.id)} onSelect={(id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} />) : <div className="hs-empty">{savedOnly ? text.emptySaved : "No matches"}</div>}</section>
      {!savedOnly && <section className="hs-how"><h2>How it works</h2><ol>{[...text.how.slice(0, 3), c.choosePlan, ...text.how.slice(3)].map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol></section>}
    </>
  );
}

function VehicleDetailScreen({ sourceId }: { sourceId?: string }) {
  const { language, listings, isSaved, toggleSaved, saveAsCase } = useBuyingBrowser();
  const [imageIndex, setImageIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const fullscreenTrack = useRef<HTMLDivElement>(null);
  const [selectedPlan, setSelectedPlan] = useState<HiSpeedPlanId>("standard");
  const text = useCopy();
  const c = useCommercialCopy();
  const money = useHiSpeedMoney();
  const listing = listings.find((item) => item.id === sourceId);
  useEffect(() => {
    if (!fullscreenOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [fullscreenOpen]);
  useEffect(() => {
    if (!fullscreenOpen) return;
    requestAnimationFrame(() => {
      const track = fullscreenTrack.current;
      if (track) track.scrollTo({ left: track.clientWidth * imageIndex });
    });
  }, [fullscreenOpen, imageIndex]);
  if (!listing) return <section className="hs-empty"><h1>Vehicle not found</h1><Link className="hs-primary" href="/hispeed"><ArrowLeft size={18} />Back</Link></section>;
  const purchase = calculateHiSpeedPurchasePlan({ sourceCostThb: listing.observedPriceThb, planId: selectedPlan });
  const openPhotoLabel = language === "en" ? "Open full screen" : language === "th" ? "ดูรูปเต็มจอ" : "查看大图";
  const closePhotoLabel = language === "en" ? "Close gallery" : language === "th" ? "ปิดรูป" : "关闭图片";
  function openCase(action?: "availability" | "inspection") {
    const caseId = saveAsCase(listing!, action);
    window.location.assign(`/hispeed/cases/${encodeURIComponent(caseId)}`);
  }
  function showFullscreenPhoto(index: number) {
    const next = Math.max(0, Math.min(index, listing!.imageUrls.length - 1));
    setImageIndex(next);
    const track = fullscreenTrack.current;
    if (track) track.scrollTo({ left: track.clientWidth * next, behavior: "smooth" });
  }
  return (
    <>
      <Link className="hs-back" href="/hispeed"><ArrowLeft size={18} />{text.nav[0]}</Link>
      <article className="hs-detail" data-hispeed-vehicle-detail>
        <section className="hs-gallery">
          <button type="button" className="hs-gallery-main" onClick={() => setFullscreenOpen(true)} aria-label={openPhotoLabel}>
            <VehiclePhoto listing={listing} imageUrl={listing.imageUrls[imageIndex]} />
            <span><Maximize2 size={16} />{openPhotoLabel}</span>
          </button>
          <div>{listing.imageUrls.slice(0, 8).map((image, index) => <button type="button" key={image} className={index === imageIndex ? "active" : ""} onClick={() => setImageIndex(index)} aria-label={`${openPhotoLabel} ${index + 1}`}><VehiclePhoto listing={listing} imageUrl={image} alt="" /></button>)}</div>
        </section>
        <section className="hs-detail-summary">
          <span className="hs-chip"><CheckCircle2 size={14} />{text.inspected}</span>
          <h1>{listing.title}</h1>
          <p>{listing.grade} · {listing.color}</p>
          <strong>{money.fromThb(purchase.vehicleSellingPriceThb)}</strong>
          <small>{money.disclosure} · {text.lastChecked}: {formatDateTime(listing.observedAt)}</small>
          <div className="hs-actions"><button className="hs-primary" onClick={() => openCase("availability")}><Gauge size={19} />{text.checkAvailability}</button><button onClick={() => openCase()}><MessageCircle size={19} />{text.ask}</button><button onClick={() => toggleSaved(listing.id)}><Heart size={19} fill={isSaved(listing.id) ? "currentColor" : "none"} />{isSaved(listing.id) ? text.saved : text.save}</button></div>
        </section>
      </article>
      <PaymentPlanSelector listing={listing} selectedPlan={selectedPlan} onChange={setSelectedPlan} />
      <PaymentTimeline listing={listing} planId={selectedPlan} />
      <InspectionWalletPanel />
      <section className="hs-section"><h2>{text.keySpecs}</h2><dl className="hs-specs"><div><dt>{text.year}</dt><dd>{listing.year ?? "Pending"}</dd></div><div><dt>{text.transmission}</dt><dd>{listing.transmission}</dd></div><div><dt>{text.mileage}</dt><dd>{formatMileage(listing.mileageKm)}</dd></div><div><dt>{text.location}</dt><dd>{listing.generalLocation}</dd></div></dl><p>{listing.summary}</p></section>
      <section className="hs-section hs-price-detail"><h2>{text.priceDetail}</h2><div><span>{c.vehicleSellingPrice}</span><b>{money.fromThb(purchase.vehicleSellingPriceThb)}</b></div><p>{c.included}</p><p>Final quotation stays pending until HiSpeed/NK verifies availability, vehicle price, inspection, and shipping.</p></section>
      <section className="hs-shipping-promo"><Ship size={28} /><div><h2>{text.shippingTitle}</h2><p>{text.shippingSub}</p><Link href="/hispeed/shipments">{text.shipping}</Link></div></section>
      {fullscreenOpen && <section className="hs-photo-viewer" role="dialog" aria-modal="true" aria-label={openPhotoLabel} data-hispeed-fullscreen-viewer>
        <header><button type="button" onClick={() => setFullscreenOpen(false)} aria-label={closePhotoLabel} autoFocus><X size={30} /></button><strong>{imageIndex + 1} / {listing.imageUrls.length}</strong></header>
        <div ref={fullscreenTrack} className="hs-photo-viewer-track" onScroll={(event) => { const width = event.currentTarget.clientWidth; if (width) setImageIndex(Math.round(event.currentTarget.scrollLeft / width)); }}>
          {listing.imageUrls.map((image, index) => <div className="hs-photo-viewer-slide" key={image}><VehiclePhoto listing={listing} imageUrl={image} alt={`${listing.title} fullscreen view ${index + 1}`} /></div>)}
        </div>
        {listing.imageUrls.length > 1 && <><button type="button" className="hs-photo-viewer-arrow previous" onClick={() => showFullscreenPhoto(imageIndex - 1)} disabled={imageIndex === 0} aria-label="Previous photo"><ChevronLeft size={30} /></button><button type="button" className="hs-photo-viewer-arrow next" onClick={() => showFullscreenPhoto(imageIndex + 1)} disabled={imageIndex === listing.imageUrls.length - 1} aria-label="Next photo"><ChevronRight size={30} /></button></>}
      </section>}
    </>
  );
}

function ShipmentPlanner() {
  const { hydrated, state, updateCaseShippingPlan, requestCaseQuotation } = useBuyingBrowser();
  const text = useCopy();
  const money = useHiSpeedMoney();
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
        <div className="hs-shipment-metrics"><article><span>{text.planning}</span><b>{money.fromUsd(plan.planningShipmentUsdMid)}</b></article><article><span>{text.perVehicle}</span><b>{money.fromUsd(plan.planningPerVehicleUsdMid)}</b></article><article><span>{text.savings}</span><b>{money.fromUsd(saving)}</b></article></div>
        <div className="hs-route-note"><b>{text.route}</b><p>{plan.routeType || "Choose destination"} · {plan.routeNote || text.inland}</p><p>3 cars include rushing/loading: about {money.fromThb(25000)} per shipment, {money.fromThb(Math.round(25000 / 3))} per car.</p></div>
        <section className="hs-shipment-slots">{Array.from({ length: selectedQuantity }, (_, index) => state.cases[index] || null).map((item, index) => item ? <article key={item.id}><VehiclePhoto listing={item.vehicle} /><div><small>Car {index + 1}</small><b>{item.vehicle.year} {item.vehicle.brand} {item.vehicle.model}</b><span>{money.fromThb(hiSpeedVehiclePrice(item.vehicle, normalizeHiSpeedPlan(item.hispeedPaymentPlan) as HiSpeedPlanId))}</span></div><Link href={`/hispeed/cases/${encodeURIComponent(item.id)}`}>Open</Link></article> : <article key={index} className="empty"><span>{index + 1}</span><div><small>Open slot</small><b>{text.addShipment}</b></div><Link href="/hispeed/saved">Add</Link></article>)}</section>
        <footer><p>{text.planning}. Base freight comes from configured estimate/rate data; final freight requires NK confirmation.</p><button className="hs-primary" disabled={!selectedCountry} onClick={() => state.cases.slice(0, selectedQuantity).forEach((item) => requestCaseQuotation(item.id))}>{text.requestQuote}</button></footer>
      </section>
      <PaymentRequestExample vehicleCases={state.cases.slice(0, selectedQuantity)} />
    </>
  );
}

function CasesScreen({ caseId }: { caseId?: string }) {
  const { hydrated, state, findCaseById, requestCaseAvailability, requestCaseInspection, updateCaseHiSpeedPaymentPlan, askCaseQuestion } = useBuyingBrowser();
  const [question, setQuestion] = useState("");
  const text = useCopy();
  const money = useHiSpeedMoney();
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
      <section className="hs-case-detail"><VehiclePhoto listing={current.vehicle} /><div><span>{current.id}</span><h1>{current.vehicle.title}</h1><p>{current.vehicle.generalLocation} · {money.fromThb(hiSpeedVehiclePrice(current.vehicle, normalizeHiSpeedPlan(current.hispeedPaymentPlan) as HiSpeedPlanId))}</p><div className="hs-actions"><button className="hs-primary" onClick={() => requestCaseAvailability(current.id)}>{text.checkAvailability}</button><button onClick={() => requestCaseInspection(current.id)}>Inspection</button></div></div></section>
      <PaymentPlanSelector listing={current.vehicle} selectedPlan={normalizeHiSpeedPlan(current.hispeedPaymentPlan) as HiSpeedPlanId} onChange={(planId) => updateCaseHiSpeedPaymentPlan(current.id, planId)} />
      <InspectionWalletPanel vehicleCase={current} />
      <HiSpeedQuoteSnapshot vehicleCase={current} selectedPlan={normalizeHiSpeedPlan(current.hispeedPaymentPlan) as HiSpeedPlanId} />
      <PaymentRequestExample vehicleCases={[current]} />
      <CaseTimeline vehicleCase={current} />
      <QuotationPanel vehicleCase={current} />
      <ProformaInvoicePanel vehicleCase={current} />
      <form className="hs-case-chat" onSubmit={submit}><label><MessageCircle size={18} /><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={text.ask} /></label><button>{text.ask}</button></form>
    </>
  );
  if (!state.cases.length) return <section className="hs-empty"><FolderKanban size={30} /><h1>{text.noCases}</h1><Link className="hs-primary" href="/hispeed">{text.nav[0]}</Link></section>;
  return <section className="hs-case-list"><div className="hs-page-title"><div><span>{text.timeline}</span><h1>{text.cases}</h1></div></div>{state.cases.map((item) => <Link key={item.id} href={`/hispeed/cases/${encodeURIComponent(item.id)}`}><VehiclePhoto listing={item.vehicle} /><div><small>{item.id}</small><h2>{item.vehicle.title}</h2><p>{item.availability} · {money.fromThb(hiSpeedVehiclePrice(item.vehicle, normalizeHiSpeedPlan(item.hispeedPaymentPlan) as HiSpeedPlanId))}</p></div><Clock3 size={18} /></Link>)}</section>;
}

function CaseTimeline({ vehicleCase }: { vehicleCase: VehicleCase }) {
  const text = useCopy();
  const c = useCommercialCopy();
  const steps = [text.selected, text.how[1], text.how[2], c.choosePlan, text.how[3], text.how[4], text.quotePi, text.how[6]];
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
