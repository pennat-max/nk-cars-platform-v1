"use client";

import { CheckCircle2, Clock3, FileCheck2, Info, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { currentQuotationStatus } from "../quotation-domain.mjs";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { formatDateTime } from "../format";
import { useI18n } from "../use-i18n";
import type { CustomerLanguage, VehicleCase } from "../types";

const copy = {
  en: { title: "Approved quotation", issued: "Issued", valid: "Valid until", fx: "Recorded FX", accept: "Accept quotation", accepting: "Recording...", accepted: "Quotation accepted", expired: "Quotation expired", superseded: "Quotation replaced after material facts changed", note: "Acceptance records this exact quotation. It does not confirm payment or purchase the vehicle.", acceptedNote: "PI review may now proceed. No payment, seller transfer, or vehicle purchase has occurred.", failed: "Acceptance could not be recorded. Refresh the Case and try again." },
  "zh-CN": { title: "已批准报价", issued: "签发时间", valid: "有效期至", fx: "记录汇率", accept: "接受报价", accepting: "正在记录...", accepted: "报价已接受", expired: "报价已过期", superseded: "重要信息变更后报价已失效", note: "接受操作仅记录此份报价，不代表已付款或已购车。", acceptedNote: "现可进入 PI 审核，但尚未付款、向卖家转账或购买车辆。", failed: "无法记录接受操作，请刷新案件后重试。" },
  th: { title: "ใบเสนอราคาที่อนุมัติแล้ว", issued: "ออกเมื่อ", valid: "ใช้ได้ถึง", fx: "อัตราแลกเปลี่ยนที่บันทึก", accept: "ยอมรับใบเสนอราคา", accepting: "กำลังบันทึก...", accepted: "ยอมรับใบเสนอราคาแล้ว", expired: "ใบเสนอราคาหมดอายุ", superseded: "ใบเสนอราคาใช้ไม่ได้หลังข้อมูลสำคัญเปลี่ยน", note: "การยอมรับเป็นการบันทึกใบเสนอราคาฉบับนี้เท่านั้น ไม่ใช่การยืนยันชำระเงินหรือซื้อรถ", acceptedNote: "สามารถเข้าสู่การตรวจ PI ได้ แต่ยังไม่มีการชำระเงิน โอนให้ผู้ขาย หรือซื้อรถ", failed: "บันทึกการยอมรับไม่ได้ กรุณารีเฟรชเคสแล้วลองอีกครั้ง" },
} satisfies Record<CustomerLanguage, Record<string, string>>;

function usd(amountThb: number | null, fx: number) {
  return amountThb === null ? "Pending" : `USD ${Math.round(amountThb / fx).toLocaleString("en-US")}`;
}

export default function QuotationPanel({ vehicleCase }: { vehicleCase: VehicleCase }) {
  const { language, acceptCaseQuotation } = useBuyingBrowser();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const quotation = vehicleCase.quotation;
  if (!quotation) return null;
  const text = copy[language];
  const status = currentQuotationStatus(quotation, new Date());
  const labels: Record<string, string> = { vehicle: t("vehiclePrice"), platformTransaction: t("platformTransactionFee"), buyingService: t("buyingServiceFee"), inspection: t("inspectionTravel"), transport: t("domesticTransport"), repair: t("repairModification"), shipping: t("exportShipping"), containerLoading: "3-car container loading / stuffing", other: t("otherAgreedCharges") };

  async function accept() {
    setSaving(true);
    setMessage("");
    try {
      await acceptCaseQuotation(vehicleCase.id, quotation!.number);
    } catch {
      setMessage(text.failed);
    } finally {
      setSaving(false);
    }
  }

  const statusLabel = status === "Accepted" ? text.accepted : status === "Expired" ? text.expired : status === "Superseded" ? text.superseded : quotation.status;
  return (
    <section className="bb-quotation-panel" data-customer-quotation>
      <header><div><p className="bb-kicker">{quotation.number}</p><h2>{text.title}</h2></div><span className={`bb-status-chip ${status === "Accepted" ? "market" : status === "Issued - Awaiting Acceptance" ? "requested" : "pending"}`}>{status === "Accepted" ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}{statusLabel}</span></header>
      <dl className="bb-quotation-meta"><div><dt>{text.issued}</dt><dd>{formatDateTime(quotation.issuedAt)}</dd></div><div><dt>{text.valid}</dt><dd>{formatDateTime(quotation.validUntil)}</dd></div><div><dt>{text.fx}</dt><dd>THB {quotation.fxRateThbPerUsd.toFixed(2)} = USD 1</dd></div></dl>
      <div className="bb-quotation-lines">{quotation.pricing.lines.map((line) => <div key={line.key}><span>{labels[line.key] || line.key}</span><strong>{usd(line.amountThb, quotation.fxRateThbPerUsd)}</strong></div>)}</div>
      <div className="bb-quotation-total"><span>{t("total")}</span><strong>USD {quotation.totalUsd.toLocaleString("en-US")}</strong></div>
      {status === "Issued - Awaiting Acceptance" && <button className="bb-button primary" disabled={saving} onClick={accept}><FileCheck2 size={17} />{saving ? text.accepting : text.accept}</button>}
      <p className="bb-quotation-boundary"><LockKeyhole size={15} />{status === "Accepted" ? text.acceptedNote : text.note}</p>
      {message && <p className="bb-quotation-error" role="status"><Info size={14} />{message}</p>}
    </section>
  );
}
