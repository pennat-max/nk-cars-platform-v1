import Link from "next/link";
import { headers } from "next/headers";
import { CheckCircle2, Search, ShieldCheck, Wrench, FileText, ArrowRight } from "lucide-react";

function isXiangshihai(host: string) {
  return host === "xiangshihai.com" || host === "www.xiangshihai.com";
}

export async function generateMetadata() {
  const host = (await headers()).get("host")?.split(":")[0].toLowerCase() || "";
  return isXiangshihai(host)
    ? { title: "How Xiangshihai works", description: "How Xiangshihai helps customers find, verify, inspect, price, and buy vehicles in Thailand." }
    : { title: "How NK Auto Trade works", description: "How NK helps customers find, verify, inspect, price, and buy vehicles in Thailand." };
}

const steps = [
  [Search, "1. Tell us what you need", "Browse reviewed vehicles, paste a vehicle link, or describe the model, budget, year, transmission, drive and body style you need."],
  [ShieldCheck, "2. NK checks the evidence", "We keep source references internally, separate confirmed facts from unknowns, inspect photo coverage and quarantine duplicates or conflicting records."],
  [CheckCircle2, "3. Confirm the vehicle is available", "A listing is not proof that the vehicle is still for sale. Seller contact happens only after the customer asks NK to proceed and the case is authorized."],
  [Wrench, "4. Inspect before committing", "Inspection, documents, vehicle identity, condition and likely repair needs must be checked by real evidence and qualified people. AI does not certify vehicle condition."],
  [FileText, "5. Receive a verified quotation", "The quotation is prepared only after the vehicle price and material costs are verified. Estimates are clearly separated from confirmed amounts."],
] as const;

export default async function HowItWorksPage() {
  const host = (await headers()).get("host")?.split(":")[0].toLowerCase() || "";
  const xiangshihai = isXiangshihai(host);
  const brand = xiangshihai ? "Xiangshihai" : "NK";
  const branded = (text: string) => xiangshihai ? text.replace(/\bNK\b/g, brand) : text;
  return <main className="bb-trust-page">
    <section className="bb-trust-hero">
      <p className="bb-kicker">BUY THROUGH {brand.toUpperCase()}</p>
      <h1>A safer way to find a vehicle in Thailand</h1>
      <p>{brand} helps you search, compare and coordinate. We do not pretend that an online listing is a verified vehicle, and we do not contact a seller, reserve a vehicle or take payment merely because you saved a listing.</p>
      <div><Link className="bb-button primary" href="/buy/ask">Tell {brand} what you need <ArrowRight size={17}/></Link><Link className="bb-button secondary" href="/buy">Browse vehicles</Link></div>
    </section>

    <section className="bb-trust-steps">{steps.map(([Icon, title, text]) => <article key={title}><Icon size={24}/><div><h2>{branded(title)}</h2><p>{branded(text)}</p></div></article>)}</section>

    <section className="bb-trust-faq">
      <p className="bb-kicker">IMPORTANT QUESTIONS</p><h2>What customers should know</h2>
      <details><summary>Does {brand} own every vehicle shown?</summary><p>No. Vehicles may come from reviewed third-party listings or approved sources. Availability, ownership, price and condition must be verified before an offer.</p></details>
      <details><summary>Does “saved” mean reserved?</summary><p>No. Saving a vehicle creates a shortlist only. It does not contact the seller, reserve the vehicle, negotiate, purchase or authorize payment.</p></details>
      <details><summary>What happens when information is missing?</summary><p>It stays marked Unknown or Needs Review. Unknown information is never counted as a confirmed match.</p></details>
      <details><summary>Is the displayed amount a final quotation?</summary><p>No, unless {brand} has issued a dated quotation from verified records. Planning estimates and source asking prices can change.</p></details>
      <details><summary>When is a seller contacted?</summary><p>Only after a customer explicitly asks {brand} to proceed through a Vehicle Case and the required approval is present.</p></details>
    </section>

    <p className="bb-honesty-note"><ShieldCheck size={17}/> Privacy, service terms, deposits, refunds, import eligibility and final fees must be confirmed in the applicable customer agreement before a transaction.</p>
  </main>;
}
