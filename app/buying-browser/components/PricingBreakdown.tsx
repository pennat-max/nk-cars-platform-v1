"use client";

import Link from "next/link";
import { Bot, Check, Clock3, Info, Search, Ship, SquarePlus } from "lucide-react";
import { calculatePricing, shippingPlanForSelection, SHIPPING_DESTINATIONS, SHIPPING_PLANNING_BUFFER_RATE } from "../domain.mjs";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { CUSTOMER_FX_THB_PER_USD, customerFxDisclosure, formatUsdFromThb } from "../format";
import { useI18n } from "../use-i18n";
import type { CustomerLanguage, VehicleCase } from "../types";
import VehiclePhoto from "./VehiclePhoto";

const shippingCopy: Record<CustomerLanguage, {
  title: string;
  country: string;
  quantity: string;
  choose: string;
  rule: string;
  freightPending: string;
  loadingFee: string;
  locked: string;
  planningFreight: string;
  marketBenchmark: string;
  bufferNote: string;
  noIndicativeFreight: string;
  sourcePrefix: string;
  estimateSuffix: string;
  perCarSuffix: string;
  aboutPrefix: string;
  fullShipment: string;
  estimateRange: string;
  estimatedTotal: string;
  knownSubtotal: string;
  estimatedTotalNote: (knownTotal: string, shippingEstimate: string) => string;
  loadingService: string;
  loadingServiceNote: (totalUsd: number, perCarUsd: number) => string;
  chooseDestinationFirst: string;
  shareNote: (quantity: number) => string;
}> = {
  en: {
    title: "Destination and shipping estimate",
    country: "Destination country",
    quantity: "Cars in this shipment",
    choose: "Choose country to calculate",
    rule: "You can plan 1 to 3 cars in one shipment. The range below is for planning only; final freight is confirmed when NK books the route.",
    freightPending: "Export / Shipping remains Pending until NK confirms the live forwarder or booking rate. The final rate can move up or down.",
    loadingFee: "3-car container loading / stuffing fee",
    locked: "Shipping selection is locked after an approved quotation is issued.",
    planningFreight: "Estimated planning range",
    marketBenchmark: "Public market benchmark",
    bufferNote: "Upper range includes a planning buffer. Final booking may be higher or lower.",
    noIndicativeFreight: "No reliable public route estimate found yet. NK quote is required before final pricing.",
    sourcePrefix: "Source",
    estimateSuffix: "est.",
    perCarSuffix: "per car est.",
    aboutPrefix: "About",
    fullShipment: "Full shipment estimate",
    estimateRange: "Estimate range",
    estimatedTotal: "Estimated total with shipping",
    knownSubtotal: "Known subtotal",
    estimatedTotalNote: (knownTotal, shippingEstimate) => `${knownTotal} known subtotal + ${shippingEstimate} selected shipping estimate. Other pending costs are still excluded.`,
    loadingService: "3-car Rushing / loading service",
    loadingServiceNote: (totalUsd, perCarUsd) => `THB 25,000 service is included above: USD ${totalUsd.toLocaleString("en-US")} total, about USD ${perCarUsd.toLocaleString("en-US")} per car when shared by 3 cars.`,
    chooseDestinationFirst: "Choose country first",
    shareNote: (quantity) => quantity === 1 ? "1 car uses the full shipping estimate." : quantity === 2 ? "2 cars share the freight, so each car pays about half." : "Best value: 3 cars share the freight and the THB 25,000 Rushing/loading service.",
  },
  "zh-CN": {
    title: "目的地和运费估算",
    country: "目的地国家",
    quantity: "本次运输车辆数",
    choose: "选择国家后计算",
    rule: "客户可计划每次运输 1 至 3 辆车。以下范围仅供计划使用；最终运费以 NK 实际订舱确认为准。",
    freightPending: "Export / Shipping 仍为 Pending，直到 NK 确认实时货代或订舱价格。最终价格可能上调或下调。",
    loadingFee: "3 辆车装柜 / 装载费",
    locked: "批准报价发出后，运输选择将被锁定。",
    planningFreight: "计划用估算范围",
    marketBenchmark: "公开市场参考价",
    bufferNote: "区间上限包含计划缓冲。实际订舱价格可能更高或更低。",
    noIndicativeFreight: "尚未找到可靠的公开路线估算。最终定价前需要 NK 报价。",
    sourcePrefix: "来源",
    estimateSuffix: "估算",
    perCarSuffix: "每辆估算",
    aboutPrefix: "约",
    fullShipment: "整柜估算",
    estimateRange: "估算范围",
    estimatedTotal: "含运费估算总计",
    knownSubtotal: "已知小计",
    estimatedTotalNote: (knownTotal, shippingEstimate) => `${knownTotal} 已知小计 + ${shippingEstimate} 所选运费估算。其他待确认费用仍未包含。`,
    loadingService: "3 辆车 Rushing / 装柜服务费",
    loadingServiceNote: (totalUsd, perCarUsd) => `THB 25,000 服务费已包含在上方估算内：总计 USD ${totalUsd.toLocaleString("en-US")}，3 辆车分摊约每辆 USD ${perCarUsd.toLocaleString("en-US")}。`,
    chooseDestinationFirst: "请先选择国家",
    shareNote: (quantity) => quantity === 1 ? "1 辆车按完整运费估算。" : quantity === 2 ? "2 辆车分摊运费，每辆约为一半。" : "最划算：3 辆车分摊运费和 THB 25,000 Rushing/装柜服务费。",
  },
  th: {
    title: "ปลายทางและค่าชิปปิ้งประมาณการ",
    country: "ประเทศปลายทาง",
    quantity: "จำนวนรถในรอบส่งนี้",
    choose: "เลือกประเทศเพื่อคำนวณ",
    rule: "ลูกค้าสามารถวางแผนส่งได้ 1 ถึง 3 คันต่อรอบ ช่วงราคาด้านล่างใช้เพื่อวางแผนเท่านั้น ราคาจริงยืนยันตอน NK booking เส้นทางจริง",
    freightPending: "ยอด Export / Shipping ยังเป็น Pending จนกว่า NK จะยืนยันราคาจริงจาก forwarder หรือ booking ราคาจริงอาจขึ้นหรือลงได้",
    loadingFee: "ค่าบรรจุ / ชิ่งตู้สำหรับ 3 คัน",
    locked: "หลังออกใบเสนอราคาที่อนุมัติแล้ว ระบบจะล็อกตัวเลือกชิปปิ้ง",
    planningFreight: "ช่วงราคาประมาณการสำหรับวางแผน",
    marketBenchmark: "ราคาอ้างอิงจากตลาด",
    bufferNote: "ปลายบนของช่วงราคานี้รวม buffer สำหรับวางแผน ราคาจริงตอน booking อาจสูงหรือต่ำกว่าได้",
    noIndicativeFreight: "ยังไม่พบราคาประมาณการสาธารณะที่น่าเชื่อถือสำหรับเส้นทางนี้ ต้องให้ NK ขอราคาก่อนออกยอดสุดท้าย",
    sourcePrefix: "แหล่งข้อมูล",
    estimateSuffix: "ประมาณการ",
    perCarSuffix: "ต่อคัน ประมาณการ",
    aboutPrefix: "ประมาณ",
    fullShipment: "ยอดรวมทั้งตู้ประมาณการ",
    estimateRange: "ช่วงราคาประมาณการ",
    estimatedTotal: "ยอดรวมประมาณการรวมชิปปิ้ง",
    knownSubtotal: "ยอดย่อยที่ทราบ",
    estimatedTotalNote: (knownTotal, shippingEstimate) => `${knownTotal} ยอดย่อยที่ทราบ + ${shippingEstimate} ค่าชิปปิ้งประมาณการที่เลือกไว้ ยังไม่รวมรายการอื่นที่รอยืนยัน`,
    loadingService: "ค่าบริการ Rushing / ชิ่งตู้ 3 คัน",
    loadingServiceNote: (totalUsd, perCarUsd) => `รวมค่าบริการ 25,000 บาทไว้ในยอดด้านบนแล้ว คิดเป็น USD ${totalUsd.toLocaleString("en-US")} ทั้งตู้ หรือประมาณ USD ${perCarUsd.toLocaleString("en-US")} ต่อคันเมื่อหาร 3 คัน`,
    chooseDestinationFirst: "เลือกประเทศก่อน",
    shareNote: (quantity) => quantity === 1 ? "1 คันคิดค่าชิปปิ้งเต็มจำนวน" : quantity === 2 ? "2 คันแชร์ค่าระวาง ค่าต่อคันจึงประมาณครึ่งหนึ่ง" : "คุ้มสุด: 3 คันแชร์ค่าระวางและแชร์ค่าบริการ Rushing/ชิ่งตู้ 25,000 บาท",
  },
};

function formatUsdRange(low: number | null, high: number | null) {
  if (low === null || high === null) return null;
  if (low === high) return `USD ${low.toLocaleString("en-US")}`;
  return `USD ${low.toLocaleString("en-US")} - ${high.toLocaleString("en-US")}`;
}

function formatUsdAmount(value: number | null | undefined) {
  return value === null || value === undefined ? null : `USD ${value.toLocaleString("en-US")}`;
}

function shipmentFillCopy(language: CustomerLanguage, missingSlots: number) {
  if (language === "th") return {
    title: "เติมรถให้ครบตู้",
    progress: "มี Vehicle Case แล้ว",
    target: "เป้าหมายรอบส่งนี้",
    add: "ยังต้องหาเพิ่ม",
    ready: "พร้อมให้ NK สรุปค่าใช้จ่ายรวมของชุดนี้",
    missing: `หาเพิ่มอีก ${missingSlots} คัน เพื่อแชร์ค่าตู้และสรุปยอดรวมทั้งชุด`,
    estimate: "ยอดประมาณของคันนี้",
    note: "เมื่อลูกค้าเพิ่มรถครบ ระบบจะใช้แต่ละ Vehicle Case รวมกับค่าชิปปิ้งต่อคัน เพื่อให้ NK ตรวจและออกยอดรวมจริงก่อนเสนอราคา",
    browse: "Browse",
    paste: "Paste link",
    ask: "Ask NK AI",
    car: "คัน",
  };
  if (language === "zh-CN") return {
    title: "补满同一柜车辆",
    progress: "已建立车辆案件",
    target: "本次运输目标",
    add: "还需补充",
    ready: "可让 NK 汇总本组预计费用",
    missing: `再添加 ${missingSlots} 辆车，以分摊整柜费用并汇总本组总成本`,
    estimate: "本车预计金额",
    note: "车辆补齐后，系统会把每个车辆案件与每车运费估算合并，供 NK 核实后再出正式报价。",
    browse: "Browse",
    paste: "Paste link",
    ask: "Ask NK AI",
    car: "辆",
  };
  return {
    title: "Fill this shipment",
    progress: "Vehicle Cases added",
    target: "Shipment target",
    add: "Still needed",
    ready: "Ready for NK to summarize this shipment",
    missing: `Add ${missingSlots} more vehicle${missingSlots === 1 ? "" : "s"} to share the container cost and summarize the full shipment.`,
    estimate: "This vehicle estimate",
    note: "When the customer adds enough vehicles, NK can combine each Vehicle Case with the per-car shipping estimate, then verify the real total before quote.",
    browse: "Browse",
    paste: "Paste link",
    ask: "Ask NK AI",
    car: "cars",
  };
}

function quoteChoiceCopy(language: CustomerLanguage, count: number) {
  if (language === "th") {
    if (count === 1) return { title: "Quote 1 คันตอนนี้", note: "เร็วสุด แต่คิดค่าชิปปิ้งเต็มต่อคัน" };
    if (count === 2) return { title: "Quote 2 คันตอนนี้", note: "2 คันแชร์ค่าระวาง ค่าต่อคันลดลง", tag: null };
    return { title: "Quote 3 คัน", note: "คุ้มสุด แชร์ค่าระวางและค่า Rushing 25,000 บาท", tag: "คุ้มสุด" };
  }
  if (language === "zh-CN") {
    if (count === 1) return { title: "现在报价 1 辆车", note: "最快，但单车承担完整运费" };
    if (count === 2) return { title: "现在报价 2 辆车", note: "2 辆车分摊运费，单车成本降低", tag: null };
    return { title: "报价 3 辆车", note: "最划算：分摊运费和 THB 25,000 Rushing 服务费", tag: "最划算" };
  }
  if (count === 1) return { title: "Quote 1 car now", note: "Fastest. Uses the full shipping estimate for this car." };
  if (count === 2) return { title: "Quote 2 cars now", note: "Two cars share the freight, so cost per car drops.", tag: null };
  return { title: "Quote 3 cars", note: "Best value: shares freight plus the THB 25,000 Rushing service.", tag: "Best value" };
}

function shipmentSlotCopy(language: CustomerLanguage) {
  if (language === "th") return {
    title: "รถในรอบส่งนี้",
    filled: "คันที่",
    empty: "ช่องว่าง",
    openCase: "เปิดเคส",
    add: "เติมรถ",
    addHint: "เลือกรถอีกคันเพื่อแชร์ค่าตู้",
    groupTotal: "ยอดรวมของรถที่มีในแผนตอนนี้",
    currentSet: "รวมจาก Vehicle Case ที่มีอยู่ในแผนนี้เท่านั้น",
  };
  if (language === "zh-CN") return {
    title: "本次运输车辆",
    filled: "车辆",
    empty: "空位",
    openCase: "打开案件",
    add: "添加车辆",
    addHint: "再选一辆车来分摊集装箱成本",
    groupTotal: "当前计划车辆合计",
    currentSet: "仅包含当前计划里的 Vehicle Case",
  };
  return {
    title: "Cars in this shipment",
    filled: "Car",
    empty: "Open slot",
    openCase: "Open case",
    add: "Add car",
    addHint: "Choose another vehicle to share the container cost.",
    groupTotal: "Current planned set total",
    currentSet: "Only the Vehicle Cases currently in this plan are included.",
  };
}

function knownCaseSubtotalThb(vehicleCase: VehicleCase) {
  return calculatePricing({
    vehiclePriceThb: vehicleCase.actualVehiclePurchasePriceThb ?? vehicleCase.vehicle.observedPriceThb,
    platformTransactionRate: vehicleCase.platformTransactionRate,
    buyingServiceRate: vehicleCase.buyingServiceRate,
    inspectionTravelThb: vehicleCase.inspectionQuote?.totalThb ?? null,
    domesticTransportThb: vehicleCase.domesticTransportThb,
    repairModificationThb: vehicleCase.repairModificationThb,
    exportShippingThb: vehicleCase.exportShippingThb,
    containerLoadingFeeThb: null,
    otherAgreedThb: vehicleCase.otherAgreedThb,
  }).knownSubtotalThb;
}

export default function PricingBreakdown({ vehicleCase }: { vehicleCase: VehicleCase }) {
  const { t } = useI18n();
  const { language, state, updateCaseShippingPlan } = useBuyingBrowser();
  const text = shippingCopy[language];
  const shippingCountry = vehicleCase.shippingDestinationCountry || "";
  const shippingQuantity = vehicleCase.shippingVehicleQuantity || 1;
  const shippingPlan = shippingPlanForSelection(shippingCountry, shippingQuantity);
  const shippingLocked = Boolean(vehicleCase.quotation || vehicleCase.proformaInvoice);
  const marketBenchmark = formatUsdRange(shippingPlan.indicativeFreightUsdLow, shippingPlan.indicativeFreightUsdHigh);
  const planningFreight = formatUsdRange(shippingPlan.planningFreightUsdLow, shippingPlan.planningFreightUsdHigh);
  const planningShipment = formatUsdRange(shippingPlan.planningShipmentUsdLow, shippingPlan.planningShipmentUsdHigh);
  const planningPerVehicle = formatUsdRange(shippingPlan.planningPerVehicleUsdLow, shippingPlan.planningPerVehicleUsdHigh);
  const planningPerVehicleMid = formatUsdAmount(shippingPlan.planningPerVehicleUsdMid);
  const bufferPercent = Math.round((shippingPlan.planningBufferRate ?? SHIPPING_PLANNING_BUFFER_RATE) * 100);
  const pricing = calculatePricing({
    vehiclePriceThb: vehicleCase.actualVehiclePurchasePriceThb ?? vehicleCase.vehicle.observedPriceThb,
    platformTransactionRate: vehicleCase.platformTransactionRate,
    buyingServiceRate: vehicleCase.buyingServiceRate,
    inspectionTravelThb: vehicleCase.inspectionQuote?.totalThb ?? null,
    domesticTransportThb: vehicleCase.domesticTransportThb,
    repairModificationThb: vehicleCase.repairModificationThb,
    exportShippingThb: vehicleCase.exportShippingThb,
    containerLoadingFeeThb: null,
    otherAgreedThb: vehicleCase.otherAgreedThb,
  });
  const labels: Record<string, string> = {
    vehicle: t("vehiclePrice"),
    platformTransaction: t("platformTransactionFee"),
    buyingService: t("buyingServiceFee"),
    inspection: t("inspectionTravel"),
    transport: t("domesticTransport"),
    repair: t("repairModification"),
    shipping: t("exportShipping"),
    containerLoading: text.loadingFee,
    other: t("otherAgreedCharges"),
  };
  const updateCountry = (destinationCountry: string) => updateCaseShippingPlan(vehicleCase.id, { destinationCountry, vehicleQuantity: shippingQuantity });
  const updateQuantity = (vehicleQuantity: number) => updateCaseShippingPlan(vehicleCase.id, { destinationCountry: shippingCountry, vehicleQuantity });
  const quantityOptionLabel = (count: number) => {
    if (count !== 3) return String(count);
    if (language === "th") return "3 - คุ้มสุด";
    if (language === "zh-CN") return "3 - 最划算";
    return "3 - Best value";
  };
  const knownSubtotal = formatUsdFromThb(pricing.knownSubtotalThb);
  const estimatedTotalWithShipping = formatUsdAmount(
    shippingPlan.planningPerVehicleUsdMid === null || shippingPlan.planningPerVehicleUsdMid === undefined
      ? null
      : Math.round(pricing.knownSubtotalThb / CUSTOMER_FX_THB_PER_USD) + shippingPlan.planningPerVehicleUsdMid,
  );
  const shipmentVehicleCount = Math.min(3, Math.max(1, state.cases.length));
  const shipmentTarget = shippingPlan.vehicleQuantity;
  const filledShipmentSlots = Math.min(shipmentVehicleCount, shipmentTarget);
  const missingShipmentSlots = Math.max(0, shipmentTarget - shipmentVehicleCount);
  const fillText = shipmentFillCopy(language, missingShipmentSlots);
  const slotText = shipmentSlotCopy(language);
  const fillCarUnit = (count: number) => language === "en" ? (count === 1 ? "car" : "cars") : fillText.car;
  const shipmentCases = [vehicleCase, ...state.cases.filter((item) => item.id !== vehicleCase.id)].slice(0, shipmentTarget);
  const shipmentSlots = Array.from({ length: shipmentTarget }, (_, index) => shipmentCases[index] || null);
  const shipmentSetKnownSubtotalThb = shipmentCases.reduce((total, item) => total + knownCaseSubtotalThb(item), 0);
  const shipmentSetShippingUsd = shippingPlan.planningPerVehicleUsdMid === null || shippingPlan.planningPerVehicleUsdMid === undefined
    ? null
    : shippingPlan.planningPerVehicleUsdMid * shipmentCases.length;
  const shipmentSetTotalUsd = shipmentSetShippingUsd === null
    ? null
    : Math.round(shipmentSetKnownSubtotalThb / CUSTOMER_FX_THB_PER_USD) + shipmentSetShippingUsd;
  const quoteChoices = [1, 2, 3].map((count) => {
    const optionPlan = shippingPlanForSelection(shippingCountry, count);
    return {
      count,
      ...quoteChoiceCopy(language, count),
      amount: formatUsdAmount(optionPlan.planningPerVehicleUsdMid),
    };
  });
  const displayedLineAmount = (line: { key: string; amountThb: number | null }) => {
    if (line.key === "shipping" && line.amountThb === null && planningPerVehicleMid) return `${text.aboutPrefix} ${planningPerVehicleMid} ${text.perCarSuffix}`;
    if (line.key === "shipping" && line.amountThb === null && !shippingPlan.destinationCountry) return text.chooseDestinationFirst;
    return line.amountThb === null ? t("pending") : formatUsdFromThb(line.amountThb);
  };
  const displayedLineClass = (line: { key: string; amountThb: number | null; status: string }) => (
    line.key === "shipping" && line.amountThb === null && planningPerVehicle ? "estimate" : line.status === "Pending" ? "pending" : ""
  );
  const displayedLineStatus = (line: { key: string; amountThb: number | null; status: string }) => {
    if (line.key === "shipping" && line.amountThb === null && planningPerVehicle) return "Estimate";
    return line.status === "Pending" ? "Not calculated yet" : "Confirmed";
  };
  return (
    <div className="bb-pricing-tool">
      <header><div><p className="bb-kicker">{t("transparentPricing")}</p><h2>{t("workingPriceStructure")}</h2></div></header>
      <div className="bb-price-lines">
        {pricing.lines.map((line) => <div key={line.key}><span>{line.status === "Known" ? <Check size={15} /> : <Clock3 size={15} />}<b>{labels[line.key] || line.key}</b><em className={displayedLineClass(line)}>{displayedLineStatus(line)}</em></span><strong className={displayedLineClass(line)}>{displayedLineAmount(line)}</strong></div>)}
      </div>
      <section className="bb-shipping-planner" aria-label={text.title}>
        <header><Ship size={17} /><div><b>{text.title}</b><small>{text.rule}</small></div></header>
        <div>
          <label><span>{text.country}</span><select disabled={shippingLocked} value={shippingCountry} onChange={(event) => updateCountry(event.target.value)}><option value="">{text.choose}</option>{SHIPPING_DESTINATIONS.map((item) => <option value={item.country} key={item.country}>{item.country} - {item.port}</option>)}</select></label>
          <label><span>{text.quantity}</span><select disabled={shippingLocked} value={shippingQuantity} onChange={(event) => updateQuantity(Number(event.target.value))}>{[1, 2, 3].map((count) => <option value={count} key={count}>{quantityOptionLabel(count)}</option>)}</select></label>
        </div>
        <p><Info size={15} />{text.shareNote(shippingPlan.vehicleQuantity)}</p>
        {shippingPlan.destinationCountry && <section className="bb-shipping-options" aria-label="Shipment quote options">
          {quoteChoices.map((choice) => <button key={choice.count} type="button" className={choice.count === shippingPlan.vehicleQuantity ? "active" : ""} disabled={shippingLocked} onClick={() => updateQuantity(choice.count)}>
            <span><b>{choice.title}{choice.tag && <i>{choice.tag}</i>}</b><small>{choice.note}</small></span>
            <strong>{choice.amount || t("pending")}</strong>
          </button>)}
        </section>}
        {shippingPlan.destinationCountry && <dl>
          <div><dt>{text.planningFreight}</dt><dd>{planningPerVehicleMid ? `${text.aboutPrefix} ${planningPerVehicleMid}` : t("pending")}<br />{planningPerVehicle && <small>{text.estimateRange}: {planningPerVehicle}. {text.shareNote(shippingPlan.vehicleQuantity)}</small>}</dd></div>
          <div><dt>{text.fullShipment}</dt><dd>{planningShipment || t("pending")}</dd></div>
          {shippingPlan.containerLoadingFeeUsd > 0 && <div><dt>{text.loadingService}</dt><dd>{text.loadingServiceNote(shippingPlan.containerLoadingFeeUsd, shippingPlan.containerLoadingPerVehicleUsd)}</dd></div>}
          <div><dt>Route type</dt><dd>{shippingPlan.routeType || t("pending")}</dd></div>
          <div><dt>Benchmark group</dt><dd>{shippingPlan.benchmarkGroup || t("pending")}</dd></div>
          <div><dt>Gateway / transit plan</dt><dd>{shippingPlan.routeNote || t("pending")}</dd></div>
          <div><dt>Import eligibility</dt><dd>{shippingPlan.importNote || t("pending")}</dd></div>
          <div><dt>{text.marketBenchmark}</dt><dd>{marketBenchmark || t("pending")}</dd></div>
          <div><dt>{text.sourcePrefix}</dt><dd>{shippingPlan.indicativeFreightSource || text.noIndicativeFreight}</dd></div>
          {planningFreight && <div><dt>{`${bufferPercent}% buffer`}</dt><dd>{text.bufferNote}</dd></div>}
        </dl>}
        <section className="bb-shipping-fill">
          <header><b>{fillText.title}</b><span>{missingShipmentSlots ? fillText.missing : fillText.ready}</span></header>
          <dl>
            <div><dt>{fillText.progress}</dt><dd>{filledShipmentSlots}/{shipmentTarget} {fillCarUnit(shipmentTarget)}</dd></div>
            <div><dt>{fillText.add}</dt><dd>{missingShipmentSlots} {fillCarUnit(missingShipmentSlots)}</dd></div>
            <div><dt>{fillText.estimate}</dt><dd>{estimatedTotalWithShipping || knownSubtotal}</dd></div>
          </dl>
          <p>{fillText.note}</p>
          <section className="bb-shipment-slots" aria-label={slotText.title}>
            <header><b>{slotText.title}</b><small>{slotText.currentSet}</small></header>
            <div>
              {shipmentSlots.map((item, index) => item ? (
                <article key={item.id} className="filled">
                  <VehiclePhoto listing={item.vehicle} />
                  <div><small>{slotText.filled} {index + 1}</small><b>{item.vehicle.year ?? t("pending")} {item.vehicle.brand} {item.vehicle.model}</b><span>{formatUsdFromThb(item.vehicle.observedPriceThb)}</span></div>
                  <Link href={`/buy/cases/${encodeURIComponent(item.id)}`}>{slotText.openCase}</Link>
                </article>
              ) : (
                <article key={`empty-${index}`} className="empty">
                  <span>{index + 1}</span>
                  <div><small>{slotText.empty}</small><b>{slotText.add}</b><p>{slotText.addHint}</p></div>
                  <Link href="/buy">{slotText.add}</Link>
                </article>
              ))}
            </div>
            <footer><span>{slotText.groupTotal}</span><strong>{formatUsdAmount(shipmentSetTotalUsd) || knownSubtotal}</strong></footer>
          </section>
          {missingShipmentSlots > 0 && <nav aria-label={fillText.title}>
            <Link href="/buy"><Search size={15} />{fillText.browse}</Link>
            <Link href="/buy/paste"><SquarePlus size={15} />{fillText.paste}</Link>
            <Link href="/buy/ask"><Bot size={15} />{fillText.ask}</Link>
          </nav>}
        </section>
        <p><Info size={15} />{shippingLocked ? text.locked : text.freightPending}</p>
      </section>
      <div className="bb-fee-inclusions">
        <details><summary>{t("platformTransactionFee")} <span>{t("whatsIncluded")}</span></summary><p>{t("platformIncluded")}</p></details>
        <details><summary>{t("buyingServiceFee")} <span>{t("whatsIncluded")}</span></summary><p>{t("buyingIncluded")}</p></details>
        <p><Info size={15} />{t("nkServiceDisclosure")}</p>
      </div>
      <footer><div><small>{estimatedTotalWithShipping ? text.estimatedTotal : t("knownSubtotal")}</small><strong>{estimatedTotalWithShipping || knownSubtotal}</strong></div><p><Info size={15} />{estimatedTotalWithShipping && planningPerVehicleMid ? `${text.estimatedTotalNote(knownSubtotal, planningPerVehicleMid)} ` : ""}{pricing.pendingCount ? `${t("pendingCosts", { count: pricing.pendingCount })} ${t("finalPurchasePriceNote")} ${customerFxDisclosure()}` : `${t("allCostsIncluded")} ${t("finalPurchasePriceNote")} ${customerFxDisclosure()}`}</p></footer>
    </div>
  );
}
