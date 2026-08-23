# NK Cars — Product Direction Amendment: Live AI Broker Mode

Status: Authoritative product-direction amendment
Priority: Supersedes conflicting V1 assumptions in `docs/MASTER_SPECIFICATION.md`
Effective date: 2026-08-23

## 1. Core product pivot

NK Cars should no longer be designed primarily as a website that permanently copies and stores a large catalog of Facebook Marketplace vehicles.

The primary product is now an **AI Vehicle Sourcing & Export Broker**.

Customer experience:

**Customer request → NK AI translates the requirement → NK sourcing layer searches authorized Thai supply sources → results are normalized/translated → customer reviews candidate vehicles → NK verifies availability/price → deal workflow continues.**

Published NK inventory may still exist, but it is secondary to live/on-demand sourcing.

## 2. Customer search experience

The customer may search in natural language, for example:

- “Find Toyota Hilux Revo 2020–2022 manual under $15,000.”
- “Only 4WD.”
- “Bangkok only.”
- “Show the cheapest 5.”
- “Increase the search area to nearby provinces.”

NK AI converts the request into structured search criteria such as:

- keyword(s)
- brand/model
- year range
- transmission
- drive type
- body/cab type
- maximum mileage
- maximum budget
- province/area
- required/excluded keywords

## 3. Sourcing Automation Settings

Owner must be able to configure sourcing rules from mobile.

Each rule may include:

- Rule name
- Source platform
- Search keyword(s)
- Brand/model
- Year from/to
- Transmission
- Drive type
- Body/cab type
- Maximum source price
- Maximum mileage
- Province/area/radius
- Required keywords
- Excluded keywords
- Priority
- Active/inactive
- Assigned authenticated browser profile/session

Example:

`Revo Export — keyword Revo — year 2020–2022 — AT — 4WD — Bangkok — Profile FB Buyer 01`

## 4. Authenticated browser profile/session model

Facebook Marketplace may require authentication. The architecture should support an authorized browser session/profile for sourcing.

Do NOT build a new browser engine. Use an existing browser automation/runtime such as Chromium/Playwright or another suitable authorized browser-session implementation.

The system should support:

- persistent authenticated browser profile/session
- manual login/re-login by an authorized human when needed
- `Login Required` state when session expires or Facebook requests verification
- encrypted session/profile storage
- no plaintext Facebook password storage when avoidable
- no bypass of MFA, verification, CAPTCHAs, platform security, or access controls

V1 may begin with **one authenticated Facebook profile + a job queue**.

The architecture must not hard-code the assumption that there will always be exactly one profile. It should allow a future profile pool for legitimate operational scaling and resilience.

Multiple profiles must not be used to evade platform limits or restrictions.

## 5. Search queue and safety

With one authenticated profile, customer searches and scheduled sourcing tasks should go through a controlled queue rather than uncontrolled simultaneous browsing.

Track for each search run:

- rule/request
- browser profile used
- started/completed time
- listings found
- duplicates
- rejected/non-matching results
- candidate results
- errors
- Login Required / verification events

Use conservative rate limits and stop/alert behavior when the platform requests verification or shows abnormal restrictions.

## 6. Live result model

For ordinary search results, NK does **not** need to permanently copy all source images and full source listings into NK storage.

Preferred model:

**Source-first / live broker result**

Store enough metadata to operate safely, such as:

- source URL
- source platform
- source listing ID when available
- normalized vehicle specs
- source price last observed
- seller/location metadata required internally
- last checked / last verified
- confidence/provenance
- customer search/match relationship

Images may initially be displayed through a permitted source/proxy/cache approach where technically and legally appropriate.

Do not assume direct hotlinking to Facebook images will always work or remain stable.

## 7. Snapshot policy

Do not make “store nothing” an absolute rule.

When a vehicle becomes operationally important, preserve an NK snapshot according to policy.

Suggested snapshot triggers:

- Owner approves vehicle for a customer
- customer expresses qualified interest
- availability/final-price verification starts
- quote/deal is created
- vehicle becomes Reserved
- vehicle becomes Purchased/Secured
- compliance/audit evidence is required

Snapshot may preserve:

- key images needed for the deal/audit
- normalized listing data
- observed source price
- source URL
- verification timestamp
- seller/contact evidence internally where permitted

This protects the deal if the source listing later disappears or changes.

## 8. Customer-facing translation / normalization

NK acts as the translation and brokerage layer.

Source listing text should NOT simply be copied wholesale to overseas customers.

NK AI should extract only useful factual details and present concise English customer-facing information.

Example customer output:

- vehicle model/year
- engine
- transmission
- drive
- body/cab
- mileage
- color
- general location such as Bangkok/Thailand where appropriate
- NK estimated/final customer price
- availability/inspection disclaimer

Do not expose by default:

- seller phone number
- seller Facebook identity
- source URL
- internal source cost
- NK margin
- internal seller notes

Seller/contact/source information remains internal for NK verification and procurement unless policy explicitly allows otherwise.

## 9. Location and inland-cost logic

Location affects real acquisition cost.

When the source vehicle is outside the configured base area, the system should calculate or look up internal travel/inspection/transport cost.

Do not let AI invent important cost numbers.

Use configurable deterministic rules or verified rate tables, for example:

- base/Bangkok zone
- nearby province
- distant province
- car-carrier/slide-truck option
- staff travel option

Internal economics may be:

`Source Price + Verified Inland/Travel/Inspection Cost + Other Approved Costs = Internal Acquisition Cost`

Then apply NK customer-pricing rules.

## 10. Seller communication / Messenger

Marketplace seller communication may occur through Messenger/Facebook chat where that is the source platform’s supported user flow.

Initial recommended mode:

**AI prepares/routs routine inquiry → human reviews/sends where needed.**

Future controlled automation may handle approved routine messages such as:

- Is the vehicle still available?
- What is the latest price?
- Please send current mileage photo.
- Please send VIN/chassis photo.
- Please send additional vehicle photos/video.
- Where is the vehicle located?

Material commitments remain controlled:

- final negotiation outside approved bounds
- reservation commitment
- deposit commitment
- purchase commitment
- payment

Respect platform rules and do not build mechanisms intended to bypass anti-automation or account-safety controls.

## 11. Availability and verification

Live search result does not equal confirmed stock.

Customer-facing states should distinguish:

- Found / Search Result
- Estimated / Unverified
- Availability Check Requested
- Verified Available
- Price Changed
- Possibly Unavailable
- Reserved
- Sold

AI must never tell the customer that a car is definitely available until NK has current verification.

## 12. Result deduplication

Search across Marketplace/groups/sources may return the same physical vehicle repeatedly.

Use registration/VIN where available plus image similarity, model/year/color, mileage, seller, text and location to identify possible duplicates.

Merge confident duplicates into one candidate with multiple internal sources.

For the same physical vehicle, prefer the lowest **currently verified** source price rather than the lowest stale historical price.

## 13. Customer journey under Live Broker Mode

Primary journey:

**Customer asks/searches**
→ NK AI parses requirement
→ Search job queued
→ authenticated sourcing worker searches source(s)
→ candidates normalized and translated
→ AI ranks candidates
→ customer sees 3–5 useful choices when possible
→ customer selects/interests
→ NK verifies seller availability + current price
→ Final pricing/negotiation workflow
→ Quote / PI / Payment / Purchase workflow according to Master Specification

This journey is now more important than manually publishing thousands of copied stock records.

## 14. Existing Marketplace page

Keep the Marketplace/listing interface, but reinterpret it as a mix of:

- NK-approved published opportunities
- recently verified sourced vehicles
- sold/history examples
- customer-specific matched candidates where appropriate

Do not require every live source result to become permanent public inventory.

## 15. V1 implementation priority after this amendment

The smallest useful V1 milestone should now prioritize:

1. Natural-language / structured vehicle search request
2. Sourcing Rule configuration
3. Browser Profile status (`Ready`, `Login Required`, `Paused`, `Error`)
4. Controlled search queue
5. Marketplace/source search adapter boundary
6. Import/normalize candidate listing data
7. AI English normalization / spec extraction
8. Duplicate detection
9. Candidate result view
10. Customer interest / Check Availability
11. Waiting Review / Owner control where required
12. Lead/Wanted Request linkage

Do not expand into full Payment/Purchase/Shipping ERP before this sourcing loop is proven.

## 16. Technical design rule

Keep source adapters separate from NK business logic.

Suggested boundaries:

- `SourceAdapter` — search/open/read source data
- `BrowserProfileManager` — authorized sessions and login state
- `SearchQueue` — controlled jobs and rate limiting
- `VehicleNormalizer` — structured vehicle schema
- `VehicleIntelligence` — AI extraction/translation/confidence
- `DuplicateMatcher` — physical-vehicle/source deduplication
- `LocationCostEngine` — deterministic internal location costs
- `CustomerResultPresenter` — customer-safe English result
- `VerificationWorkflow` — current availability/price confirmation

If Facebook changes, replace/update the Facebook adapter without rewriting NK pricing, customer, lead, or order logic.

## 17. Relationship to Master Specification

This document is an authoritative amendment to `docs/MASTER_SPECIFICATION.md`.

Where there is a conflict:

**this Live AI Broker amendment controls the V1 sourcing/product direction.**

Requirements in the Master Specification for payments, approvals, Purchase Fund, Auto-Buy, procurement, repair, shipping, 360 views, audit, reporting and future operations remain valid unless explicitly changed here.

Codex should update its gap analysis and V1 milestone plan to reflect this pivot before materially expanding development.
