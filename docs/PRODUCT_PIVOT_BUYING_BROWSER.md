# NK Cars — Approved Product Pivot: AI Vehicle Buying Browser

Status: **APPROVED / AUTHORITATIVE PRODUCT DIRECTION**
Effective date: 2026-08-23
Owner approval: Confirmed
Priority: Supersedes conflicting V1 customer-browse and stock-first assumptions in `MASTER_SPECIFICATION.md` and refines `PRODUCT_DIRECTION_LIVE_BROKER.md`.

## 1. New core product

NK Cars is now primarily an **AI Vehicle Buying Platform / Buying Browser for Thailand**, not a conventional used-car stock website.

Core value proposition:

**Browse/find a vehicle in Thailand → save it as an NK Vehicle Case → NK AI translates and coordinates with the Thai seller → verify availability and price → inspection network → Buy Through NK → transport/repair/export/shipping → tracking and after-sales.**

Existing Vehicle 360, Customer 360, inspection, procurement, shipping, audit, reporting and future ERP requirements remain useful downstream modules and are NOT discarded.

## 2. Customer-facing entry points

The customer home should emphasize three actions:

1. **Browse Vehicles** — Marketplace-style browsing through supported/authorized Thai vehicle sources.
2. **Paste a Vehicle Link** — customer may paste/share a vehicle link they found on Facebook Marketplace or another supported source.
3. **Ask NK AI to Find One** — customer describes the vehicle and NK sourcing searches supported sources.

The system should not require NK to permanently copy thousands of source listings before they can be useful.

## 3. Buying Browser UX

Customer Browse should use a familiar mobile marketplace pattern without copying Facebook branding:

- NK Cars visual identity
- search field
- filters
- location
- two-column vehicle image grid on mobile where appropriate
- infinite/paginated browsing
- year / price / mileage / transmission / drive / body filters
- saved vehicles

Primary bottom navigation may include:

**Browse | Saved / My Vehicles | My Cases | Inspections | Messages / Account**

The browser UI belongs to NK Cars. Source-platform branding must not be imitated in a misleading way.

## 4. Customer account and source sessions

Customer logs into NK Cars with the customer's own NK account.

Where a supported source requires authentication, architecture may support a **customer-specific authorized browser session**.

Rules:

- customer authenticates to the source themselves
- NK must not ask the customer to type a Facebook password into a normal NK form
- do not store source passwords in plaintext
- prefer authenticated session/profile tokens/cookies where technically and legally appropriate
- sessions must be isolated per customer
- Customer A must never access Customer B's session/history
- MFA, CAPTCHA, verification and platform security must never be bypassed
- if embedded/managed browsing is not supported by the source, fall back to opening the source app/browser and letting the customer Share/Copy Link back to NK

## 5. Vehicle Case — key persistent object

When a customer saves/selects a vehicle, create an **NK Vehicle Case**.

Example: `NK-CASE-2026-001245`.

A Vehicle Case may retain only the information needed to operate safely and provide the service, subject to source rights/policies:

- source platform
- source URL / source listing identifier
- normalized vehicle specification
- observed source asking price + timestamp
- general/internal source location
- seller/contact data needed internally for verification where permitted
- AI translation/normalization
- customer relationship
- verification status
- seller conversation/verification history
- inspection status/report
- quote/order relationship
- audit trail

Do not make permanent copying of every source image/listing a prerequisite. Snapshot operational evidence when the case becomes important according to existing snapshot policy.

## 6. NK AI as communication intermediary

NK AI is the translation and coordination layer between overseas Buyer and Thai Seller.

Example:

Customer English request:
`Is this still available? Please ask for the final price and a current mileage/VIN photo.`

NK AI may:

- translate/normalize the request into Thai
- prepare or send it through an authorized supported communication workflow according to approval policy
- receive seller response
- translate/summarize response for customer
- update Vehicle Case fields such as latest price, availability and requested evidence

Routine questions may eventually be automated within approved rules.

Material commitments remain controlled, including deposits, purchase commitments, payment, and negotiation outside approved commercial bounds.

## 7. Customer-safe vehicle presentation

Customer-facing detail should show useful normalized information such as:

- photos/media that may legally/technically be displayed
- model/year
- engine
- transmission
- drive
- cab/body
- mileage
- color
- general location
- status
- customer price/service-cost information

Do not expose internal seller contact, seller phone, confidential source notes, source cost or internal margin unless policy explicitly allows it.

Do not falsely state that NK owns a vehicle or that a seller directly listed the vehicle on NK when that is not true.

Use accurate states such as:

- Live Market Result
- Found in Thailand
- Source Vehicle
- Availability Not Yet Confirmed
- Verified Available
- NK Secured

## 8. Progressive translation / performance

Do not block the entire browsing experience while AI analyzes everything.

Progressive rendering:

1. show immediately available factual listing information first
2. translate short title/details asynchronously
3. perform deeper image/spec analysis in background
4. update UI when analysis completes
5. cache normalized translations/analysis by source listing/version where appropriate

Avoid translating/analyzing the same unchanged listing repeatedly for every customer.

## 9. Transparent commercial model

Approved commercial direction:

**Vehicle Purchase Price + NK Service Commission + Inspection/Travel + Transport + Repair/Modification + Export/Shipping + other explicitly agreed costs.**

Current intended NK Service Commission: **10% of the actual vehicle purchase price**, subject to final commercial/legal configuration before production activation.

Important:

- clearly define the commission base
- do not silently apply 10% to unrelated pass-through expenses
- support future minimum fee, volume/fleet tiers or negotiated rates
- all material price calculations must be deterministic, not AI-guessed
- customer-facing pricing should be transparent

Example presentation:

Vehicle Purchase Price
NK Service Fee (10%)
Inspection & Travel
Domestic Transport
Repair/Modification (if any)
Export/Shipping
Other agreed charges
Total

## 10. Inspection Network / Inspection Marketplace

NK should support an asset-light nationwide inspection network.

Inspector types may include:

- NK employee
- approved freelancer
- partner garage
- professional inspection company

Customer flow:

**Vehicle Case → Request Inspection → determine vehicle location → calculate inspection/travel fee → match inspector/provider → job accepted → standardized inspection → evidence/report → AI English summary → customer decision.**

NK owns the inspection standard/checklist even when work is outsourced.

Required evidence/checklist can include VIN/chassis, odometer, documents, exterior/interior, engine, transmission, suspension, brakes, tires, electrical, A/C, chassis/body condition, photos/video and OBD where applicable.

Inspector/provider performance may feed an internal Trust/Quality Score.

## 11. Inspection and travel pricing

Inspection/customer travel fees should be deterministic/configurable.

Do not let AI invent important fees.

Possible inputs:

- base inspection fee
- distance/zone
- travel time
- number of inspectors if required
- toll/parking
- overnight requirement
- special inspection services
- urgency

Customer sees a clear service price such as:

`On-site Vehicle Inspection: THB 3,500`

Internal breakdown may remain private.

Support future policy to credit some/all inspection fee toward a completed purchase if Owner configures it.

## 12. Multi-source future architecture

The Buying Browser must not be hard-coded to Facebook.

Future sources may include:

- Facebook Marketplace
- authorized LINE workflows
- dealer/partner feeds
- Thai used-car websites
- auctions/partner sources
- dealer portal
- other authorized vehicle sources

Use source adapters. Each source can have its own API/authentication/browser/share/import method.

Do not assume one scraping method applies to every source.

## 13. LINE source direction

LINE group/chat workflows may become a source adapter where supported.

For supported group messages/webhooks, normalize incoming vehicle messages/media into candidate Vehicle Cases/search results.

LINE Notes may require a separate authorized/manual/share workflow if no official API exposes the needed Note content.

Future Conversation Relay concept:

Customer question → NK AI → authorized LINE group/source conversation → seller/dealer reply → NK AI translation/normalization → Customer/Vehicle Case update.

Do not promise automation capabilities that LINE APIs do not support.

## 14. V1 rebuild scope after approval

The existing stock-first V1 should be preserved as a rollback/reference version, but the new customer-facing V1 should be rebuilt around the Buying Browser.

Minimum new V1:

1. NK customer login/account shell
2. mobile-first Browse Vehicles marketplace-style UI
3. Search / filters / location
4. Paste Vehicle Link
5. Save Vehicle → Vehicle Case
6. Vehicle Case detail
7. AI translation/normalized vehicle details
8. Ask NK AI
9. Check Availability workflow
10. transparent price calculator including configurable 10% NK service fee
11. Request Inspection
12. inspection/travel quote placeholder/rules
13. My Cases
14. Messages / AI conversation history
15. Owner/internal view of source URL, seller data, source price, verification and case status
16. source-adapter boundary for Facebook and future sources

Do not build full Payment/Purchase/Shipping ERP before this customer journey is proven.

## 15. Rebuild safety / migration rule

This is an approved product pivot, but **do not destructively delete the current implementation**.

Before rebuild:

- preserve current branch/commit as rollback reference
- create a dedicated rebuild branch
- document what is reused vs replaced
- reuse sound components/data models where appropriate
- avoid unnecessary rewrite of downstream modules that still fit the new product

Create a mobile-accessible preview for Owner review before replacing production/current public site.

No production deployment or destructive migration without explicit Owner approval.

## 16. Codex next action

Codex should now:

1. Read this file together with `MASTER_SPECIFICATION.md` and `PRODUCT_DIRECTION_LIVE_BROKER.md`.
2. Treat this document as the highest-priority direction for conflicting customer-facing V1 assumptions.
3. Preserve the current implementation as rollback/reference.
4. Produce `docs/BUYING_BROWSER_REBUILD_PLAN.md` containing:
   - target UX/routes
   - components to reuse
   - components to replace
   - source-session strategy + fallback
   - Vehicle Case data model
   - AI translation/communication boundary
   - inspection network boundary
   - transparent pricing model
   - migration approach
   - security/privacy considerations
   - acceptance tests
5. Update `docs/GAP_ANALYSIS.md` and `docs/CODEX_PROGRESS.md`.
6. Propose the smallest implementation milestone for the Buying Browser.
7. Do not production-deploy until Owner explicitly approves the preview.
