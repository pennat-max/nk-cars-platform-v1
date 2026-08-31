"use client";

import Link from "next/link";
import { Clock3, FileText, LockKeyhole } from "lucide-react";
import { currentProformaInvoiceStatus } from "../pi-domain.mjs";
import { formatDateTime } from "../format";
import type { CustomerLanguage, VehicleCase } from "../types";
import { useBuyingBrowser } from "../BuyingBrowserProvider";

const copy = {
  en: { title: "Proforma Invoice", issued: "Issued", valid: "Valid until", quote: "Accepted quotation", payment: "Payment status", notConfirmed: "Not confirmed", open: "View / print PI", expired: "Expired - Owner recheck required", superseded: "Superseded", note: "This PI records approved amounts. Only authorized Finance can confirm actual funds received." },
  "zh-CN": { title: "形式发票", issued: "签发时间", valid: "有效期至", quote: "已接受报价", payment: "付款状态", notConfirmed: "未确认", open: "查看 / 打印 PI", expired: "已过期 - 需车主重新核查", superseded: "已被替代", note: "此 PI 记录已批准金额。仅授权财务人员可确认实际到账。" },
  th: { title: "Proforma Invoice", issued: "ออกเมื่อ", valid: "ใช้ได้ถึง", quote: "ใบเสนอราคาที่ยอมรับแล้ว", payment: "สถานะการชำระเงิน", notConfirmed: "ยังไม่ยืนยัน", open: "ดู / พิมพ์ PI", expired: "หมดอายุ - ต้องให้ Owner ตรวจใหม่", superseded: "ถูกแทนที่แล้ว", note: "PI นี้บันทึกยอดที่อนุมัติ เฉพาะฝ่ายการเงินที่ได้รับสิทธิ์จึงยืนยันเงินที่รับจริงได้" },
} satisfies Record<CustomerLanguage, Record<string, string>>;

export default function ProformaInvoicePanel({ vehicleCase, basePath = "/buy" }: { vehicleCase: VehicleCase; basePath?: string }) {
  const { language } = useBuyingBrowser();
  const invoice = vehicleCase.proformaInvoice;
  if (!invoice) return null;
  const text = copy[language];
  const status = currentProformaInvoiceStatus(invoice, new Date());
  const statusLabel = status === "Expired" ? text.expired : status === "Superseded" ? text.superseded : invoice.status;
  return <section className="bb-pi-panel" data-customer-pi>
    <header><div><p className="bb-kicker">{invoice.number}</p><h2>{text.title}</h2></div><span className={`bb-status-chip ${status === "Issued - Awaiting Payment" ? "requested" : "pending"}`}><Clock3 size={13} />{statusLabel}</span></header>
    <dl><div><dt>{text.issued}</dt><dd>{formatDateTime(invoice.issuedAt)}</dd></div><div><dt>{text.valid}</dt><dd>{formatDateTime(invoice.validUntil)}</dd></div><div><dt>{text.quote}</dt><dd>{invoice.quotationNumber}</dd></div><div><dt>{text.payment}</dt><dd>{text.notConfirmed}</dd></div></dl>
    <div className="bb-pi-total"><span>USD</span><strong>{invoice.totalUsd.toLocaleString("en-US")}</strong></div>
    <Link className="bb-button primary" href={`${basePath}/cases/${encodeURIComponent(vehicleCase.id)}/pi`}><FileText size={17} />{text.open}</Link>
    <p><LockKeyhole size={15} />{text.note}</p>
  </section>;
}
