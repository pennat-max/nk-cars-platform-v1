"use client";

import { Check, Clock3, Info } from "lucide-react";
import { calculatePricing } from "../domain.mjs";
import { customerFxDisclosure, formatUsdFromThb } from "../format";
import type { VehicleCase } from "../types";

export default function PricingBreakdown({ vehicleCase }: { vehicleCase: VehicleCase }) {
  const pricing = calculatePricing({
    vehiclePriceThb: vehicleCase.vehicle.observedPriceThb,
    commissionRate: vehicleCase.commissionRate,
    inspectionTravelThb: vehicleCase.inspectionQuote?.totalThb ?? null,
    domesticTransportThb: vehicleCase.domesticTransportThb,
    repairModificationThb: vehicleCase.repairModificationThb,
    exportShippingThb: vehicleCase.exportShippingThb,
    otherAgreedThb: vehicleCase.otherAgreedThb,
  });
  return (
    <div className="bb-pricing-tool">
      <header><div><p className="bb-kicker">Transparent pricing</p><h2>Working price structure</h2></div><span>{pricing.commissionRate}% service fee</span></header>
      <div className="bb-price-lines">
        {pricing.lines.map((line) => <div key={line.key}><span>{line.status === "Known" ? <Check size={15} /> : <Clock3 size={15} />}<b>{line.label}</b></span><strong className={line.status === "Pending" ? "pending" : ""}>{formatUsdFromThb(line.amountThb)}</strong></div>)}
      </div>
      <footer><div><small>Known subtotal</small><strong>{formatUsdFromThb(pricing.knownSubtotalThb)}</strong></div><p><Info size={15} />{pricing.pendingCount ? `${pricing.pendingCount} pending cost lines are excluded. This is not a final quote. ${customerFxDisclosure()}` : `All current cost lines are included. Final approval is still required. ${customerFxDisclosure()}`}</p></footer>
    </div>
  );
}
