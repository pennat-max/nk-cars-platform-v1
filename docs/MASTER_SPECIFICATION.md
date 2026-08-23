# NK Cars Platform Master Specification

Status: Owner-authoritative product specification  
Last updated: 2026-08-23  
Implementation rule: do not remove, weaken, or reinterpret previously accepted requirements without explicit Owner approval.

## Source Order

This Master Specification extends the existing project documentation. When requirements conflict, use this order:

1. Explicit new Owner instruction.
2. This Master Specification.
3. `AGENTS.md` and existing handoff documents.
4. Acceptance tests, architecture notes, and implementation plan.
5. Current approved prototype behavior and visual/mobile parity.

## Sections 0-25

Sections 0-25 were provided by the Owner in the previous Master Specification message and remain binding product requirements. They cover:

- Codex operating instructions and approval gates.
- Product vision: AI-assisted, asset-light, demand-driven Thai vehicle sourcing and export.
- User groups: Owner, Internal Staff, future specialized roles, Overseas Customer, Dealer/Seller, and External Providers.
- Roadmap V1 through V5.
- V1 Sourcing Rules.
- Facebook/Marketplace import and screenshot/photo fallback.
- Image-first vehicle entry.
- AI vehicle extraction rules.
- Controlled AI learning and correction authority.
- Duplicate detection.
- Availability watch and dynamic pricing boundaries.
- Waiting Review.
- Marketplace public data minimization.
- Vehicle status lifecycle.
- V1 pricing.
- Customer AI Sales.
- Wanted Requests.
- Matching.
- Hot Deals.
- Multi-vehicle orders.
- Replacement rules.
- Negotiation.
- PI/commercial document principles.
- Future payment control.
- Future Purchase Fund.
- Future Auto-Buy.
- Seller hold/deposit principles through the truncated start of Section 26.

Do not treat this summary as a replacement for those accepted requirements. It is an index preserving their authority until the full Part 1 text is consolidated.

## 26. Seller Hold / Deposit Recovery

If NK/customer-authorized funds are used to hold a vehicle and the vehicle later fails inspection:

Deposit Paid -> Vehicle Failed Inspection -> Refund Requested -> Waiting Seller Refund -> Finance Confirmed Refund -> funds returned to available customer balance

Do not treat refund as received until Finance confirms actual money received.

If refund is delayed, create an alert and recovery case.

Seller refund behavior contributes to Seller Trust Score.

## 27. Seller / Dealer Trust Score

Maintain an internal Seller/Dealer Trust Score based on actual history.

Possible signals:

- Listing accuracy.
- Vehicle matches description.
- Price changes after confirmation.
- Response speed.
- Inspection pass rate.
- Successful transactions.
- Deposit refund reliability.
- Cancellations.
- Documentation issues.

AI must not select supply based only on cheapest price.

Dealer-facing view should not expose the internal algorithm or raw score.

Dealer may see simplified level:

- New.
- Verified.
- Trusted.
- Preferred.

Dealer may receive improvement suggestions.

If seller reaches high-risk threshold:

- Automatically Suspended / Blacklisted.
- AI stops automatically recommending that seller.
- Active vehicles from seller go to Review.

Do not delete seller history.

Every blacklist/suspension requires:

- Reason.
- Evidence.
- Timestamp.
- Audit record.

If a blacklisted seller has an exceptional vehicle, create High Risk Opportunity for Owner. Owner can choose:

- Ignore.
- Allow This Deal Only.
- Remove Blacklist.

## 28. Customer Trust Score

Maintain Customer Trust Score based on real behavior.

Signals may include:

- Payment timeliness.
- Successful completed purchases.
- Repeat orders.
- Quantity purchased.
- Cancellations.
- Reservation behavior.
- Purchase Fund readiness.
- Payment problems.

Customer levels:

- New.
- Verified.
- Trusted.
- Priority Buyer.

Priority Buyer may receive configurable benefits:

- Hot Deal priority.
- Sourcing priority.
- Longer hold privileges.
- Preferred pricing/service rules.

Customer can see level and progress toward next level.

Do not expose detailed internal scoring formula.

## 29. Referral System

Support customer referral program.

Customer receives referral code/link.

Referral reward only becomes eligible after qualifying/completed transaction.

Do not reward registration alone.

Track:

- Referrer.
- Referred account.
- Qualifying transaction.
- Reward.
- Status.
- Paid/credited date.

Referral Credit must be separate from Purchase Fund.

Future Dealer Referral:

Dealer may refer:

- Another dealer.
- A buyer.

Reward only after qualifying successful transaction.

Prevent self-referral and duplicate-account abuse.

## 30. Purchase Approval For Multi-Vehicle Orders

For multi-vehicle orders, Owner should have one Purchase Approval screen.

Show:

- Order.
- Number of vehicles.
- Customer payment status.
- Total purchase cost.
- Revenue.
- Expected total profit.
- Expected margin.
- Warnings.

Allow:

- Approve All.
- Approve Selected.
- Hold.
- Reject / Replace.

Approve All must exclude vehicles with unresolved warnings.

Examples:

- Source price changed.
- Verification expired.
- VIN mismatch.
- Seller risk.
- Document problem.

Owner must still be able to inspect individual vehicles.

## 31. Procurement Routing

After purchase approval, system groups vehicles by:

- Province/area.
- Appointment time.
- Urgency.
- Staff availability.

Suggest procurement assignments/routes.

V1 of this future module:

- AI recommends assignment.
- Manager confirms.

Later:

- Safe low-risk tasks may auto-assign.

Procurement employee mobile view should show only information necessary for work:

- Vehicle.
- Seller.
- Location.
- Contact.
- Approved purchase amount.
- Inspection requirements.

Do not expose customer or margin information unless necessary.

## 32. Route Optimization

For employees collecting multiple vehicles, system should propose optimized pickup order.

Consider:

- Geography.
- Appointment windows.
- Urgency.
- Number of vehicles.

Employee can open navigation for each stop.

If appointment changes, route may be recalculated.

## 33. Pre-Purchase Check

Before seller payment, procurement employee must complete mobile Pre-Purchase Check.

Required evidence may include:

- Vehicle photos.
- VIN/chassis.
- Mileage.
- Registration/documents.
- Model/year/spec confirmation.
- Approved purchase price.
- Obvious major-condition issues.

System compares actual vehicle with approved purchase record.

PASS:

- Ready to Pay.

Material mismatch:

- STOP.
- Owner Alert / Review.

Examples:

- VIN mismatch.
- Wrong vehicle.
- Price changed.
- Document problem.
- Major unexpected condition issue.

## 34. Purchase Payment Control

Normal flow:

Owner Purchase Approval -> employee reaches vehicle -> Pre-Purchase Check -> Request Payment -> authorized Finance pays seller -> payment evidence recorded -> employee confirms seller received money -> vehicle/document handover confirmed -> Vehicle Secured

Procurement employees cannot independently transfer company funds.

Finance cannot materially change approved recipient/payment amount without renewed approval.

If payment is made but vehicle is not handed over:

- Do not mark Vehicle Secured.
- Create urgent alert.

## 35. Vehicle Secured

Vehicle Secured requires:

- Seller payment confirmation.
- Vehicle handover.
- Relevant documents received.
- Handover evidence/photos.
- Employee confirmation.

Customer is then automatically notified:

Vehicle Secured

Customer Portal receives actual vehicle evidence where appropriate.

## 36. One-Trip Procurement

System should support remote pre-verification so procurement staff can inspect and buy in one trip.

Before travel:

- Seller confirms availability.
- Seller confirms price.
- Obtain recent photos/video.
- VIN/mileage/document information where possible.
- Approved maximum purchase limit exists.
- Customer funding condition satisfied.

At vehicle:

- Pre-Purchase Check.
- If within pre-approved conditions and price ceiling, Finance can proceed according to approved workflow.

Do not create unnecessary duplicate Owner approvals if Owner already approved the exact purchase/maximum amount.

Owner intervention is required when:

- Price exceeds approval.
- VIN mismatch.
- Major defect.
- Documents fail.
- Material terms change.

## 37. Vehicle Inspection

Every secured vehicle must pass inspection before export.

Standard inspection checklist should support:

- Engine.
- Transmission.
- Suspension.
- Brakes.
- Tires.
- Electrical.
- Body.
- Interior.
- Air conditioning.
- Diagnostic/OBD where used.
- Documents.
- Customer modifications.

Employee records:

- Normal.
- Issue.
- Repair Required.
- Replace Required.

Attach evidence/photos.

AI may summarize and suggest work.

AI must not autonomously make unsafe mechanical diagnoses from images alone.

## 38. Repair & Modification

Inspection issues create Repair/Modification Jobs.

Support:

- Internal work.
- Outsourced work.

Outsource record:

- Provider.
- Scope.
- Estimated cost.
- Promised completion.
- Actual cost.
- Receipts.
- Before/after photos.
- Status.

All outsourced repair/modification work requires Owner approval before commitment/payment in the initial version.

If actual cost exceeds approved amount:

- Renewed Owner approval required.

Actual repair cost automatically updates Deal actual cost/profit.

## 39. Major Unexpected Issue

If inspection discovers major unexpected defect/cost:

- Stop normal workflow.

Calculate:

- Additional cost.
- Impact on expected profit.
- Vehicle condition impact.

Create Owner Pending Action.

Owner decides:

- Repair.
- Change plan.
- Discuss with customer.
- Replace vehicle.
- Other approved action.

AI cannot decide material unexpected-loss situations independently.

## 40. Repair Completion

For initial version, responsible employee may confirm completed repair/modification without mandatory second-person QC.

Require:

- Completed work list.
- After photos.
- Actual costs.
- Completion timestamp.

Then:

- Ready for Export.

Customer-visible information:

- Work status.
- Customer-safe work description.
- Before/After images.

Do not expose internal repair cost/margin.

If customer requests additional paid work, show price and obtain required approval before work.

## 41. Ready For Export

When all required inspection/repair/modification work is completed:

- Ready for Export.

Automatically notify customer with:

- Final-condition photos.
- Completed customer-visible work.
- Status.

Do not wait for customer acknowledgment before continuing shipping workflow.

## 42. Export / Shipping Job

After Ready for Export:

- Export team creates Shipping Job.

Support external Shipping Provider.

Record:

- Provider.
- Origin port.
- Destination port.
- Quoted cost.
- Approved cost.
- Booking No.
- Vessel.
- Container number.
- ETD.
- ETA.
- Documents.
- Status.

External shipping provider does not require platform login initially.

Internal Export team updates data.

Shipping expense/payment requires Owner approval before payment.

If actual cost exceeds approved cost:

- Renew approval.

## 43. Customer Shipping Tracking

When booking confirmed, automatically update customer.

Customer-visible fields where available:

- Booking No.
- Vessel.
- Origin Port.
- Destination Port.
- ETD.
- ETA.
- Container No.

Unknown data must display Pending.

AI must never invent ETA/ETD.

Future V2/V4 integration:

- Connect authorized shipping/carrier tracking APIs.

Automatically update:

- Departure.
- ETA changes.
- Delays.
- Arrival.

Notify customer on meaningful changes.

## 44. Delivery Completion

Do not mark order Completed merely when vessel reaches destination port.

Lifecycle:

In Transit -> Arrived at Port -> Clearance / Pickup -> Customer Received Vehicle -> Completed -> After-sales

If NK does not control destination clearance, display:

Awaiting Customer/Agent Clearance

Customer/authorized staff can confirm Received Vehicle.

## 45. After-Sales

After Customer Received Vehicle, send simple feedback:

- Very Satisfied.
- Satisfied.
- Problem.

If Problem:

- Create After-sales Case.
- Alert responsible team.

If satisfied, optionally request:

- Review.
- Delivery photo.
- Permission to use testimonial/media.

Marketing use requires explicit customer permission.

Completed customer remains available for repeat-sales automation.

AI may follow up later according to configured frequency, avoiding spam.

## 46. Stop Point

After receiving this Part 2:

- Merge it into the Master Specification.
- Do not deploy.
- Do not start the next milestone yet.
- Confirm receipt.
- Wait for Part 3.
