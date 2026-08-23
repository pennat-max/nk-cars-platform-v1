"use client";

import { useEffect, useMemo, useState } from "react";
import { demoLeads, demoRules, demoVehicles, demoWanted } from "../data/demo";
import { defaultSource, markup, profit, thb } from "../lib/domain";
import type { Lead, LeadStage, Role, SourcingRule, Vehicle, Wanted } from "../types";
import VehicleEditor from "./VehicleEditor";

type View = "home" | "vehicles" | "marketplace" | "review" | "detail" | "vehicle360" | "leads" | "wanted" | "more" | "rules" | "add" | "inquiry";
const stages: LeadStage[] = ["New", "Qualified", "Vehicle Selected", "Availability Check", "Closed"];

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function StatusBadge({ state }: { state: string }) {
  const tone = state === "Published" || state === "Available" || state === "Verified" ? "green" : state === "Waiting Review" || state === "Searching" ? "amber" : state === "Sold" || state === "Rejected" || state === "Unavailable" ? "red" : state === "Reserved" || state === "Matched" ? "blue" : "slate";
  return <Badge tone={tone}>{state}</Badge>;
}

export default function NKPlatform() {
  const [role, setRole] = useState<Role>("Owner");
  const [view, setView] = useState<View>("home");
  const [vehicles, setVehicles] = useState<Vehicle[]>(demoVehicles);
  const [leads, setLeads] = useState<Lead[]>(demoLeads);
  const [wanted, setWanted] = useState<Wanted[]>(demoWanted);
  const [rules, setRules] = useState<SourcingRule[]>(demoRules);
  const [selectedId, setSelectedId] = useState("v4");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inquiry, setInquiry] = useState({ name: "", country: "Kenya", port: "Mombasa", quantity: "1", budget: "", requirement: "" });
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<{ from: "ai" | "user"; text: string }[]>([{ from: "ai", text: "Hello — I’m NK AI. Tell me the model, year, quantity, budget, country and port you need." }]);
  const selected = vehicles.find((vehicle) => vehicle.id === selectedId) || vehicles[0];

  useEffect(() => {
    const saved = window.localStorage.getItem("nk-cars-v1-state");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      queueMicrotask(() => {
        if (parsed.vehicles) setVehicles(parsed.vehicles);
        if (parsed.leads) setLeads(parsed.leads);
        if (parsed.wanted) setWanted(parsed.wanted);
        if (parsed.rules) setRules(parsed.rules);
      });
    } catch { /* Keep seeded demo state if device state is invalid. */ }
  }, []);
  useEffect(() => {
    const persistableVehicles = vehicles.map((vehicle) => ({ ...vehicle, images: undefined }));
    try { window.localStorage.setItem("nk-cars-v1-state", JSON.stringify({ vehicles: persistableVehicles, leads, wanted, rules })); }
    catch { /* Large uploaded covers stay in the current session if device storage is full. */ }
  }, [vehicles, leads, wanted, rules]);

  const published = vehicles.filter((v) => ["Published", "Reserved", "Sold"].includes(v.state));
  const marketVehicles = published.filter((v) => {
    const haystack = `${v.brand} ${v.model} ${v.year} ${v.transmission} ${v.drive}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (filter === "All" || (filter === "Available" ? v.state === "Published" : v.state === filter));
  });
  const kpis = [
    ["Waiting Review", vehicles.filter((v) => v.state === "Waiting Review").length, "review" as View],
    ["Published Vehicles", published.length, "marketplace" as View],
    ["Active Leads", leads.filter((l) => l.stage !== "Closed").length, "leads" as View],
    ["Wanted Requests", wanted.filter((w) => w.status !== "Closed").length, "wanted" as View],
    ["Customer Inquiries", leads.length, "leads" as View],
    ["Hot Matches", wanted.filter((w) => w.status === "Matched").length, "wanted" as View],
  ];

  function go(next: View, vehicleId?: string) {
    if (vehicleId) setSelectedId(vehicleId);
    if (next === "add") setEditingId(vehicleId || null);
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }
  function approve(id: string) {
    if (role !== "Owner") return flash("Owner approval is required before publishing.");
    setVehicles((items) => items.map((v) => v.id === id ? { ...v, state: "Published", timeline: [...v.timeline, { id: `${id}-${Date.now()}`, time: "Just now", label: "Owner approved", detail: "Approved and published to Marketplace." }] } : v));
    flash("Vehicle approved and published to Marketplace.");
    go("marketplace", id);
  }
  function reject(id: string) {
    if (role !== "Owner") return flash("Only Owner can reject a vehicle.");
    setVehicles((items) => items.map((v) => v.id === id ? { ...v, state: "Rejected", timeline: [...v.timeline, { id: `${id}-${Date.now()}`, time: "Just now", label: "Owner rejected", detail: "Vehicle removed from the review queue." }] } : v));
    flash("Vehicle rejected.");
    go("review");
  }
  function updateVehicle(field: keyof Vehicle, value: string | number | boolean) {
    setVehicles((items) => items.map((v) => v.id === selected.id ? { ...v, [field]: value, timeline: [...v.timeline, { id: `${v.id}-${Date.now()}`, time: "Just now", label: "Staff edited", detail: `${String(field)} updated.` }] } : v));
  }
  function saveVehicleDraft(vehicle: Vehicle) {
    setVehicles((items) => items.some((item) => item.id === vehicle.id)
      ? items.map((item) => item.id === vehicle.id ? vehicle : item)
      : [vehicle, ...items]);
    setSelectedId(vehicle.id);
    setEditingId(null);
    flash("Draft saved — vehicle is now in Waiting Review.");
    go("review", vehicle.id);
  }
  function createInquiry() {
    if (!inquiry.name.trim()) return flash("Please enter the customer name.");
    const newLead: Lead = { id:`l${Date.now()}`, customer:inquiry.name, country:inquiry.country, port:inquiry.port, vehicleId:selected.id, requirement:inquiry.requirement || `${selected.year} ${selected.brand} ${selected.model}`, stage:"New", lastActivity:"Just now", assigned:"Unassigned", quantity:Number(inquiry.quantity) || 1, budget:inquiry.budget || "Need Review" };
    setLeads((items) => [newLead, ...items]);
    setVehicles((items) => items.map((v) => v.id === selected.id ? { ...v, timeline: [...v.timeline, { id:`${v.id}-${Date.now()}`,time:"Just now",label:"Customer inquiry",detail:`${inquiry.name} · ${inquiry.country}` }] } : v));
    flash("Inquiry created — new Lead is now on Owner Dashboard."); go(role === "Customer" ? "marketplace" : "leads");
  }
  function sendChat() {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    const lower = text.toLowerCase();
    const reply = lower.includes("ship") ? "I can record your destination, but shipping must be checked by NK staff. Which country and port should we quote?" : lower.includes("available") ? (selected?.availabilityVerified ? `${selected.stockNo} was verified earlier, but NK staff must re-check availability before confirmation.` : "Availability has not been verified. I’ll create a check request for NK staff.") : lower.includes("price") ? `The listed price is ${thb(selected?.sellingPrice || 0)}. I cannot offer discounts or quote a price not in the system.` : "Got it. Please add your name, country, port, quantity and budget so I can create an Inquiry.";
    setChat((items) => [...items, {from:"user",text}, {from:"ai",text:reply}]);
    setChatInput("");
  }

  const internal = role !== "Customer";
  const nav = role === "Customer" ? [["Home","marketplace"],["Vehicles","marketplace"],["Wanted","wanted"],["Ask NK AI","detail"],["More","more"]] : [["Home","home"],["Vehicles","vehicles"],["Leads","leads"],["Wanted","wanted"],["More","more"]];

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => go(internal ? "home" : "marketplace")} aria-label="NK Cars home"><span>NK</span><b>Cars</b><small>Platform V1</small></button>
      <div className="top-actions"><Badge tone="purple">DEMO DATA</Badge><select value={role} onChange={(e) => { const next=e.target.value as Role; setRole(next); go(next === "Customer" ? "marketplace" : "home"); }} aria-label="Preview role"><option>Owner</option><option>Internal Staff</option><option>Customer</option></select></div>
    </header>
    {notice && <div className="toast" role="status">{notice}</div>}
    <main className="content">
      {view === "home" && internal && <Dashboard kpis={kpis} vehicles={vehicles} wanted={wanted} go={go} />}
      {view === "vehicles" && internal && <Vehicles vehicles={vehicles} go={go} setSelectedId={setSelectedId} />}
      {view === "marketplace" && <Marketplace vehicles={marketVehicles} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} go={go} />}
      {view === "review" && internal && <Review vehicles={vehicles} selected={selected} role={role} setSelectedId={setSelectedId} go={go} approve={approve} reject={reject} updateVehicle={updateVehicle} />}
      {view === "detail" && <Detail vehicle={selected} internal={internal} chat={chat} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} go={go} />}
      {view === "vehicle360" && internal && <Vehicle360 vehicle={selected} leads={leads} go={go} />}
      {view === "leads" && internal && <Leads leads={leads} vehicles={vehicles} setLeads={setLeads} />}
      {view === "wanted" && <WantedPage wanted={wanted} setWanted={setWanted} role={role} flash={flash} />}
      {view === "rules" && internal && <Rules rules={rules} setRules={setRules} />}
      {view === "add" && internal && <VehicleEditor key={editingId || "new-vehicle"} initialVehicle={editingId ? vehicles.find((vehicle) => vehicle.id === editingId) : undefined} onSave={saveVehicleDraft} onCancel={() => go(editingId ? "review" : "vehicles", editingId || undefined)} notify={flash} />}
      {view === "inquiry" && <Inquiry vehicle={selected} inquiry={inquiry} setInquiry={setInquiry} createInquiry={createInquiry} />}
      {view === "more" && <More internal={internal} go={go} reset={() => { setVehicles(demoVehicles); setLeads(demoLeads); setWanted(demoWanted); setRules(demoRules); flash("DEMO DATA reset complete."); }} />}
    </main>
    <nav className="bottom-nav" aria-label="Primary navigation">{nav.map(([label,target]) => <button key={label} className={view === target ? "active" : ""} onClick={() => go(target as View)}><span>{label === "Home" ? "⌂" : label === "Vehicles" ? "▣" : label === "Leads" ? "◎" : label === "Wanted" ? "◇" : label === "Ask NK AI" ? "✦" : "•••"}</span>{label}</button>)}</nav>
  </div>;
}

function PageHead({ eyebrow, title, action }: { eyebrow:string; title:string; action?:React.ReactNode }) { return <div className="page-head"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{action}</div>; }

function Dashboard({ kpis, vehicles, wanted, go }: { kpis:(string|number|View)[][]; vehicles:Vehicle[]; wanted:Wanted[]; go:(v:View,id?:string)=>void }) {
  const waiting=vehicles.filter(v=>v.state==="Waiting Review");
  return <><PageHead eyebrow="Owner Control Center" title="Good evening, Owner" action={<button className="button primary" onClick={()=>go("add")}>＋ Add vehicle</button>} /><p className="subcopy">What needs your decision right now.</p>
    <section className="kpi-grid">{kpis.map(([label,value,target])=><button className="kpi" key={String(label)} onClick={()=>go(target as View)}><span>{label}</span><strong>{value}</strong><i>View →</i></button>)}</section>
    <section className="section"><div className="section-title"><div><p className="eyebrow">Need Your Attention</p><h2>Owner queue</h2></div><span className="alert-count">{waiting.length+2}</span></div>
      <div className="attention-list">{waiting.slice(0,3).map((v,i)=><button key={v.id} onClick={()=>go("review",v.id)}><span className={`attention-icon tone-${i===0?"amber":i===1?"red":"blue"}`}>{i===0?"!":i===1?"↻":"AI"}</span><div><b>{i===0?"Vehicle waiting approval":i===1?"Availability needs verification":"AI field needs review"}</b><small>{v.year} {v.brand} {v.model} · {v.stockNo}</small></div><strong>›</strong></button>)}
      {wanted.filter(w=>w.status==="Matched").map(w=><button key={w.id} onClick={()=>go("wanted")}><span className="attention-icon tone-green">★</span><div><b>Hot vehicle match</b><small>{w.quantity} × {w.model} for {w.customer}</small></div><strong>›</strong></button>)}</div>
    </section>
    <section className="section"><div className="section-title"><div><p className="eyebrow">Pipeline</p><h2>Recently published</h2></div><button className="text-button" onClick={()=>go("marketplace")}>Marketplace →</button></div><div className="mini-vehicle-row">{vehicles.filter(v=>v.state==="Published").slice(0,4).map(v=><button key={v.id} onClick={()=>go("vehicle360",v.id)}><img src={v.image} alt={`${v.brand} ${v.model}`} /><span><b>{v.year} {v.model}</b><small>{v.stockNo}</small></span></button>)}</div></section>
  </>;
}

function Vehicles({vehicles,go,setSelectedId}:{vehicles:Vehicle[];go:(v:View,id?:string)=>void;setSelectedId:(id:string)=>void}) { const counts=useMemo(()=>Object.fromEntries(["Waiting Review","Published","Reserved","Sold"].map(s=>[s,vehicles.filter(v=>v.state===s).length])),[vehicles]); return <><PageHead eyebrow="Internal inventory" title="Vehicles" action={<button className="button primary" onClick={()=>go("add")}>＋ Add</button>} /><div className="chip-row">{Object.entries(counts).map(([s,n])=><button key={s} onClick={()=>go(s==="Waiting Review"?"review":"marketplace")}>{s} <b>{n}</b></button>)}</div><div className="vehicle-list">{vehicles.filter(v=>v.state!=="Rejected").map(v=><article key={v.id}><img src={v.image} alt={`${v.brand} ${v.model}`} /><div className="vehicle-list-main"><div><StatusBadge state={v.state}/><small>{v.stockNo}</small></div><h3>{v.year} {v.brand} {v.model}</h3><p>{v.grade} · {v.transmission} · {v.drive} · {v.mileage}</p><div className="money-row"><span>Source <b>{thb(v.sourcePrice)}</b></span><span>Sell <b>{thb(v.sellingPrice)}</b></span><span className="positive">GP <b>{thb(profit(v))}</b></span></div><div className="inline-actions"><button className="button secondary" onClick={()=>{setSelectedId(v.id);go(v.state==="Waiting Review"?"review":"vehicle360",v.id)}}>{v.state==="Waiting Review"?"Review":"Vehicle 360"}</button><button className="text-button" onClick={()=>go("detail",v.id)}>Public view</button></div></div></article>)}</div></>; }

function Marketplace({vehicles,query,setQuery,filter,setFilter,go}:{vehicles:Vehicle[];query:string;setQuery:(s:string)=>void;filter:string;setFilter:(s:string)=>void;go:(v:View,id?:string)=>void}) { return <><div className="market-hero"><p className="eyebrow light">Thailand export stock</p><h1>Find your next pickup.</h1><p>Verified vehicle information from NK Cars. Shipping is checked separately.</p><div className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Revo, Ranger, 4WD..." /></div></div><div className="market-controls"><div className="chip-row">{["All","Available","Reserved","Sold"].map(s=><button className={filter===s?"selected":""} key={s} onClick={()=>setFilter(s)}>{s}</button>)}</div><small>DEMO DATA · {vehicles.length} vehicles</small></div><div className="market-grid">{vehicles.map(v=><article className="vehicle-card" key={v.id}><button className="image-button" onClick={()=>go("detail",v.id)}><img src={v.image} alt={`${v.year} ${v.brand} ${v.model}`} />{v.state==="Sold"&&<span className="sold-banner">SOLD</span>}<StatusBadge state={v.state==="Published"?"Available":v.state}/></button><div><small>{v.stockNo} · DEMO DATA</small><h2>{v.year} {v.brand} {v.model}</h2><p>{v.engine} · {v.transmission} · {v.drive}</p><p>{v.mileage} · {v.color}</p><strong className="price">{thb(v.state==="Sold"?(v.lastSoldPrice||v.sellingPrice):v.sellingPrice)}</strong>{v.state==="Sold"&&<small>Last sold · {v.soldMonth} · {v.destination}</small>}<button className="button primary wide" onClick={()=>go(v.state==="Sold"?"wanted":"detail",v.id)}>{v.state==="Sold"?"Find Similar Vehicle":"View vehicle"}</button></div></article>)}</div>{!vehicles.length&&<div className="empty"><b>No vehicles found</b><p>Try a broader model or availability filter.</p></div>}</>; }

function Review({vehicles,selected,role,setSelectedId,go,approve,reject,updateVehicle}:{vehicles:Vehicle[];selected:Vehicle;role:Role;setSelectedId:(id:string)=>void;go:(v:View,id?:string)=>void;approve:(id:string)=>void;reject:(id:string)=>void;updateVehicle:(f:keyof Vehicle,v:string|number|boolean)=>void}) { const queue=vehicles.filter(v=>v.state==="Waiting Review"); const src=defaultSource(selected.sources); return <><PageHead eyebrow="Owner approval gate" title="Waiting Review" action={<Badge tone="amber">{queue.length} pending</Badge>} /><div className="review-layout"><aside className="review-queue">{queue.map(v=><button className={selected.id===v.id?"selected":""} key={v.id} onClick={()=>setSelectedId(v.id)}><img src={v.image} alt=""/><span><b>{v.year} {v.model}</b><small>{v.stockNo}</small></span>{v.possibleDuplicate&&<Badge tone="amber">!</Badge>}</button>)}</aside>{queue.length?<section className="review-panel"><div className="review-image"><img src={selected.image} alt={`${selected.brand} ${selected.model}`} />{selected.possibleDuplicate&&<div className="warning">⚠ Possible Duplicate · Review against {selected.possibleDuplicate}</div>}</div><div className="review-title"><div><small>{selected.stockNo}</small><h2>{selected.year} {selected.brand} {selected.model}</h2><p>{selected.grade}</p></div><StatusBadge state={selected.state}/></div><div className="form-grid">{[["Brand","brand"],["Model","model"],["Year","year"],["Grade","grade"],["Engine","engine"],["Transmission","transmission"],["Drive","drive"],["Body","body"],["Mileage","mileage"],["Color","color"]].map(([label,key])=><label key={key}><span>{label} <i>{selected.confidence[key]??"–"}% AI</i></span><input value={String(selected[key as keyof Vehicle]??"")} onChange={e=>updateVehicle(key as keyof Vehicle,e.target.value)} /></label>)}<label><span>Source price <i>Internal</i></span><input type="number" value={selected.sourcePrice} onChange={e=>updateVehicle("sourcePrice",Number(e.target.value))}/></label><label><span>NK Selling Price <i>Internal</i></span><input type="number" value={selected.sellingPrice} onChange={e=>updateVehicle("sellingPrice",Number(e.target.value))}/></label></div><div className="profit-strip"><span>Source cost<b>{thb(selected.sourcePrice)}</b></span><span>Selling price<b>{thb(selected.sellingPrice)}</b></span><span>Gross profit<b className="positive">{thb(profit(selected))}</b></span><span>Markup<b>{markup(selected).toFixed(1)}%</b></span></div><div className="source-box"><div><p className="eyebrow">Default source</p><h3>{src?.name}</h3></div><StatusBadge state={src?.status||"Unknown"}/><dl><div><dt>Seller</dt><dd>{src?.seller}</dd></div><div><dt>Price</dt><dd>{thb(src?.price||0)}</dd></div><div><dt>Last verified</dt><dd>{src?.lastVerified}</dd></div><div><dt>URL</dt><dd>{src?.url}</dd></div></dl>{selected.sources.length>1&&<small>Default selected from verified sources at the lowest price. {selected.sources.length} sources merged into this Vehicle.</small>}</div><div className="review-actions"><button className="button primary" disabled={role!=="Owner"||!selected.sellingPrice} onClick={()=>approve(selected.id)}>Approve & Publish</button><button className="button secondary" onClick={()=>go("vehicle360",selected.id)}>Vehicle 360</button><button className="button danger" disabled={role!=="Owner"} onClick={()=>reject(selected.id)}>Reject</button></div>{role!=="Owner"&&<p className="permission-note">Internal Staff can edit, but Owner approval is required to publish.</p>}</section>:<div className="empty"><b>Review queue is clear</b><p>No vehicles are waiting for approval.</p></div>}</div></>; }

function Detail({vehicle,internal,chat,chatInput,setChatInput,sendChat,go}:{vehicle:Vehicle;internal:boolean;chat:{from:"ai"|"user";text:string}[];chatInput:string;setChatInput:(s:string)=>void;sendChat:()=>void;go:(v:View,id?:string)=>void}) { return <><button className="back" onClick={()=>go("marketplace")}>← Back to Marketplace</button><div className="detail-layout"><section><div className="detail-image"><img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`} /><StatusBadge state={vehicle.state==="Published"?"Available":vehicle.state}/></div><div className="thumb-row">{[0,1,2].map(i=><button key={i}><img src={vehicle.image} alt={`Vehicle view ${i+1}`}/></button>)}</div></section><section className="detail-copy"><p className="eyebrow">{vehicle.stockNo} · DEMO DATA</p><h1>{vehicle.year} {vehicle.brand}<br/>{vehicle.model}</h1><strong className="detail-price">{thb(vehicle.state==="Sold"?(vehicle.lastSoldPrice||vehicle.sellingPrice):vehicle.sellingPrice)}</strong>{!vehicle.availabilityVerified&&<div className="warning">Availability requires staff verification</div>}<dl className="specs">{[["Engine",vehicle.engine],["Transmission",vehicle.transmission],["Drive",vehicle.drive],["Body",vehicle.body],["Mileage",vehicle.mileage],["Color",vehicle.color],["Plate",vehicle.plateMasked],["VIN",vehicle.vinMasked]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><div className="detail-actions"><button className="button primary" onClick={()=>go("inquiry",vehicle.id)}>I&apos;m Interested</button><button className="button secondary" onClick={()=>go("inquiry",vehicle.id)}>Check Availability</button><button className="text-button" onClick={()=>go("wanted",vehicle.id)}>Find Similar</button>{internal&&<button className="text-button" onClick={()=>go("vehicle360",vehicle.id)}>Open internal Vehicle 360 →</button>}</div></section></div><section className="ai-panel"><div className="ai-heading"><span>✦</span><div><p className="eyebrow light">Context-aware sales assistant</p><h2>Ask NK AI about this {vehicle.model}</h2></div></div><div className="chat-log">{chat.map((m,i)=><div className={`message ${m.from}`} key={i}>{m.text}</div>)}</div><div className="chat-input"><input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Is this vehicle available?"/><button onClick={sendChat}>Send</button></div><small>AI will not guess shipping, discounts, price or unverified availability.</small></section></>; }

function Vehicle360({vehicle,leads,go}:{vehicle:Vehicle;leads:Lead[];go:(v:View,id?:string)=>void}) { const src=defaultSource(vehicle.sources); const related=leads.filter(l=>l.vehicleId===vehicle.id); return <><button className="back" onClick={()=>go("vehicles")}>← Back to Vehicles</button><PageHead eyebrow="Internal single source of truth" title={`Vehicle 360 · ${vehicle.stockNo}`} action={<StatusBadge state={vehicle.state}/>} /><div className="v360-head"><img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`}/><div><h2>{vehicle.year} {vehicle.brand} {vehicle.model}</h2><p>{vehicle.grade} · {vehicle.engine} · {vehicle.transmission} · {vehicle.drive}</p><Badge tone="purple">AI Summary</Badge><blockquote>{vehicle.availabilityVerified?"Source was verified recently.":"Availability verification is still required."} {vehicle.sources.length} source{vehicle.sources.length>1?"s":""} linked. {vehicle.possibleDuplicate?`Possible duplicate ${vehicle.possibleDuplicate} requires Owner review.`:"No duplicate warning."}</blockquote></div></div><div className="three-columns"><section className="card"><p className="eyebrow">Internal pricing</p><dl className="stacked"><div><dt>Default source</dt><dd>{src?.name}</dd></div><div><dt>Source cost</dt><dd>{thb(vehicle.sourcePrice)}</dd></div><div><dt>Selling price</dt><dd>{thb(vehicle.sellingPrice)}</dd></div><div><dt>Gross profit</dt><dd className="positive">{thb(profit(vehicle))}</dd></div><div><dt>Markup</dt><dd>{markup(vehicle).toFixed(1)}%</dd></div></dl></section><section className="card"><p className="eyebrow">Sources · {vehicle.sources.length}</p>{vehicle.sources.map(s=><div className="source-mini" key={s.id}><div><b>{s.name}</b><small>{s.seller}</small></div><div><StatusBadge state={s.status}/><b>{thb(s.price)}</b></div></div>)}</section><section className="card"><p className="eyebrow">Customer inquiries · {related.length}</p>{related.length?related.map(l=><div className="source-mini" key={l.id}><div><b>{l.customer}</b><small>{l.country} · {l.lastActivity}</small></div><StatusBadge state={l.stage}/></div>):<p className="muted">No linked inquiries yet.</p>}</section></div><section className="section"><p className="eyebrow">Activity log</p><div className="timeline">{[...vehicle.timeline].reverse().map(t=><div key={t.id}><i></i><span><b>{t.label}</b><small>{t.detail}</small><time>{t.time}</time></span></div>)}</div></section></>; }

function Leads({leads,vehicles,setLeads}:{leads:Lead[];vehicles:Vehicle[];setLeads:React.Dispatch<React.SetStateAction<Lead[]>>}) { return <><PageHead eyebrow="Customer pipeline" title="Leads" action={<Badge tone="purple">{leads.length} DEMO</Badge>} /><div className="lead-list">{leads.map(l=>{const v=vehicles.find(x=>x.id===l.vehicleId);return <article key={l.id}><div className="avatar">{l.customer.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><div className="lead-main"><small>{l.country} · {l.port||"Port needed"}</small><h3>{l.customer}</h3><p>{l.requirement}</p>{v&&<button className="linked-vehicle"><img src={v.image} alt=""/><span>{v.stockNo} · {v.year} {v.model}</span></button>}<div className="lead-meta"><span>Qty <b>{l.quantity||1}</b></span><span>Budget <b>{l.budget}</b></span><span>Assigned <b>{l.assigned}</b></span><span>Last activity <b>{l.lastActivity}</b></span></div></div><label className="stage-select"><span>Stage</span><select value={l.stage} onChange={e=>setLeads(items=>items.map(x=>x.id===l.id?{...x,stage:e.target.value as LeadStage,lastActivity:"Just now"}:x))}>{stages.map(s=><option key={s}>{s}</option>)}</select></label></article>})}</div></>; }

function WantedPage({wanted,setWanted,role,flash}:{wanted:Wanted[];setWanted:React.Dispatch<React.SetStateAction<Wanted[]>>;role:Role;flash:(s:string)=>void}) { const [open,setOpen]=useState(false); const [form,setForm]=useState({customer:"",model:"Hilux Revo",yearRange:"2020–2022",transmission:"AT",drive:"4WD",body:"Double Cab",mileage:"< 100,000 km",color:"Any",quantity:"1",budget:"",country:"Kenya",port:"Mombasa"}); function submit(){if(!form.customer||!form.budget)return flash("Customer name and budget are required.");setWanted(items=>[{...form,id:`w${Date.now()}`,quantity:Number(form.quantity),status:"Searching" as const},...items]);setOpen(false);flash("Wanted Request created.");} return <><PageHead eyebrow="Demand-driven sourcing" title="Wanted Requests" action={<button className="button primary" onClick={()=>setOpen(!open)}>＋ Create request</button>} />{open&&<section className="card form-card"><h2>New Wanted Request</h2><div className="form-grid">{Object.entries(form).map(([k,v])=><label key={k}><span>{k.replace(/([A-Z])/g," $1")}</span><input type={k==="quantity"?"number":"text"} value={v} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}</div><button className="button primary" onClick={submit}>Create Wanted Request</button></section>}<div className="wanted-grid">{wanted.map(w=><article key={w.id}><div><StatusBadge state={w.status}/><small>{w.id.toUpperCase()} · DEMO DATA</small></div><h2>{w.quantity} × {w.model}</h2><p>{w.yearRange} · {w.transmission} · {w.drive} · {w.body}</p><dl><div><dt>Customer</dt><dd>{w.customer}</dd></div><div><dt>Destination</dt><dd>{w.country} · {w.port}</dd></div><div><dt>Budget</dt><dd>{w.budget}</dd></div><div><dt>Preferences</dt><dd>{w.color} · {w.mileage}</dd></div></dl>{role!=="Customer"&&<select value={w.status} onChange={e=>setWanted(items=>items.map(x=>x.id===w.id?{...x,status:e.target.value as Wanted["status"]}:x))}><option>Searching</option><option>Matched</option><option>Customer Reviewing</option><option>Closed</option></select>}</article>)}</div></>; }

function Rules({rules,setRules}:{rules:SourcingRule[];setRules:React.Dispatch<React.SetStateAction<SourcingRule[]>>}) { const [open,setOpen]=useState(false); const blank={brand:"Toyota",model:"Hilux Revo",years:"2020–2022",maxPrice:"900000",transmission:"AT",drive:"4WD",body:"Double Cab",maxMileage:"100,000 km",color:"Any",area:"Thailand",required:"",excluded:"",priority:"Normal"}; const [form,setForm]=useState(blank); function add(){setRules(items=>[{...form,id:`r${Date.now()}`,maxPrice:Number(form.maxPrice),priority:form.priority as SourcingRule["priority"],active:true},...items]);setOpen(false);} return <><PageHead eyebrow="Future Meta integration input" title="Sourcing Rules" action={<button className="button primary" onClick={()=>setOpen(!open)}>＋ New rule</button>} /><div className="integration-placeholder"><span>↗</span><div><b>Facebook / Meta Integration Placeholder</b><p>V1 accepts Manual Add, pasted source information, URL and photos. Automated sourcing will connect here later.</p></div><Badge>NOT CONNECTED</Badge></div>{open&&<section className="card form-card"><div className="form-grid">{Object.entries(form).map(([k,v])=><label key={k}><span>{k.replace(/([A-Z])/g," $1")}</span><input value={v} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}</div><button className="button primary" onClick={add}>Save active rule</button></section>}<div className="rule-list">{rules.map(r=><article key={r.id}><div className="rule-top"><div><Badge tone={r.priority==="Urgent"?"red":r.priority==="High"?"amber":"slate"}>{r.priority}</Badge><h2>{r.brand} {r.model}</h2><p>{r.years} · {r.transmission} · {r.drive} · {r.body}</p></div><label className="switch"><input type="checkbox" checked={r.active} onChange={()=>setRules(items=>items.map(x=>x.id===r.id?{...x,active:!x.active}:x))}/><span></span></label></div><dl><div><dt>Maximum price</dt><dd>{thb(r.maxPrice)}</dd></div><div><dt>Max mileage</dt><dd>{r.maxMileage}</dd></div><div><dt>Color / Area</dt><dd>{r.color} · {r.area}</dd></div><div><dt>Required</dt><dd>{r.required||"None"}</dd></div><div><dt>Excluded</dt><dd>{r.excluded||"None"}</dd></div></dl></article>)}</div></>; }

function Inquiry({vehicle,inquiry,setInquiry,createInquiry}:{vehicle:Vehicle;inquiry:{name:string;country:string;port:string;quantity:string;budget:string;requirement:string};setInquiry:React.Dispatch<React.SetStateAction<{name:string;country:string;port:string;quantity:string;budget:string;requirement:string}>>;createInquiry:()=>void}) { return <><PageHead eyebrow="Customer inquiry" title="Tell NK Cars what you need" /><div className="inquiry-layout"><article className="selected-vehicle"><img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`}/><div><Badge tone="blue">Vehicle interested</Badge><h2>{vehicle.year} {vehicle.brand} {vehicle.model}</h2><p>{vehicle.stockNo} · {thb(vehicle.sellingPrice)}</p></div></article><section className="card"><div className="form-grid">{Object.entries(inquiry).map(([k,v])=><label key={k}><span>{k}</span>{k==="requirement"?<textarea rows={3} value={v} onChange={e=>setInquiry({...inquiry,[k]:e.target.value})}/>:<input type={k==="quantity"?"number":"text"} value={v} onChange={e=>setInquiry({...inquiry,[k]:e.target.value})}/>}</label>)}</div><div className="info-note">NK staff will verify vehicle availability and shipping before confirming.</div><button className="button primary wide" onClick={createInquiry}>Create Inquiry</button></section></div></>; }

function More({internal,go,reset}:{internal:boolean;go:(v:View)=>void;reset:()=>void}) { return <><PageHead eyebrow="NK Cars Platform V1" title="More" /><div className="more-list">{internal&&<><button onClick={()=>go("rules")}><span>◎</span><div><b>Sourcing Rules</b><small>Define target vehicle criteria</small></div><strong>›</strong></button><button onClick={()=>go("review")}><span>✓</span><div><b>Owner Review Queue</b><small>Approve, edit or reject vehicles</small></div><strong>›</strong></button><button onClick={()=>go("add")}><span>＋</span><div><b>Add Vehicle</b><small>Paste, URL, photos and AI extraction</small></div><strong>›</strong></button></>}<button onClick={()=>go("marketplace")}><span>▣</span><div><b>Marketplace</b><small>Customer-safe published inventory</small></div><strong>›</strong></button><button onClick={reset}><span>↺</span><div><b>Reset DEMO DATA</b><small>Restore the original V1 walkthrough</small></div><strong>›</strong></button></div><section className="architecture"><p className="eyebrow">Architecture preparation</p><h2>Ready for the next system layer</h2><div>{["GitHub / Next.js","Supabase / PostgreSQL","OpenAI API","WhatsApp Business API","Facebook / Meta","Shipping APIs"].map(x=><Badge key={x}>{x}</Badge>)}</div><p>Domain rules, seeded data and interface state are separated so V1 can move to durable services without rebuilding the user experience.</p></section></>; }
