# NK Cars - CURRENT V1

Status: Active working context for Codex
Purpose: Keep routine development fast and token-efficient.

## Source of truth policy

GitHub is the project memory / single source of truth for approved product, architecture, pricing, workflow, recovery, and implementation decisions.

Routine Codex work should read `AGENTS.md` + this file first. Approved material changes must be recorded in GitHub before being treated as authoritative. Codex should update this file and `docs/DECISION_LOG.md` when a milestone materially changes the current system, then commit/push the docs together with stable implementation work.

GitHub is authoritative for code and decisions; it is not the runtime database for vehicle inventory or customer data.

Implementation status: The Owner-approved cross-platform Buying Browser direction remains valid. Native WKWebView, Android WebView, and Windows WebView2 proof-of-concept adapters are separate platform work; external Share and Copy Link remain fallbacks. The Owner approved deployment of each completed, tested milestone to the existing NK Cars Production Site. This does not authorize real messages, payments, destructive data actions, paid services, or security bypasses.

Web companion status: `/buy/browser` provides a browser-style NK shell on iPhone, Android, and Windows web browsers. It opens the real Facebook Marketplace in Facebook's own tab/app, accepts the selected listing link, and forwards explicit NK actions into the existing Vehicle Case flow. It does not embed, proxy, inspect, or control Facebook and must not be described as a native in-app Facebook browser.

## 1. Current product

NK Cars is being rebuilt as an **AI Vehicle Buying Browser / Buying Platform for Thailand**.

The Owner has approved an additional V1 ingestion/staging direction:

**Marketplace / authorized capture -> AI normalize -> Google Sheets vehicle staging + Google Drive media/evidence staging -> NK App browse/selection -> customer interest -> Vehicle Case -> availability / inspection / pricing / buy workflow.**

Google Sheets + Google Drive are the approved V1 staging layer for captured vehicle inventory. They are not intended to become the permanent business-domain database. The architecture must keep a clean adapter boundary so the staging layer can later move to PostgreSQL/QNAP storage without rewriting Vehicle Case, pricing, inspection, or customer workflows.

Primary real-source customer journey:

**Find/capture a real source vehicle**
-> normalize and stage source data/media
-> show a customer-safe NK Selection in the app
-> customer saves/asks/checks availability/requests inspection
-> create or activate Vehicle Case
-> AI translates/normalizes vehicle information
-> Check Availability
-> Request Inspection
-> transparent NK pricing
-> later Buy Through NK / procurement / export.

Native NK browser/share flows remain valid ways to select/capture a source vehicle, but customer browse does not require a live Facebook feed at runtime when a reviewed Sheet/Drive staged snapshot is available.

The old stock-first implementation remains rollback/reference. Demo cards are not proof of real Marketplace browsing.

## 2. Marketplace ingestion and staging — approved V1 direction

The intended V1 operational ingestion flow is:

1. Authorized operator/agent/browser workflow finds a candidate listing from Facebook Marketplace or another supported source.
2. Capture only information/media that the operator is permitted to access and retain.
3. Preserve source URL/listing reference and capture timestamp internally.
4. AI extracts/normalizes useful fields such as brand, model, year, grade, engine, transmission, drive, body/cab, mileage, color, location, asking price, condition notes, and confidence/provenance.
5. Google Drive stores vehicle photos and evidence for the staging workflow.
6. Google Sheets stores one authoritative staging record per captured vehicle plus customer-safe/internal/audit fields as appropriate.
7. NK App reads a customer-safe projection of staged vehicle data and media for Browse/NK Selection.
8. When a customer expresses qualified interest, create/activate a Vehicle Case and snapshot the relevant staged vehicle facts into the case.
9. Vehicle Case then owns the operational customer/deal workflow; later source changes must not silently rewrite historical case facts.

V1 implementation should move from the current one-car manual Sheet/Drive proof-of-concept toward automated per-vehicle staging and synchronization.

Do not make the customer app depend directly on arbitrary spreadsheet column positions. Use a stable staging schema / adapter so Sheet/Drive can later be replaced by QNAP PostgreSQL + object/file storage.

### Suggested V1 staging identity

Each staged vehicle should have a stable NK vehicle/source capture ID, for example `NK-SRC-2026-000123`.

Minimum staging metadata should include:
- NK staging vehicle ID
- source platform
- source URL / listing ID where available
- capture timestamp / last checked timestamp
- normalized specs
- observed source asking price
- location
- internal seller/contact fields where permitted
- customer-safe translated/normalized summary
- Drive folder/media references
- visibility/status
- duplicate/match key
- AI confidence/provenance
- review status
- availability verification status

Recommended statuses include:
`Captured -> AI Processing -> Needs Review -> Approved for Browse -> Availability Check -> Reserved/Sold/Unavailable/Archived`.

## 3. Google Drive media/evidence staging

Move beyond the current one-flat-folder POC toward a deterministic per-vehicle structure, for example:

`NK Cars / Vehicle Staging / <NK-STAGING-ID> /`
- `photos/`
- `evidence/`
- optional `documents/`

Do not expose internal source/seller evidence directly to customers. Customer-facing media should be served through the NK customer-safe layer according to rights/policy.

Google Drive is V1 staging storage, not the long-term mandatory storage engine. Future target may move to QNAP/NK storage while preserving the same media-reference interface.

## 4. Current customer UX direction

Mobile-first, especially iPhone.

Customer browse may show reviewed staged NK Selections from Sheet/Drive, while real-source selection may also happen via native/source browser adapters.

Primary actions:
- Browse Vehicles
- Paste Vehicle Link
- Ask NK AI to Find One
- Save to NK
- Ask NK AI
- Check Availability
- Request Inspection

Suggested customer navigation:
**Browse | Saved | My Cases | Messages | Account**

V1 Browse defaults to **Bangkok Metro** to reduce inspection/travel time and cost. The operating group currently includes Bangkok, Nonthaburi, Pathum Thani, Samut Prakan, Samut Sakhon, and Nakhon Pathom. Nearby provinces and All Thailand remain available through filters; they are not the default customer view.

Inspection remains a first-class Vehicle Case workflow but is no longer a separate primary mobile navigation destination. Customers access inspection status and requests from My Cases. Vehicle detail presents Check Availability as the recommended first step, keeps Ask NK AI beside it, and keeps Save as a familiar photo-level heart action.

Customer location/destination country is separate from Search Location. Do not use the overseas customer's physical location as the Thai Marketplace search area.

## 5. Vehicle Case

A Vehicle Case becomes the operational record once a customer shows qualified interest or triggers a case action.

Vehicle Case should support:
- source platform / staging vehicle reference
- source URL/listing ID internally
- normalized vehicle snapshot
- observed asking price + timestamp
- internal seller/location data where permitted
- customer relationship
- AI translation/summary
- availability/verification status
- source conversation history
- inspection status/report
- pricing snapshot
- quote/order linkage later
- audit trail

Important rule: staging inventory may update as the source changes, but an existing Vehicle Case should preserve its historical snapshots/audit trail and only change material facts through explicit verification/update events.

## 6. Source architecture

Do not hard-code Facebook, Google Sheets, or Google Drive into NK business logic.

Use adapter boundaries for:
- Facebook Marketplace
- LINE workflows
- dealer/partner feeds
- Thai vehicle websites
- auction/partner sources
- Dealer Portal
- Google Sheets staging adapter
- Google Drive media adapter
- future PostgreSQL/QNAP inventory adapter
- future QNAP/object media storage adapter

Source access may use supported APIs, authorized sessions/browser workflows, share/copy-link flows, or other source-appropriate methods. Never fake successful source access.

## 7. Source authentication

Where source login is required:
- customer/source operator authenticates themselves
- no plaintext password storage
- isolate sessions by customer/profile
- Login Required state when expired
- no MFA/CAPTCHA/security bypass
- fallback to Open Source App/Browser + Share/Copy Link if managed browsing is unsupported

## 8. AI behavior

AI may:
- translate Thai <-> English / Simplified Chinese
- extract vehicle specs
- summarize listing details
- rank/match vehicles
- prepare routine seller questions
- summarize seller replies

AI must not invent:
- availability
- source price
- mileage/VIN/spec
- travel/inspection fee
- shipping
- discount
- payment status

Use Unknown / Need Review / Conflict when evidence is insufficient.

## 9. Commercial model

Current intended structure:

**Vehicle Purchase Price + NK Platform & Transaction Fee + NK Buying Service + Inspection/Travel + Domestic Transport + Repair/Modification + Export/Shipping + other agreed charges.**

Current intended NK fee components:
- **NK Platform & Transaction: 6% of actual vehicle purchase price**
- **NK Buying Service: 4% of actual vehicle purchase price**
- **Total NK fee target: 10% of actual vehicle purchase price**

The two component rates are configurable in Owner settings. Customer screens show monetary amounts and service inclusions, not percentages by default.

Do not apply NK percentage fees to pass-through costs unless an approved future pricing policy explicitly says otherwise.

All important calculations must be deterministic.

## 10. Language support

Customer-facing V1 supports:
- English (default)
- Simplified Chinese
- Thai

Use one authoritative structured business record. Language switching must not duplicate or mutate underlying vehicle/pricing data.

Preserve original source text separately from normalized/translated customer text.

## 11. Inspection Network

Vehicle Case
-> Request Inspection
-> calculate location/travel fee
-> assign/match NK employee, freelancer, partner garage, or inspection company
-> standardized checklist/evidence
-> AI customer-language summary
-> customer purchase decision.

Inspection/travel fees must come from configured deterministic rules/rate tables, not AI estimates.

## 12. Current implementation checkpoint — 2026-08-26

Latest confirmed checkpoint from Codex:
- Buying Browser web app, search/filters, ten reviewed vehicle snapshots, swipeable six- or seven-photo galleries, USD display, Save to NK, Vehicle Cases, availability/inspection/AI/message flows, Owner source boundary, split pricing, and EN/Chinese/Thai localization are complete locally and pushed.
- Previous checkpoint tests passed. Current Google staging milestone verification is recorded in `docs/CODEX_PROGRESS.md`.
- Google staging is now implemented as the primary server adapter with a five-minute request-time cache and repository fallback.
- The private `NK Cars Vehicle Staging Registry` contains 20 vehicle rows: 10 approved vehicles plus a second deduplicated batch of 10 vehicles in `Needs Review`.
- Google Drive now has deterministic per-vehicle `photos/` and `evidence/` folders for all 20 vehicles. Drive contains 64 approved customer images plus 137 private Needs Review evidence images for the second batch.
- `Media.sort_order = 1` is the reviewed customer cover contract. Four approved records that previously opened with interior/bed photos now use deterministic redacted derivatives of their real source covers; original files remain internal evidence.
- Production public/internal hardening now requires an explicit server-side Owner account allowlist for `/buy/owner`. Raw browser evidence is retained under repository-private evidence storage and is no longer shipped from `public/`; the nine reviewed POC images were moved under the approved customer marketplace asset boundary.
- The customer DTO uses first-party NK media-proxy URLs and never receives source URL, seller data, Drive file IDs, or Drive URLs.
- Runtime activation still requires `GOOGLE_SERVICE_ACCOUNT_JSON` in the approved hosting secret store and Viewer access to the staging root. Without it, the tested repository snapshot remains active.
- Signed-in customer Vehicle Cases, saved vehicles, imported customer-safe listings, and conversation history now synchronize to a D1-backed account workspace. Anonymous activity remains device-local until the customer signs in.
- Current branch: `codex/buying-browser-rebuild`.
- Previous pushed implementation checkpoint: `e1b4cacc57bdd914c09c671be908f32e817e7a8f`. The current sync milestone commit is recorded in `docs/CODEX_PROGRESS.md`.
- Bangkok Metro is now the default Browse scope. Six of the current ten reviewed records are in the default operating area; direct links and All Thailand filtering still retain access to the remaining records.
- Mobile navigation is now Browse, Saved, My Cases, Messages, and Account. Inspection remains available inside My Cases.
- Vehicle detail now surfaces Check Availability and Ask NK AI before specifications, uses a photo-level Save control, and replaces customer-facing technical normalization labels with translated vehicle language.

## 13. Next implementation priority

Do not rewrite working Buying Browser / Vehicle Case / pricing / inspection / localization modules.

Completed source-layer items:
1. stable header-mapped Google Sheet schema
2. deterministic per-vehicle Drive structure
3. private server-side staging adapter
4. customer-safe media proxy and visibility enforcement
5. repository fallback and safe sync status

Next priority:
1. Owner configures the runtime service-account secret and shares the private staging root with that account
2. verify live sync in a non-production preview: customer Browse remains 10 approved vehicles/64 approved media, while Owner review sees all 20 vehicles and the 10-item review queue
3. verify the deployed Owner account allowlist and D1 account-workspace migration on the existing Site
4. add deterministic Quotation readiness and PI gating after durable Case identity and sync audit
5. add private operational media storage/retention beyond the reviewed customer asset boundary
6. automate authorized capture -> normalize -> review rows/media without bypassing source controls

## 14. Future QNAP / Hermes direction

Approved infrastructure direction under evaluation:
- GitHub remains source-of-truth for code and project decisions.
- QNAP may become web/API server, PostgreSQL database, private media/file storage, background-worker host, and Hermes host.
- Hermes may perform sourcing/AI operator tasks through authorized browser/source workflows.
- Google Sheets + Drive remain useful as V1 staging/control layer while the QNAP runtime is being proven.
- Future migration target may be `Hermes/QNAP -> Source -> PostgreSQL + QNAP storage -> NK App`, with Sheets retained as optional admin/export/control view.

Do not switch production architecture to QNAP until backup, recovery, security, networking, and deployment controls are documented and tested.

## 15. Working assumptions

- Current public/old implementation remains rollback/reference.
- No production deployment without Owner approval.
- No destructive replacement until mobile preview is reviewed.
- Real external messaging remains approval-gated until explicitly authorized.
- Secrets, sessions, customer data, and production data do not belong in GitHub.

## 16. Codex routine workflow

For each small milestone:
1. Read `AGENTS.md` + this file + recent relevant entries in `docs/DECISION_LOG.md`.
2. Inspect only task-relevant files.
3. Implement.
4. Run targeted tests.
5. Run broader checks only when warranted/milestone complete.
6. Fix issues.
7. Update this file if current state materially changed.
8. Append approved material decisions to `docs/DECISION_LOG.md`.
9. Commit and push stable work.
10. Report only: result, tests, commit SHA, blocker/next item.

Do not reread the full Master Spec unless scope is ambiguous or changing.
