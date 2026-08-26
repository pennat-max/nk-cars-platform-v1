"use client";

import { Check, Clock3, Info } from "lucide-react";
import { calculatePricing } from "../domain.mjs";
import { customerFxDisclosure, formatUsdFromThb } from "../format";
import { useI18n } from "../use-i18n";
import type { VehicleCase } from "../types";

export default function PricingBreakdown({ vehicleCase }: { vehicleCase: VehicleCase }) {
  const { t } = useI18n();
  const pricing = calculatePricing({
    vehiclePriceThb: vehicleCase.actualVehiclePurchasePriceThb ?? vehicleCase.vehicle.observedPriceThb,
    platformTransactionRate: vehicleCase.platformTransactionRate,
    buyingServiceRate: vehicleCase.buyingServiceRate,
    inspectionTravelThb: vehicleCase.inspectionQuote?.totalThb ?? null,
    domesticTransportThb: vehicleCase.domesticTransportThb,
    repairModificationThb: vehicleCase.repairModificationThb,
    exportShippingThb: vehicleCase.exportShippingThb,
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
    other: t("otherAgreedCharges"),
  };
  return (
    <div className="bb-pricing-tool">
      <header><div><p className="bb-kicker">{t("transparentPricing")}</p><h2>{t("workingPriceStructure")}</h2></div></header>
      <div className="bb-price-lines">
        {pricing.lines.map((line) => <div key={line.key}><span>{line.status === "Known" ? <Check size={15} /> : <Clock3 size={15} />}<b>{labels[line.key] || line.key}</b></span><strong className={line.status === "Pending" ? "pending" : ""}>{line.amountThb === null ? t("pending") : formatUsdFromThb(line.amountThb)}</strong></div>)}
      </div>
      <div className="bb-fee-inclusions">
        <details><summary>{t("platformTransactionFee")} <span>{t("whatsIncluded")}</span></summary><p>{t("platformIncluded")}</p></details>
        <details><summary>{t("buyingServiceFee")} <span>{t("whatsIncluded")}</span></summary><p>{t("buyingIncluded")}</p></details>
        <p><Info size={15} />{t("nkServiceDisclosure")}</p>
      </div>
      <footer><div><small>{t("knownSubtotal")}</small><strong>{formatUsdFromThb(pricing.knownSubtotalThb)}</strong></div><p><Info size={15} />{pricing.pendingCount ? `${t("pendingCosts", { count: pricing.pendingCount })} ${t("finalPurchasePriceNote")} ${customerFxDisclosure()}` : `${t("allCostsIncluded")} ${t("finalPurchasePriceNote")} ${customerFxDisclosure()}`}</p></footer>
    </div>
  );
}
