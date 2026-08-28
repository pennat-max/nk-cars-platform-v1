"use client";

import { Check, Clock3, Info, Ship } from "lucide-react";
import { calculatePricing, shippingPlanForSelection, SHIPPING_DESTINATIONS, SHIPPING_PLANNING_BUFFER_RATE } from "../domain.mjs";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { customerFxDisclosure, formatUsdFromThb } from "../format";
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
}> = {
  en: {
    title: "Destination and shipping estimate",
    country: "Destination country",
    quantity: "Cars in this shipment",
    choose: "Choose country",
    rule: "You can plan 1 to 3 cars in one shipment. The range below is for planning only; final freight is confirmed when NK books the route.",
    freightPending: "Export / Shipping remains Pending until NK confirms the live forwarder or booking rate. The final rate can move up or down.",
    loadingFee: "3-car container loading / stuffing fee",
    locked: "Shipping selection is locked after an approved quotation is issued.",
    planningFreight: "Estimated planning range",
    marketBenchmark: "Public market benchmark",
    bufferNote: "Upper range includes a planning buffer. Final booking may be higher or lower.",
    noIndicativeFreight: "No reliable public route estimate found yet. NK quote is required before final pricing.",
    sourcePrefix: "Source",
  },
  "zh-CN": {
    title: "目的地和运费估算",
    country: "目的地国家",
    quantity: "本次运输车辆数",
    choose: "选择国家",
    rule: "客户可计划每次运输 1 至 3 辆车。以下范围仅供计划使用；最终运费以 NK 实际订舱确认为准。",
    freightPending: "Export / Shipping 仍为 Pending，直到 NK 确认实时货代或订舱价格。最终价格可能上调或下调。",
    loadingFee: "3 辆车装柜 / 装载费",
    locked: "批准报价发出后，运输选择将被锁定。",
    planningFreight: "计划用估算范围",
    marketBenchmark: "公开市场参考价",
    bufferNote: "区间上限包含计划缓冲。实际订舱价格可能更高或更低。",
    noIndicativeFreight: "尚未找到可靠的公开路线估算。最终定价前需要 NK 报价。",
    sourcePrefix: "来源",
  },
  th: {
    title: "ปลายทางและค่าชิปปิ้งประมาณการ",
    country: "ประเทศปลายทาง",
    quantity: "จำนวนรถในรอบส่งนี้",
    choose: "เลือกประเทศ",
    rule: "ลูกค้าสามารถวางแผนส่งได้ 1 ถึง 3 คันต่อรอบ ช่วงราคาด้านล่างใช้เพื่อวางแผนเท่านั้น ราคาจริงยืนยันตอน NK booking เส้นทางจริง",
    freightPending: "ยอด Export / Shipping ยังเป็น Pending จนกว่า NK จะยืนยันราคาจริงจาก forwarder หรือ booking ราคาจริงอาจขึ้นหรือลงได้",
    loadingFee: "ค่าบรรจุ / ชิ่งตู้สำหรับ 3 คัน",
    locked: "หลังออกใบเสนอราคาที่อนุมัติแล้ว ระบบจะล็อกตัวเลือกชิปปิ้ง",
    planningFreight: "ช่วงราคาประมาณการสำหรับวางแผน",
    marketBenchmark: "ราคาอ้างอิงจากตลาด",
    bufferNote: "ปลายบนของช่วงราคานี้รวม buffer สำหรับวางแผน ราคาจริงตอน booking อาจสูงหรือต่ำกว่าได้",
    noIndicativeFreight: "ยังไม่พบราคาประมาณการสาธารณะที่น่าเชื่อถือสำหรับเส้นทางนี้ ต้องให้ NK ขอราคาก่อนออกยอดสุดท้าย",
    sourcePrefix: "แหล่งข้อมูล",
  },
};

function formatUsdRange(low: number | null, high: number | null) {
  if (low === null || high === null) return null;
  if (low === high) return `USD ${low.toLocaleString("en-US")}`;
  return `USD ${low.toLocaleString("en-US")} - ${high.toLocaleString("en-US")}`;
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
  const bufferPercent = Math.round((shippingPlan.planningBufferRate ?? SHIPPING_PLANNING_BUFFER_RATE) * 100);
  const pricing = calculatePricing({
    vehiclePriceThb: vehicleCase.actualVehiclePurchasePriceThb ?? vehicleCase.vehicle.observedPriceThb,
    platformTransactionRate: vehicleCase.platformTransactionRate,
    buyingServiceRate: vehicleCase.buyingServiceRate,
    inspectionTravelThb: vehicleCase.inspectionQuote?.totalThb ?? null,
    domesticTransportThb: vehicleCase.domesticTransportThb,
    repairModificationThb: vehicleCase.repairModificationThb,
    exportShippingThb: vehicleCase.exportShippingThb,
    containerLoadingFeeThb: vehicleCase.shippingContainerLoadingFeeThb ?? shippingPlan.containerLoadingFeeThb,
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
  return (
    <div className="bb-pricing-tool">
      <header><div><p className="bb-kicker">{t("transparentPricing")}</p><h2>{t("workingPriceStructure")}</h2></div></header>
      <div className="bb-price-lines">
        {pricing.lines.map((line) => <div key={line.key}><span>{line.status === "Known" ? <Check size={15} /> : <Clock3 size={15} />}<b>{labels[line.key] || line.key}</b></span><strong className={line.status === "Pending" ? "pending" : ""}>{line.amountThb === null ? t("pending") : formatUsdFromThb(line.amountThb)}</strong></div>)}
      </div>
      <section className="bb-shipping-planner" aria-label={text.title}>
        <header><Ship size={17} /><div><b>{text.title}</b><small>{text.rule}</small></div></header>
        <div>
          <label><span>{text.country}</span><select disabled={shippingLocked} value={shippingCountry} onChange={(event) => updateCountry(event.target.value)}><option value="">{text.choose}</option>{SHIPPING_DESTINATIONS.map((item) => <option value={item.country} key={item.country}>{item.country} - {item.port}</option>)}</select></label>
          <label><span>{text.quantity}</span><select disabled={shippingLocked} value={shippingQuantity} onChange={(event) => updateQuantity(Number(event.target.value))}>{[1, 2, 3].map((count) => <option value={count} key={count}>{count}</option>)}</select></label>
        </div>
        {shippingPlan.destinationCountry && <dl><div><dt>{text.planningFreight}</dt><dd>{planningFreight || t("pending")}</dd></div><div><dt>{text.marketBenchmark}</dt><dd>{marketBenchmark || t("pending")}</dd></div><div><dt>{text.sourcePrefix}</dt><dd>{marketBenchmark ? shippingPlan.indicativeFreightSource : text.noIndicativeFreight}</dd></div>{planningFreight && <div><dt>{`${bufferPercent}% buffer`}</dt><dd>{text.bufferNote}</dd></div>}</dl>}
        <p><Info size={15} />{shippingLocked ? text.locked : text.freightPending}</p>
      </section>
      <div className="bb-fee-inclusions">
        <details><summary>{t("platformTransactionFee")} <span>{t("whatsIncluded")}</span></summary><p>{t("platformIncluded")}</p></details>
        <details><summary>{t("buyingServiceFee")} <span>{t("whatsIncluded")}</span></summary><p>{t("buyingIncluded")}</p></details>
        <p><Info size={15} />{t("nkServiceDisclosure")}</p>
      </div>
      <footer><div><small>{t("knownSubtotal")}</small><strong>{formatUsdFromThb(pricing.knownSubtotalThb)}</strong></div><p><Info size={15} />{pricing.pendingCount ? `${t("pendingCosts", { count: pricing.pendingCount })} ${t("finalPurchasePriceNote")} ${customerFxDisclosure()}` : `${t("allCostsIncluded")} ${t("finalPurchasePriceNote")} ${customerFxDisclosure()}`}</p></footer>
    </div>
  );
}
