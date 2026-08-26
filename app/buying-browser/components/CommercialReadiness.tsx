"use client";

import { CheckCircle2, CircleDashed, FileText, LockKeyhole } from "lucide-react";
import { assessQuotationReadiness } from "../domain.mjs";
import { useBuyingBrowser } from "../BuyingBrowserProvider";
import type { CustomerLanguage, QuotationReadiness, QuotationReadinessItem, VehicleCase } from "../types";

const copy = {
  en: {
    kicker: "Commercial next step",
    title: "Quotation readiness",
    ready: "Ready for NK review",
    notReady: "Verification required",
    pending: "{count} checks remain before a final quotation can be reviewed.",
    allReady: "All required facts and cost lines are recorded. NK review is still required before issue.",
    request: "Request quotation review",
    requested: "Quotation requested",
    pi: "Proforma Invoice (PI)",
    piBlocked: "Issued only after an approved final quotation is accepted.",
    finance: "A PI, invoice, receipt, or payment slip does not confirm payment. Authorized Finance must confirm actual funds received.",
    labels: { availability: "Vehicle availability verified", vehiclePrice: "Actual vehicle purchase price verified", inspection: "Inspection and travel confirmed", transport: "Domestic transport confirmed", repair: "Repair / modification confirmed", shipping: "Export / shipping confirmed", other: "Other agreed charges confirmed" },
  },
  "zh-CN": {
    kicker: "下一商务步骤",
    title: "报价准备状态",
    ready: "可提交 NK 审核",
    notReady: "需要核实",
    pending: "最终报价审核前仍有 {count} 项待确认。",
    allReady: "所需车辆信息和费用项目已记录，签发前仍需 NK 审核。",
    request: "申请报价审核",
    requested: "已申请报价",
    pi: "形式发票（PI）",
    piBlocked: "仅在批准的最终报价被接受后签发。",
    finance: "PI、发票、收据或付款凭证均不代表款项已到账，必须由授权财务人员确认实际收款。",
    labels: { availability: "已确认车辆可售", vehiclePrice: "已确认实际购车价格", inspection: "已确认验车及出行费用", transport: "已确认泰国内陆运输", repair: "已确认维修 / 改装", shipping: "已确认出口 / 海运费用", other: "已确认其他约定费用" },
  },
  th: {
    kicker: "ขั้นตอนการค้าถัดไป",
    title: "ความพร้อมของใบเสนอราคา",
    ready: "พร้อมให้ NK ตรวจสอบ",
    notReady: "ต้องตรวจสอบข้อมูล",
    pending: "เหลือ {count} รายการที่ต้องยืนยันก่อนตรวจใบเสนอราคาสุดท้าย",
    allReady: "บันทึกข้อมูลรถและค่าใช้จ่ายที่จำเป็นครบแล้ว แต่ NK ยังต้องตรวจสอบก่อนออกเอกสาร",
    request: "ขอให้ตรวจใบเสนอราคา",
    requested: "ขอใบเสนอราคาแล้ว",
    pi: "Proforma Invoice (PI)",
    piBlocked: "ออกหลังจากลูกค้ายอมรับใบเสนอราคาสุดท้ายที่ได้รับอนุมัติแล้วเท่านั้น",
    finance: "PI ใบกำกับ ใบเสร็จ หรือสลิป ไม่ได้ยืนยันว่าได้รับเงินแล้ว ฝ่ายการเงินที่ได้รับสิทธิ์ต้องยืนยันเงินจริงที่ได้รับ",
    labels: { availability: "ยืนยันว่ารถยังอยู่", vehiclePrice: "ยืนยันราคาซื้อรถจริง", inspection: "ยืนยันค่าตรวจรถและเดินทาง", transport: "ยืนยันค่าขนส่งในประเทศไทย", repair: "ยืนยันค่าซ่อม / ดัดแปลง", shipping: "ยืนยันค่าขนส่งออก / ค่าระวาง", other: "ยืนยันค่าใช้จ่ายอื่นที่ตกลงกัน" },
  },
} satisfies Record<CustomerLanguage, {
  kicker: string;
  title: string;
  ready: string;
  notReady: string;
  pending: string;
  allReady: string;
  request: string;
  requested: string;
  pi: string;
  piBlocked: string;
  finance: string;
  labels: Record<QuotationReadinessItem["key"], string>;
}>;

export default function CommercialReadiness({ vehicleCase }: { vehicleCase: VehicleCase }) {
  const { language, requestCaseQuotation } = useBuyingBrowser();
  const text = copy[language];
  const readiness = assessQuotationReadiness(vehicleCase) as QuotationReadiness;
  const requested = vehicleCase.quotationRequest?.status === "Requested - Awaiting NK Review";
  const summary = readiness.ready ? text.allReady : text.pending.replace("{count}", String(readiness.pendingCount));

  return (
    <section className="bb-commercial-readiness" aria-labelledby="quotation-readiness-title">
      <header>
        <div><p className="bb-kicker">{text.kicker}</p><h2 id="quotation-readiness-title">{text.title}</h2></div>
        <span className={`bb-status-chip ${readiness.ready ? "market" : "pending"}`}>{readiness.ready ? <CheckCircle2 size={13} /> : <CircleDashed size={13} />}{readiness.ready ? text.ready : text.notReady}</span>
      </header>
      <p>{summary}</p>
      <ul>{readiness.items.map((item) => <li key={item.key} className={item.ready ? "ready" : "pending"}>{item.ready ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}<span>{text.labels[item.key]}</span></li>)}</ul>
      <div className="bb-commercial-next">
        <div><FileText size={20} /><span><b>{text.pi}</b><small>{text.piBlocked}</small></span></div>
        <button className="bb-button primary" disabled={requested} onClick={() => requestCaseQuotation(vehicleCase.id)}>{requested ? <CheckCircle2 size={17} /> : <FileText size={17} />}{requested ? text.requested : text.request}</button>
      </div>
      <p className="bb-finance-boundary"><LockKeyhole size={15} />{text.finance}</p>
    </section>
  );
}
