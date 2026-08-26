"use client";

import Link from "next/link";
import { ArrowLeft, LockKeyhole, Printer } from "lucide-react";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import { formatDateTime } from "../format";
import { currentProformaInvoiceStatus } from "../pi-domain.mjs";
import { useI18n } from "../use-i18n";
import type { CustomerLanguage } from "../types";

const copy = {
  en: { title: "Proforma Invoice", billTo: "Prepared for", vehicle: "Vehicle Case", quote: "Accepted quotation", issued: "Issue date", valid: "Valid until", fx: "Recorded exchange rate", payment: "Payment status", notConfirmed: "Not confirmed", print: "Print / Save PDF", back: "Back to Vehicle Case", amount: "Amount", item: "Description", total: "Total", boundary: "This document is not a receipt and does not confirm payment. Authorized NK Finance must confirm actual funds received separately.", setup: "Authorized payment instructions and complete legal issuer details are provided separately after Owner/Finance setup; they are not invented in this document." },
  "zh-CN": { title: "形式发票", billTo: "客户", vehicle: "车辆案件", quote: "已接受报价", issued: "签发日期", valid: "有效期至", fx: "记录汇率", payment: "付款状态", notConfirmed: "未确认", print: "打印 / 保存 PDF", back: "返回车辆案件", amount: "金额", item: "说明", total: "总计", boundary: "本文件不是收据，也不确认已付款。授权的 NK 财务人员必须另行确认实际到账。", setup: "授权付款指示和完整法律出票人信息将在 Owner/财务设置后另行提供；本文件不会虚构这些信息。" },
  th: { title: "Proforma Invoice", billTo: "จัดทำให้", vehicle: "Vehicle Case", quote: "ใบเสนอราคาที่ยอมรับแล้ว", issued: "วันที่ออก", valid: "ใช้ได้ถึง", fx: "อัตราแลกเปลี่ยนที่บันทึก", payment: "สถานะการชำระเงิน", notConfirmed: "ยังไม่ยืนยัน", print: "พิมพ์ / บันทึก PDF", back: "กลับไป Vehicle Case", amount: "จำนวนเงิน", item: "รายการ", total: "ยอดรวม", boundary: "เอกสารนี้ไม่ใช่ใบเสร็จและไม่ยืนยันการชำระเงิน ฝ่ายการเงิน NK ที่ได้รับสิทธิ์ต้องยืนยันเงินที่รับจริงแยกต่างหาก", setup: "คำแนะนำการชำระเงินที่ได้รับอนุญาตและข้อมูลนิติบุคคลผู้ออกเอกสารที่ครบถ้วนจะให้แยกต่างหากหลัง Owner/ฝ่ายการเงินตั้งค่า เอกสารนี้จะไม่สร้างข้อมูลเหล่านี้ขึ้นเอง" },
} satisfies Record<CustomerLanguage, Record<string, string>>;

function usd(amountThb: number | null, fx: number) {
  return amountThb === null ? "Pending" : `USD ${Math.round(amountThb / fx).toLocaleString("en-US")}`;
}

export default function ProformaInvoiceScreen({ caseId }: { caseId?: string }) {
  const { customer, hydrated, findCaseById, language } = useBuyingBrowser();
  const { t } = useI18n();
  const vehicleCase = caseId ? findCaseById(caseId) : undefined;
  const text = copy[language];
  if (!hydrated) return <section className="bb-loading-state"><span /><p>Loading PI...</p></section>;
  if (!vehicleCase?.proformaInvoice) return <section className="bb-empty-state"><h1>PI not found</h1><p>A PI appears only after an accepted quotation and Owner issue.</p><Link className="bb-button primary" href={caseId ? `/buy/cases/${encodeURIComponent(caseId)}` : "/buy/cases"}>{text.back}</Link></section>;
  const invoice = vehicleCase.proformaInvoice;
  const status = currentProformaInvoiceStatus(invoice, new Date());
  const labels: Record<string, string> = { vehicle: t("vehiclePrice"), platformTransaction: t("platformTransactionFee"), buyingService: t("buyingServiceFee"), inspection: t("inspectionTravel"), transport: t("domesticTransport"), repair: t("repairModification"), shipping: t("exportShipping"), other: t("otherAgreedCharges") };
  return <div className="bb-pi-document-page">
    <div className="bb-pi-document-actions"><Link className="bb-button secondary" href={`/buy/cases/${encodeURIComponent(vehicleCase.id)}`}><ArrowLeft size={17} />{text.back}</Link><button className="bb-button primary" onClick={() => window.print()}><Printer size={17} />{text.print}</button></div>
    <article className="bb-pi-document" data-pi-document>
      <header><div className="bb-pi-brand"><span>NK</span><div><b>NK Cars</b><small>Buying service platform</small></div></div><div><h1>{text.title}</h1><strong>{invoice.number}</strong><span className={`bb-status-chip ${status === "Issued - Awaiting Payment" ? "requested" : "pending"}`}>{status}</span></div></header>
      <section className="bb-pi-parties"><div><small>{text.billTo}</small><b>{customer.displayName}</b><span>{customer.country} - {customer.destinationPort}</span></div><div><small>{text.vehicle}</small><b>{vehicleCase.id}</b><span>{vehicleCase.vehicle.title}</span></div></section>
      <dl className="bb-pi-document-meta"><div><dt>{text.quote}</dt><dd>{invoice.quotationNumber}</dd></div><div><dt>{text.issued}</dt><dd>{formatDateTime(invoice.issuedAt)}</dd></div><div><dt>{text.valid}</dt><dd>{formatDateTime(invoice.validUntil)}</dd></div><div><dt>{text.fx}</dt><dd>THB {invoice.fxRateThbPerUsd.toFixed(2)} = USD 1</dd></div><div><dt>{text.payment}</dt><dd>{text.notConfirmed}</dd></div></dl>
      <table><thead><tr><th>{text.item}</th><th>{text.amount}</th></tr></thead><tbody>{invoice.pricing.lines.map((line) => <tr key={line.key}><td>{labels[line.key] || line.key}</td><td>{usd(line.amountThb, invoice.fxRateThbPerUsd)}</td></tr>)}</tbody><tfoot><tr><th>{text.total}</th><th>USD {invoice.totalUsd.toLocaleString("en-US")}</th></tr></tfoot></table>
      <footer><p><LockKeyhole size={15} />{text.boundary}</p><p>{text.setup}</p></footer>
    </article>
  </div>;
}
