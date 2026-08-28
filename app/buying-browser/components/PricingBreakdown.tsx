"use client";

import { Check, Clock3, Info, Ship } from "lucide-react";
import { calculatePricing, shippingPlanForSelection, SHIPPING_DESTINATIONS, SHIPPING_PLANNING_BUFFER_RATE } from "../domain.mjs";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { CUSTOMER_FX_THB_PER_USD, customerFxDisclosure, formatUsdFromThb } from "../format";
import { useI18n } from "../use-i18n";
import type { CustomerLanguage, VehicleCase } from "../types";

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
    loadingServiceNote: (totalUsd, perCarUsd) => `THB 22,000 service is included above: USD ${totalUsd.toLocaleString("en-US")} total, about USD ${perCarUsd.toLocaleString("en-US")} per car when shared by 3 cars.`,
    chooseDestinationFirst: "Choose country first",
    shareNote: (quantity) => quantity === 1 ? "1 car uses the full shipping estimate." : quantity === 2 ? "2 cars share the freight, so each car pays about half." : "Best value: 3 cars share the freight and the THB 22,000 Rushing/loading service.",
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
    loadingServiceNote: (totalUsd, perCarUsd) => `THB 22,000 服务费已包含在上方估算内：总计 USD ${totalUsd.toLocaleString("en-US")}，3 辆车分摊约每辆 USD ${perCarUsd.toLocaleString("en-US")}。`,
    chooseDestinationFirst: "请先选择国家",
    shareNote: (quantity) => quantity === 1 ? "1 辆车按完整运费估算。" : quantity === 2 ? "2 辆车分摊运费，每辆约为一半。" : "最划算：3 辆车分摊运费和 THB 22,000 Rushing/装柜服务费。",
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
    loadingServiceNote: (totalUsd, perCarUsd) => `รวมค่าบริการ 22,000 บาทไว้ในยอดด้านบนแล้ว คิดเป็น USD ${totalUsd.toLocaleString("en-US")} ทั้งตู้ หรือประมาณ USD ${perCarUsd.toLocaleString("en-US")} ต่อคันเมื่อหาร 3 คัน`,
    chooseDestinationFirst: "เลือกประเทศก่อน",
    shareNote: (quantity) => quantity === 1 ? "1 คันคิดค่าชิปปิ้งเต็มจำนวน" : quantity === 2 ? "2 คันแชร์ค่าระวาง ค่าต่อคันจึงประมาณครึ่งหนึ่ง" : "คุ้มสุด: 3 คันแชร์ค่าระวางและแชร์ค่าบริการ Rushing/ชิ่งตู้ 22,000 บาท",
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

export default function PricingBreakdown({ vehicleCase }: { vehicleCase: VehicleCase }) {
  const { t } = useI18n();
  const { language, updateCaseShippingPlan } = useBuyingBrowser();
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
  const displayedLineAmount = (line: { key: string; amountThb: number | null }) => {
    if (line.key === "shipping" && line.amountThb === null && planningPerVehicleMid) return `${text.aboutPrefix} ${planningPerVehicleMid} ${text.perCarSuffix}`;
    if (line.key === "shipping" && line.amountThb === null && !shippingPlan.destinationCountry) return text.chooseDestinationFirst;
    return line.amountThb === null ? t("pending") : formatUsdFromThb(line.amountThb);
  };
  const displayedLineClass = (line: { key: string; amountThb: number | null; status: string }) => (
    line.key === "shipping" && line.amountThb === null && planningPerVehicle ? "estimate" : line.status === "Pending" ? "pending" : ""
  );
  return (
    <div className="bb-pricing-tool">
      <header><div><p className="bb-kicker">{t("transparentPricing")}</p><h2>{t("workingPriceStructure")}</h2></div></header>
      <div className="bb-price-lines">
        {pricing.lines.map((line) => <div key={line.key}><span>{line.status === "Known" ? <Check size={15} /> : <Clock3 size={15} />}<b>{labels[line.key] || line.key}</b></span><strong className={displayedLineClass(line)}>{displayedLineAmount(line)}</strong></div>)}
      </div>
      <section className="bb-shipping-planner" aria-label={text.title}>
        <header><Ship size={17} /><div><b>{text.title}</b><small>{text.rule}</small></div></header>
        <div>
          <label><span>{text.country}</span><select disabled={shippingLocked} value={shippingCountry} onChange={(event) => updateCountry(event.target.value)}><option value="">{text.choose}</option>{SHIPPING_DESTINATIONS.map((item) => <option value={item.country} key={item.country}>{item.country} - {item.port}</option>)}</select></label>
          <label><span>{text.quantity}</span><select disabled={shippingLocked} value={shippingQuantity} onChange={(event) => updateQuantity(Number(event.target.value))}>{[1, 2, 3].map((count) => <option value={count} key={count}>{quantityOptionLabel(count)}</option>)}</select></label>
        </div>
        <p><Info size={15} />{text.shareNote(shippingPlan.vehicleQuantity)}</p>
        {shippingPlan.destinationCountry && <dl><div><dt>{text.planningFreight}</dt><dd>{planningPerVehicleMid ? `${text.aboutPrefix} ${planningPerVehicleMid}` : t("pending")}<br />{planningPerVehicle && <small>{text.estimateRange}: {planningPerVehicle}. {text.shareNote(shippingPlan.vehicleQuantity)}</small>}</dd></div><div><dt>{text.fullShipment}</dt><dd>{planningShipment || t("pending")}</dd></div>{shippingPlan.containerLoadingFeeUsd > 0 && <div><dt>{text.loadingService}</dt><dd>{text.loadingServiceNote(shippingPlan.containerLoadingFeeUsd, shippingPlan.containerLoadingPerVehicleUsd)}</dd></div>}<div><dt>{text.marketBenchmark}</dt><dd>{marketBenchmark || t("pending")}</dd></div><div><dt>{text.sourcePrefix}</dt><dd>{marketBenchmark ? shippingPlan.indicativeFreightSource : text.noIndicativeFreight}</dd></div>{planningFreight && <div><dt>{`${bufferPercent}% buffer`}</dt><dd>{text.bufferNote}</dd></div>}</dl>}
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
