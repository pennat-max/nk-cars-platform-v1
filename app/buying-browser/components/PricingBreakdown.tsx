"use client";

import { Check, Clock3, Info, Ship } from "lucide-react";
import { calculatePricing, shippingPlanForSelection, SHIPPING_DESTINATIONS } from "../domain.mjs";
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
  indicativeFreight: string;
  noIndicativeFreight: string;
  sourcePrefix: string;
}> = {
  en: {
    title: "Destination and shipping plan",
    country: "Destination country",
    quantity: "Cars in this shipment",
    choose: "Choose country",
    rule: "You can plan 1 to 3 cars in one shipment. Ocean freight is confirmed after NK checks the approved rate source for the selected route.",
    freightPending: "Main ocean freight remains Pending until NK confirms the current route rate.",
    loadingFee: "3-car container loading / stuffing fee",
    locked: "Shipping selection is locked after an approved quotation is issued.",
    indicativeFreight: "Indicative ocean freight",
    noIndicativeFreight: "No reliable public route estimate found yet. NK quote is required before final pricing.",
    sourcePrefix: "Source",
  },
  "zh-CN": {
    title: "目的地和海运计划",
    country: "目的地国家",
    quantity: "本次运输车辆数",
    choose: "选择国家",
    rule: "客户可计划每次运输 1 至 3 辆车。NK 按已批准的费率来源核实所选路线后，才确认海运费。",
    freightPending: "主要海运费仍待 NK 按当前路线费率确认。",
    loadingFee: "3 辆车装柜 / 装载费",
    locked: "批准报价发出后，海运选择将被锁定。",
    indicativeFreight: "海运费参考估算",
    noIndicativeFreight: "尚未找到可靠的公开路线估算。最终价格前需要 NK 报价。",
    sourcePrefix: "来源",
  },
  th: {
    title: "ปลายทางและแผนชิปปิ้ง",
    country: "ประเทศปลายทาง",
    quantity: "จำนวนรถในรอบส่งนี้",
    choose: "เลือกประเทศ",
    rule: "ลูกค้าสามารถวางแผนส่งได้ 1 ถึง 3 คันต่อรอบ ค่าระวางเรือจะยืนยันหลัง NK ตรวจราคาจากแหล่งราคาที่อนุมัติสำหรับเส้นทางนั้น",
    freightPending: "ค่าระวางเรือหลักยังรอยืนยันจนกว่า NK จะตรวจราคาปัจจุบันของเส้นทาง",
    loadingFee: "ค่าบรรจุ / ชิ่งตู้สำหรับ 3 คัน",
    locked: "หลังออกใบเสนอราคาที่อนุมัติแล้ว ระบบจะล็อกตัวเลือกชิปปิ้ง",
    indicativeFreight: "ค่าระวางเรือประมาณการ",
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
  const indicativeFreight = formatUsdRange(shippingPlan.indicativeFreightUsdLow, shippingPlan.indicativeFreightUsdHigh);
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
        {shippingPlan.destinationCountry && <dl><div><dt>{text.indicativeFreight}</dt><dd>{indicativeFreight || t("pending")}</dd></div><div><dt>{text.sourcePrefix}</dt><dd>{indicativeFreight ? shippingPlan.indicativeFreightSource : text.noIndicativeFreight}</dd></div></dl>}
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
