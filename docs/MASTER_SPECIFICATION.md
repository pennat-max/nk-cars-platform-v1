# NK Cars Platform — Master Product Specification

Status: Authoritative product specification
Owner: NK Cars
Primary device: iPhone / mobile-first
Current delivery focus: V1

## 0. Codex operating rules

Before changing code, Codex must inspect the current repository and existing project documentation. Preserve working functionality and the approved mobile-first design unless a technical change is necessary.

Codex may autonomously implement, refactor, test, fix bugs, improve performance/accessibility, create development migrations, and create preview builds.

Owner approval is required before production deployment, overwriting the existing ChatGPT Site, destructive production database changes, deleting important data, activating paid services, sending real external customer/seller messages, financial transactions, refunds, or other materially irreversible actions.

Do not ask Owner to approve the same unchanged decision twice. Within approved rules, the system should continue automatically. Outside approved rules or materially risky conditions, create an Owner Decision.

Database records and confirmed documents are the source of truth. AI conversation memory is not authoritative for payment, price, availability, VIN, shipping, approvals, or accounting.

---

## 1. Product vision

NK Cars is an AI-assisted vehicle sourcing, trading, and export platform connecting Thai vehicle supply to overseas buyers.

Long-term goal: Owner manages the operation primarily from one mobile phone while AI and event-driven workflows handle routine work.

Principles:
- asset-light and demand-driven
- minimize NK-owned inventory
- AI handles repetitive coordination, extraction, matching, and conversation
- deterministic systems control money, permissions, state transitions, approvals, and accounting
- human approval for financially material or high-risk exceptions
- complete auditability
- mobile-first

---

## 2. User roles

Long-term roles:
- Owner — full visibility and approval authority
- Internal Staff — role-based access
- Sales
- Finance/Admin
- Procurement
- Inspection
- Repair/Modification
- Export/Shipping
- Department Manager
- Overseas Customer
- Dealer/Seller
- External repair/shipping/service providers (future integration)

Use least-privilege RBAC.

---

## 3. Roadmap

### V1 — Supply → Marketplace → Lead (BUILD FIRST)
Sourcing Rules → Vehicle Import → AI Extraction → Duplicate Detection → Waiting Review → Owner Approval → Publish → Marketplace → Customer Inquiry / AI Sales → Lead / Wanted Request → Owner Dashboard.

### V2 — Dealer Network + Intelligent Sourcing
Dealer Portal, Dealer submissions, Wanted Request distribution, Dealer offers, matching/ranking, Seller Trust Score, availability monitoring, controlled seller communication.

### V3 — Commercial Transaction
Final Quote, negotiation, PI, payment tracking, Finance confirmation, Purchase Fund, Auto-Buy, reservation, purchase approval, procurement, seller-payment controls.

### V4 — Vehicle Operations + Export
Pre-purchase inspection, Vehicle Secured, inspection, repair/modification, outsourced work, export prep, shipping, vessel tracking, customer delivery tracking, after-sales.

### V5 — Business Operating System
Vehicle/Customer/Dealer/Order 360, employee workflows/KPI, anomaly/fraud detection, immutable audit, reporting, forecasts, Owner AI Command Center, Daily/Evening/Weekly/Monthly management views.

Do not let future phases derail V1.

---

## 4. V1 Sourcing Rules

Owner can define from mobile:
- Brand
- Model
- Year from/to
- Maximum source price
- AT / MT
- 2WD / 4WD
- Body/cab type
- Maximum mileage
- Color
- Province/area
- Required keywords
- Excluded keywords
- Source
- Priority: Normal / High / Urgent
- Active / Inactive

AI/import automation should surface vehicles matching active rules. Near matches may go to Possible Match. Do not flood review with unrelated cars.

---

## 5. Facebook / Marketplace Import — high priority

Desired Owner UX:

Paste Facebook Marketplace URL → Import & Analyze → obtain accessible listing data/images → AI analyzes all available evidence → Vehicle Draft → Waiting Review.

Desired extracted information where evidence exists:
- all accessible images
- title
- listing description
- source price
- seller
- location
- source URL
- brand/model/year/grade
- engine / engine capacity
- transmission
- 2WD/4WD
- body/cab type
- mileage
- color
- VIN/chassis if visible

Technical rule: do not assume arbitrary Facebook pages can always be fetched. Respect authentication, platform rules, rate limits, and anti-automation protections. Build an importer abstraction that can use supported Meta integrations, authorized browser/session workflows, user-initiated Share workflows, permitted browser automation, and screenshot/manual fallback.

Never depend on brittle high-volume scraping as the only source path.

If URL import fails:
- keep Source URL
- show Upload Screenshots/Photos
- optionally Paste Listing Text
- AI continues extraction
- never expose raw 429/stack traces/API internals to normal users

---

## 6. Image-first vehicle entry

Alternative fast flow:
Add Vehicle → Select multiple photos → Analyze with NK AI → Review → Save Draft.

Requirements:
- multi-select photos in one picker operation where supported
- target at least 30 images
- iPhone/Android support
- thumbnail grid
- reorder/delete
- choose cover
- add more later

AI analyzes the collection as one vehicle and may read exterior, interior, dashboard, odometer, badges, engine bay, VIN/chassis/spec labels, vehicle documents, Marketplace screenshots, and listing screenshots.

New Add Vehicle forms must be blank. No demo/default data that users must manually clear.

---

## 7. AI vehicle extraction and controlled learning

AI combines images + screenshots + listing text + accessible URL data.

Evidence priority:
1. explicit documents / VIN / labels
2. explicit listing text
3. visible badges/spec evidence
4. AI inference

Every extracted field should include confidence/provenance where practical. Unknown values must remain Unknown / Need Review. Conflicting evidence becomes Conflict / Need Review. AI must not fabricate.

Human-confirmed values override AI. AI must not silently overwrite human edits.

Authority hierarchy:
1. Owner
2. Authorized Manager/Senior reviewer
3. Staff-confirmed operational data
4. AI prediction

Store original prediction, correction, actor, timestamp, and final confirmed value. Future AI may use confirmed corrections as retrieval/examples, but no uncontrolled self-training or silent changes to master data.

---

## 8. Duplicate detection and multi-source vehicles

Same physical vehicle may appear across multiple Facebook groups/dealers/sources. Do not create duplicate vehicle records when confidently the same car.

Signals:
- registration
- VIN/chassis
- image similarity
- model/year/color
- mileage
- seller
- listing text
- price

One Vehicle may have multiple Sources. Default source is the lowest VERIFIED current price, not merely the lowest historical number. Uncertain match becomes Possible Duplicate requiring review.

---

## 9. Availability watch and pricing freshness

Published sourced vehicles are not necessarily NK-owned stock.

Track:
- Last Verified
- Source status
- Source price
- Verification method

Statuses:
Verified / Price Changed / Possibly Unavailable / Verification Required.

Do not automatically delete a vehicle merely because one listing disappears.

If verified source price changes within normal thresholds, update internal source price and public price according to pricing rules. Abnormal changes require review.

Customer price behavior:
- Published price: dynamic
- Active conversation: temporary hold 24 hours
- Approved Quote/PI: locked for PI validity

---

## 10. Waiting Review and publication

Every imported vehicle normally enters Waiting Review.

Review screen shows:
- all photos
- source(s)
- source price
- seller
- source URL
- Last Verified
- extracted specs
- confidence
- conflicts
- duplicate warnings

Owner actions:
Approve & Publish / Edit / Reject.

No normal import should auto-publish in V1.

---

## 11. Marketplace and customer-visible data

Customer sees:
- vehicle images
- brand/model/year
- relevant specs
- mileage
- color
- NK selling price
- availability

Customer must not see:
- source cost
- internal margin
- seller/dealer identity when internal
- seller phone
- source URL
- internal notes

Public VIN/registration should be partially masked before purchase.

Vehicle statuses:
Draft → Waiting Review → Published/Available → Reserved → Sold.

Reserved cars remain visible with RESERVED badge. Sold cars remain visible for social proof/history with Last Sold Price, month/year, export destination country, and Find Similar Vehicle. Never expose customer identity.

---

## 12. V1 pricing

In V1, Staff/Owner may enter NK Selling Price manually.

Internal view calculates immediately:
- Source Cost THB
- Selling Price
- Gross Profit THB
- Markup %

Source cost/margin are internal only.

Do not publicly promise a fixed 10%/20% markup model. Future pricing may consider payment terms, minimum profit, source-specific rules, customer level, quantity, shipping, replacement economics.

---

## 13. NK AI Sales and Wanted Requests

Customer sees one assistant: NK AI Assistant.

AI may:
- understand current vehicle
- answer from confirmed vehicle data
- collect country/port/quantity/budget/model/year/spec
- suggest/compare vehicles
- create Inquiry/Lead
- create Wanted Request
- conduct preliminary negotiation within approved commercial bounds

AI may not:
- invent availability
- invent shipping price
- invent discounts
- alter approved commercial numbers
- confirm payment
- promise unverified seller facts

Core rule: AI has freedom in conversation, not freedom to change financially material numbers.

Wanted Request fields:
Brand/model, year range, transmission, drive, body, mileage, color, quantity, budget, country, destination port, notes.

Statuses may include Searching / Matched / Customer Reviewing / Closed.

---

## 14. Matching, hot deals, replacement, multi-car sourcing

Future ranking order:
1. customer hard requirements
2. vehicle/source reliability
3. availability freshness
4. price
5. expected Order profitability
6. logistics convenience

AI may shortlist 3–5 best vehicles. Estimated Price may be shown before final verification, but must be clearly different from Final Price.

Hot Deal: if strongly matching and unusually attractive vs confirmed internal data, create Priority Alert. If matching an active Wanted Request, AI may present it automatically as Estimated / Subject to Availability.

For multi-customer matches, allow multiple qualified buyers to receive opportunity. Reservation occurs only after real commitment and source reservation.

Multi-vehicle Orders must support supply from multiple sources/dealers and track Target / Matched / Verified / Secured / Remaining. Partial fulfillment is allowed. Batch Availability Check should support multiple selected vehicles at once. Unavailable vehicles trigger Replacement Search automatically.

Replacement flexibility:
- same spec first
- then controlled flexibility such as year ±1, alternate color, modest mileage relaxation, similar price
- AI may NOT change hard requirements such as 4WD↔2WD, AT↔MT, major body type without customer approval

Replacement cheaper: customer-approved selling price stays unchanged unless rule says otherwise.
Replacement more expensive: maintain selling price while profitability remains above minimum approved economics; otherwise Owner Decision.

For multi-car Orders, evaluate total Order profitability but do not hide an unapproved loss-making vehicle inside profitable totals.

---

## 15. Negotiation and quote controls

Example:
Customer: “If you can do $15,000, I will buy 5.”

AI records offer → Sales verifies actual source cost for all vehicles → shipping/related cost entered → system calculates real economics → Owner sees actual numbers → Owner chooses Approve / Counter Offer / Reject.

If Owner counters at $15,300, AI may negotiate using that approved floor. AI cannot independently reduce below it.

If customer accepts approved price and terms are unchanged, Deal Locked → Final Quote / PI without another Owner approval. Material changes invalidate approval and require review.

---

## 16. PI and payment principles — future V3

Primary sales currency: USD. Internal vehicle cost may remain THB. Store FX rate used for each Quote/PI so historical values do not drift.

PI should normally be one document with separate lines such as Vehicle / Modification & Accessories / Inspection & Preparation / Freight & Shipping / Other agreed charges.

Default PI validity planned: 3 days.
Expired unpaid PI → recheck vehicle → recheck source price → recheck relevant shipping → re-quote. Do not auto-extend stale prices.

Sales may mark Payment Reported. Only authorized Finance/Admin may confirm actual money received. Finance confirmation stores amount, currency, date/time, Order, confirming user, evidence/reference. Do not confirm money from a slip alone.

Track Received / Balance / Payment Status. Once funding condition is satisfied → Ready for Purchase Approval.

---

## 17. Purchase Fund and Auto-Buy — future V3

Optional for all customers, subject to legal/banking review before real activation.

Concept: pre-funded buying balance for fast vehicle acquisition.

Track Total Fund / Reserved / Available per customer and per Order ledger. Customer A funds must never be treated as Customer B funds.

Unused funds do not automatically expire and may be refundable according to approved terms.

Auto-Buy Rules may specify model/year/hard specs, max price per vehicle, max quantity, max total budget, authorized Purchase Fund amount, and max deposit/hold amount. Multiple Auto-Buy Rules per customer are allowed.

AI may reserve within approved limits, but must never autonomously transfer real money to sellers.

If fund is insufficient, notify customer of available balance and minimum top-up needed. Hot Deal may be temporarily held if seller permits while customer tops up.

Legal gate: do not activate real Purchase Fund until Thai legal/banking/payment-regulatory structure is reviewed.

---

## 18. Seller hold, deposit recovery, trust score

If seller offers a time-limited special price, AI may record confirmed price/deadline, notify matched buyer, request deadline extension, and negotiate bulk price within authorized messaging channels.

If authorized deposit is paid and vehicle later fails inspection:
Deposit Paid → Vehicle Failed Inspection → Refund Requested → Waiting Seller Refund → Finance Confirmed Refund → funds returned to available customer balance.

Do not treat refund as received until Finance confirms actual money. Delays create alerts/recovery case.

Seller/Dealer Trust Score may use listing accuracy, vehicle-description accuracy, price changes after confirmation, response speed, inspection pass rate, successful transactions, refund reliability, cancellations, and document issues.

Dealer-facing view shows simplified level (New / Verified / Trusted / Preferred), not raw score/algorithm.

High-risk seller may be automatically Suspended/Blacklisted; AI stops auto-recommending; active vehicles go to Review. Preserve history, evidence, reason, timestamp, audit record. Exceptional vehicle from blacklisted seller becomes High Risk Opportunity requiring Owner choice: Ignore / Allow This Deal Only / Remove Blacklist.

---

## 19. Customer Trust Score and referrals

Customer Trust Score may use payment timeliness, completed purchases, repeat orders, quantity, cancellations, reservation behavior, Purchase Fund readiness, payment problems.

Levels: New / Verified / Trusted / Priority Buyer.

Priority Buyer benefits are configurable: Hot Deal priority, sourcing priority, longer holds, preferred pricing/service rules. Customer may see level/progress but not internal formula.

Referral system supports customers and future dealers. Reward only after a qualifying/completed transaction. Track referrer, referred account, qualifying transaction, reward, status, and paid/credited date. Referral Credit must be separate from Purchase Fund. Prevent self-referral and duplicate-account abuse.

---

## 20. Purchase Approval and procurement — future V3/V4

For multi-vehicle Orders, Owner gets one Purchase Approval screen showing Order, vehicle count, customer payment status, total purchase cost, revenue, expected total profit/margin, warnings.

Actions: Approve All / Approve Selected / Hold / Reject or Replace.
Approve All must exclude vehicles with unresolved warnings such as source price changed, verification expired, VIN mismatch, seller risk, document problem.

After approval, system groups vehicles by province/area, appointment time, urgency, staff availability and suggests procurement assignments/routes. Manager confirms initially.

Employee mobile view shows only necessary vehicle/seller/location/contact/approved purchase amount/inspection requirements, not unnecessary customer or margin data.

Route optimization should propose pickup order and open navigation per stop.

---

## 21. Pre-purchase check and one-trip procurement

Before seller payment, procurement employee completes mobile Pre-Purchase Check with vehicle photos, VIN/chassis, mileage, registration/documents, model/year/spec confirmation, approved purchase price, obvious major-condition issues.

PASS → Ready to Pay.
Material mismatch → STOP → Owner Alert/Review.
Examples: VIN mismatch, wrong vehicle, price changed, document problem, major unexpected condition issue.

Normal payment flow:
Owner Purchase Approval → employee reaches vehicle → Pre-Purchase Check → Request Payment → authorized Finance pays seller → payment evidence recorded → employee confirms seller received money → vehicle/document handover → Vehicle Secured.

Procurement staff cannot independently transfer company funds. Finance cannot materially change approved recipient/payment amount without renewed approval.

If payment made but vehicle not handed over, do NOT mark Vehicle Secured; create urgent alert.

One-trip procurement should remote-preverify availability, price, recent photos/video, VIN/mileage/docs, approved max purchase limit, funding condition before travel. If at vehicle the car passes and price is within pre-approved ceiling, Finance can proceed without duplicate Owner approval. Owner intervention only when material conditions change.

---

## 22. Vehicle Secured, inspection, repair/modification

Vehicle Secured requires seller payment confirmation, vehicle handover, relevant documents, evidence/photos, employee confirmation. Customer is automatically notified Vehicle Secured ✓ with appropriate evidence.

Every secured vehicle must pass inspection before export. Checklist may include engine, transmission, suspension, brakes, tires, electrical, body, interior, air conditioning, OBD/diagnostics where used, documents, customer modifications.

Employee records Normal / Issue / Repair Required / Replace Required and attaches evidence/photos. AI may summarize/suggest but must not make unsafe mechanical diagnoses from images alone.

Repair/Modification Jobs support Internal and Outsourced work. Outsource record: provider, scope, estimated cost, promised completion, actual cost, receipts, before/after photos, status.

Initial policy: all outsourced repair/modification requires Owner approval before commitment/payment. If actual cost exceeds approved amount, renewed approval required. Actual cost updates Deal actual cost/profit.

Major unexpected issue → STOP → calculate added cost and profit impact → Owner Pending Action. AI cannot decide material unexpected-loss situations independently.

Initial version may allow responsible employee to confirm completed work without mandatory second-person QC, but require completed work list, after photos, actual costs, completion timestamp → Ready for Export.

Customer sees status, customer-safe work description, before/after images, but not internal repair costs/margins. Customer-requested paid extras require price/approval before work.

---

## 23. Shipping and delivery — future V4

Ready for Export automatically notifies customer with final-condition photos and completed customer-visible work, then continues to Export/Shipping without waiting for customer acknowledgment.

Shipping Job supports external provider and tracks provider, origin/destination ports, quoted/approved cost, Booking No., vessel, container, ETD, ETA, documents, status.

External provider login is not required initially; internal Export team updates data. Shipping expense/payment requires Owner approval; cost increases require renewed approval.

Customer receives confirmed Booking No., Vessel, Origin Port, Destination Port, ETD, ETA, Container No. Unknown fields show Pending. AI never invents ETD/ETA.

Future authorized carrier APIs may update departure, ETA changes, delays, arrival and notify customer.

Do not mark Completed at arrival port. Lifecycle: In Transit → Arrived at Port → Clearance/Pickup → Customer Received Vehicle → Completed → After-sales. If NK does not control clearance, show Awaiting Customer/Agent Clearance.

---

## 24. After-sales

After Customer Received Vehicle, send simple feedback: Very Satisfied / Satisfied / Problem.

Problem → create After-sales Case and alert team.
Satisfied → optionally request review, delivery photo, and explicit permission to use testimonial/media. Marketing use requires permission.

Completed customers remain eligible for repeat-sales automation with configurable frequency and no spam.

---

## 25. Customer Portal — future

Secure customer account may contain My Vehicles, My Orders, Active Deals, Wanted Requests, Purchase Fund, Auto-Buy Rules, Payments, Documents, Shipping, Messages/NK AI, Completed Order History.

Customer-visible timeline may include Payment → Vehicle Secured → Inspection → Repair/Modification → Ready for Export → Shipping Booked → At Port → Loaded → Departed → In Transit → Arrived → Clearance/Pickup → Customer Received → Completed.

Customer may download authorized Quotation, PI, Receipt, Inspection Report, B/L, shipping docs and approved files. Every file is CUSTOMER_VISIBLE or INTERNAL_ONLY.

Customer NK AI may answer status, ETA, B/L, balance, and sourcing questions only from authorized customer-visible records.

---

## 26. Dealer Portal and reverse marketplace — future V2

Dealer Portal may support account/verification, vehicle submission, multi-photo upload, asking price, availability/price update, own vehicle status, availability requests, sanitized Wanted Requests, offers, simplified Seller Level/history.

Dealer cannot see overseas customer contact, NK margin, other dealer confidential prices, raw Trust Score/algorithm.

Wanted Reverse Marketplace: distribute sanitized demand to eligible dealers; dealer submits offers; AI ranks; shortlists 3–5; Owner approves shortlist; AI may present approved vehicles directly to customer.

---

## 27. Employee accounts, RBAC, event-driven task engine

Every employee uses an individual account with User ID, Role, Department, Permission Set, Manager, Active/Inactive. Material actions identify actual employee.

RBAC examples:
- Employee: own tasks + necessary operational data
- Department staff: authorized department work
- Manager: team workload/assignment/KPI
- Sales: customers/leads/deals required for sales
- Finance: PI/payment/financial confirmation
- Procurement: seller/purchase/vehicle info needed for buying
- Inspection/Repair: relevant work
- Export: shipping/export
- Owner: full visibility

Departments may see high-level status without confidential costs.

Event-driven Task Engine examples:
Vehicle Secured → Inspection Task
Inspection issue → Repair Task
Outsource → Approval Task
Repair Completed → Ready for Export
Ready for Export → Shipping Job
Booking Confirmed → Customer Notification
Arrived → Delivery Follow-up.

Initial assignment: AI recommends; Manager confirms. Consider department, geography, workload, urgency, skill, route, prior task performance. Store manager overrides as feedback. Future low-risk repetitive tasks may auto-assign.

Tasks support assignee, due date/time, priority, status, waiting reason, dependency. Escalate Due Soon → employee; Overdue → employee+manager; critical/materially overdue → configured escalation potentially Owner. Waiting reasons include Customer, Owner Approval, Seller, Repair Shop, Shipping, Parts, Finance, Other. Do not penalize employee KPI for dependency-caused delays without context.

Employee AI Work Assistant answers “What should I do today?”, “What is urgent?”, “What is blocking this vehicle?”, “What is next?”, “Which jobs are overdue?” within role permissions only.

Employee KPI may include tasks received/completed, overdue, on-time %, average completion time, rework, workload. Managers see Team KPI; Owner sees company-wide. Distinguish employee-caused delay from dependency/system/approval/supplier delay.

---

## 28. 360 pages

Vehicle 360: identity/spec, images, sources, selected source, source price, selling price, expected/actual profit, customer/deal, payment, procurement, inspection, repair, documents, shipping, timeline, responsible employee, pending actions, alerts, audit history. Apply RBAC redaction.

Vehicle 360 AI Summary: current status, payment/purchase status, actual cost, expected/actual profit, current task, responsible person, next step, blocker, risk/exception, grounded in system data.

Customer 360: profile, country, port, contacts, historical vehicles, active Orders, Leads, Wanted Requests, Auto-Buy Rules, Purchase Fund, payments, Buyer Level, Trust Score, AI conversations, After-sales, Referrals, total revenue, gross-profit contribution, repeat history.

Dealer/Seller 360: profile, contacts, location, vehicles, offers, completed transactions, inspection failures, price changes, deposit/refund history, Trust Score/Level, response time, incidents, source profitability, blacklist history, evidence.

Order 360: customer, Target/Matched/Verified/Secured/Inspection-Repair/Ready/Shipped/Arrived/Remaining, customer funds, reserved funds, money spent, balance, revenue, expected/actual profit, shipping/container grouping, documents, approvals, blockers, timeline.

---

## 29. Owner AI Command Center and management reporting

Long-term Owner primary interface supports natural language/voice such as:
“What needs my approval today?”
“Which deals have low margin?”
“Which vehicles are stuck >3 days?”
“Which customers have funds ready but no vehicles?”
“How many Revo 2020 can we source?”
“How much must we pay today?”
“Which employees have blocked tasks?”
“Which shipments are delayed?”

Owner should not need to remember menu structure. AI may prepare material actions but Owner confirmation remains where required.

Owner Dashboard is mobile-first and eventually shows Waiting Review, Published Vehicles, Active Deals/Leads, Waiting Payment, Money Received Today, Expected Profit, and Need Your Attention for publication, pricing exceptions, payment issues, purchase approval, outsourced repair, shipping payment, major vehicle issues, seller risk, fraud alerts, critical overdue work.

Daily Brief: pending approvals, expected/received money, payments due, Hot Deals, vehicle problems, overdue work, customers waiting, Purchase Fund ready for buying, shipping delays, profit changes.

Evening Summary: sold/purchased vehicles, money in/out, profit changes, vehicles secured, repair/shipping progress, overdue work, incidents, tomorrow continuation.

Weekly Review: sales, gross profit, conversion, vehicle categories, customer countries, Dealer/Source performance, Purchase Fund, sourcing, pipeline, bottlenecks, overdue work, risk events. Distinguish facts from recommendations.

Monthly Management P&L: revenue, vehicle cost, repair/modification, shipping, attributable costs, gross profit, margin; analyze by Customer/Country/Vehicle Model/Dealer/Source/Salesperson/Order. Do not count Purchase Fund/deposits as revenue.

30-Day Forecast categories: Confirmed / Likely / Pipeline / Forecast. Never mix forecast with actual sales.

---

## 30. AI risk/fraud detection, audit, backup

Monitor anomalies such as unusually high purchase price, seller bank-account changes, abnormal repair/shipping costs, repeated cost edits, post-approval price changes, payment mismatch, VIN mismatch, overdue refund, unusual employee/supplier behavior, altered documents, unusual approval patterns.

High risk → stop relevant workflow when appropriate + Owner Alert. Lower risk → flag for review. Every alert shows reason, evidence, values, baseline/comparison where applicable. Do not simply label “suspicious”.

Immutable Audit Log for material actions stores actor, action, timestamp, old/new values, related entity, approval reference, session/device metadata where appropriate. Operational users cannot delete audit history.

Production requires backups/version history/restore for Vehicles, Orders, Payments, Purchase Fund, Pricing, Shipping, Documents/metadata, Permissions. Restore must not erase original Audit Log.

---

## 31. Media/document vault, document intelligence, generation

Every vehicle keeps persistent Vehicle ID, e.g. NK-00125.

Lifecycle media/documents: Source → Purchase/Handover → Inspection → Repair/Modification → Final Condition → Export/Loading → Shipping → B/L/Documents → Delivery.

Files have visibility classification.

AI Document Intelligence may classify/extract Invoice/Receipt supplier/amount/date/document number/Order; B/L number/vessel/container/ports/ETD/ETA/VIN; vehicle document VIN/chassis/registration/explicit attributes. Keep original file, show confidence, require human confirmation for low confidence.

Automatic document generation from system data may include Quotation, PI, Receipt, Purchase Order, Inspection Report, Repair/Modification Order, Shipping Summary. Material outbound documents use Preview/Approval rules.

Use automatic running numbers such as PI-2026-000123, PO-2026-000456, ORD-2026-000089 and link documents to Customer/Order/Vehicle/Deal/Payment/Shipping.

---

## 32. Global search and natural-language search

One Global Search eventually supports VIN, registration, Vehicle ID, customer, phone, Dealer/Seller, Order, PI, PO, Container, B/L.

Natural-language examples:
“Show Revo vehicles for Kenya still under repair.”
“Orders fully paid but vehicle not purchased.”
“Vehicles waiting on shipping provider.”
“Customers with active Wanted Requests and available funds.”

AI converts natural language into authorized structured queries and returns source-backed results.

---

## 33. Notifications and AI architecture

Notification channels may include in-app, push, email, WhatsApp, future approved channels. Respect consent/permissions, avoid spam, distinguish critical financial/risk alerts from routine updates.

Customer experiences ONE NK AI Assistant. Internally future specialist services may include Sourcing Agent, Vehicle Intelligence Agent, Sales Agent, Procurement/Seller Coordination Agent, Pricing/Deal Agent, Logistics Agent.

All agents share the same source-of-truth database. Do not create isolated conflicting agent memories.

Use deterministic systems for financial calculations, permissions, workflow states, approval requirements, payment confirmation, ledgers/accounting. Use AI for extraction, summarization, matching, conversation, ranking, anomaly assistance, natural-language search.

---

## 34. Mobile-first and V1 acceptance

Owner primarily manages from iPhone. Critical workflows must work comfortably on mobile with large touch targets, minimal typing, camera/photo support, multi-photo support, sticky primary actions where useful, simple navigation, concise summaries, and no desktop-only critical workflows.

Real mobile viewport review is required before production deployment.

Current V1 scope remains:
Sourcing Rules → Add/Import Vehicle → AI-assisted extraction → Duplicate handling → Waiting Review → Owner Approve → Marketplace → Customer Inquiry → Leads → Wanted Requests → Owner Dashboard.

V1 vehicle-entry acceptance:
- no demo/default form values
- fastest path: Paste Marketplace Link → Import & Analyze → Review → Save
- fallback: Upload multiple photos/screenshots → Analyze → Review → Save
- alternative: Paste Listing Text → Analyze → Review → Save
- no manual clearing of demo text
- multi-photo selection in one operation where platform permits

Facebook importer acceptance target:
- paste URL
- attempt to acquire permitted/accessible listing data and images
- preserve Source URL
- combine listing text + images + screenshots
- AI returns structured Vehicle Draft with confidence/provenance
- if blocked, clean fallback to screenshots/photos/text
- no fabricated import success
- no raw technical errors to normal user

---

## 35. Definition of done for CURRENT V1

V1 milestone is considered successful when the following mobile workflow works end-to-end with persistent non-demo state:

1. Owner defines Sourcing Rule.
2. Owner imports/adds a real vehicle using URL, photos/screenshots, or listing text.
3. AI extracts available vehicle information without fabricating missing facts.
4. Duplicate logic can identify/flag likely duplicate.
5. Vehicle enters Waiting Review.
6. Owner can Edit / Reject / Approve & Publish.
7. Approved vehicle appears in customer-safe Marketplace.
8. Customer can open Vehicle Detail and create Inquiry.
9. Inquiry appears in Leads.
10. Customer requirement can create Wanted Request.
11. Owner Dashboard reflects current state.
12. Mobile UI is usable on real iPhone viewport.
13. No required production step depends on demo data.

---

## 36. Production gates

Before production deployment:
- Owner mobile visual review
- route/screen parity review against approved design
- core tests pass
- secrets/configuration reviewed
- production database plan reviewed
- permissions reviewed
- no demo data accidentally exposed as real
- no Facebook importer claims beyond actual technical capability
- security/privacy review for customer/seller information
- explicit Owner approval to deploy

Never overwrite the existing ChatGPT Site or public-publish a replacement without explicit Owner approval.

---

## 37. Codex next action after reading this document

1. Treat this file as the authoritative Master Product Specification.
2. Read the current codebase and existing docs.
3. Update/create `docs/CODEX_PROGRESS.md`.
4. Create/update `docs/GAP_ANALYSIS.md` comparing current implementation against this specification.
5. Classify remaining work into V1/V2/V3/V4/V5.
6. Identify technical/legal/integration blockers, especially Facebook Marketplace import and Purchase Fund regulation.
7. Propose the smallest next V1 milestone with acceptance tests.
8. Do not deploy production or overwrite the current ChatGPT Site without Owner approval.
