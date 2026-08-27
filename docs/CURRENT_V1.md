# NK Cars - CURRENT V1

Status: Active working context for Codex
Purpose: Keep routine development fast and token-efficient.

## Source of truth policy

GitHub is the project memory / single source of truth for approved product, architecture, pricing, workflow, recovery, and implementation decisions.

Routine Codex work should read `AGENTS.md` + this file first. Approved material changes must be recorded in GitHub before being treated as authoritative. Codex should update this file and `docs/DECISION_LOG.md` when a milestone materially changes the current system, then commit/push the docs together with stable implementation work.

GitHub is authoritative for code and decisions; it is not the runtime database for vehicle inventory or customer data.

Implementation status: The Owner-approved cross-platform Buying Browser direction remains valid. Native WKWebView, Android WebView, and Windows WebView2 proof-of-concept adapters are separate platform work; external Share and Copy Link remain fallbacks. The Owner approved deployment of each completed, tested milestone to the existing NK Cars Production Site. This does not authorize real messages, payments, destructive data actions, paid services, or security bypasses.

Web companion status: `/buy/browser` provides a browser-style NK shell on iPhone, Android, and Windows web browsers. It opens the real Facebook Marketplace in Facebook's own tab/app, accepts the selected listing link, and forwards explicit NK actions into the existing Vehicle Case flow. It does not embed, proxy, inspect, or control Facebook and must not be described as a native in-app Facebook browser.

Owner menu preview status: `/buy/owner-preview/sourcing` is an anonymous-safe interactive preview linked from Account. It allows the Owner to try sourcing-rule inputs before production identity is activated, but it receives no internal records, cannot save rules, and cannot send Hermes commands. The operational `/buy/owner` and `/buy/owner/sourcing` routes remain server-authorized Owner-only surfaces.

Vercel delivery status: the Owner registered `nkautotrade.com` in the `nkautotrade` Vercel team. The application now has a separate `nk-cars-platform-v1` Vercel project, and `https://nkautotrade.com/buy` is the active customer web domain. This does not replace `.openai/hosting.json`, the existing ChatGPT Site, QNAP storage, or the QNAP adapter boundary. `NEXT_PUBLIC_SITE_URL` controls canonical/social metadata for each runtime. Vercel Production sets `NK_ENABLE_DEMO_WORKSPACE=false`, so anonymous visitors start with a blank Guest device workspace instead of seeded demo Cases.

## 1. Current product

NK Cars is being rebuilt as an **AI Vehicle Buying Browser / Buying Platform for Thailand**.

The Owner has approved the current V1 ingestion/storage direction:

**Marketplace / authorized capture -> AI normalize -> QNAP PostgreSQL vehicle inventory + QNAP media/evidence storage -> NK App browse/selection -> customer interest -> Vehicle Case -> availability / inspection / pricing / buy workflow.**

QNAP PostgreSQL and QNAP file/media storage are the authoritative V1 runtime storage target for captured vehicle inventory. Google Sheets + Google Drive are retained only as a controlled legacy migration/import bridge and are disabled as a runtime fallback by default. The adapter boundary remains mandatory so Vehicle Case, pricing, inspection, localization, and customer workflows do not depend on a storage vendor.

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

Native NK browser/share flows remain valid ways to select/capture a source vehicle, but customer browse does not require a live Facebook feed at runtime when reviewed QNAP inventory is available.

The old stock-first implementation remains rollback/reference. Demo cards are not proof of real Marketplace browsing.

## 2. Marketplace ingestion and staging — approved V1 direction

The intended V1 operational ingestion flow is:

1. Authorized operator/agent/browser workflow finds a candidate listing from Facebook Marketplace or another supported source.
2. Capture only information/media that the operator is permitted to access and retain.
3. Preserve source URL/listing reference and capture timestamp internally.
4. AI extracts/normalizes useful fields such as brand, model, year, grade, engine, transmission, drive, body/cab, mileage, color, location, asking price, condition notes, and confidence/provenance.
5. QNAP media storage keeps customer-visible derivatives separate from internal evidence and documents.
6. QNAP PostgreSQL stores one authoritative inventory record per captured vehicle plus customer-safe/internal/audit fields as appropriate.
7. NK App reads a strict customer-safe projection through the authenticated internal QNAP Data API for Browse/NK Selection.
8. When a customer expresses qualified interest, create/activate a Vehicle Case and snapshot the relevant staged vehicle facts into the case.
9. Vehicle Case then owns the operational customer/deal workflow; later source changes must not silently rewrite historical case facts.

Google staging data remains available only for controlled migration/import validation. Set `NK_ENABLE_GOOGLE_STAGING_FALLBACK=true` explicitly to use that bridge; normal runtime must not require Google credentials.

Do not make customer or domain logic depend on PostgreSQL columns or filesystem paths. Use the existing inventory/media adapter and customer DTO boundaries.

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

## 3. QNAP media/evidence storage

Use a deterministic per-vehicle structure, for example:

`/nk-cars/media/<visibility>/<NK-STAGING-ID>/`
- `photos/`
- `evidence/`
- optional `documents/`

Do not expose internal source/seller evidence directly to customers. Customer-facing media should be served through the NK customer-safe layer according to rights/policy.

Customer web containers may mount/serve only customer-visible media. Internal evidence remains outside the public mount. Backup, checksum, restore, retention, and access policy are owned by QNAP infrastructure; application code owns visibility classification and customer-safe references.

## 4. Current customer UX direction

Mobile-first, especially iPhone.

Customer browse shows reviewed NK Selections from QNAP when connected, while real-source selection may also happen via native/source browser adapters. A verified repository snapshot remains the availability fallback and is clearly labelled non-live.

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
- QNAP PostgreSQL inventory adapter (primary V1 runtime)
- QNAP media storage adapter (primary V1 runtime)
- Google Sheets/Drive migration import bridge (disabled by default)

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

## 12. Current implementation checkpoint — 2026-08-27

Latest confirmed checkpoint from Codex:
- Buying Browser web app, search/filters, twenty Owner-approved vehicle snapshots, swipeable customer-safe photo galleries, USD display, Save to NK, Vehicle Cases, availability/inspection/AI/message flows, Owner source boundary, split pricing, and EN/Chinese/Thai localization are implemented.
- Previous Google staging work remains migration history in `docs/CODEX_PROGRESS.md`; current QNAP-primary verification is recorded in the latest entry.
- QNAP PostgreSQL is the primary server inventory adapter. Google staging is now an explicit migration bridge only; the verified repository snapshot remains fail-safe when QNAP is unavailable.
- The repository Data API now implements the strict authenticated QNAP Owner inventory and customer/Owner media endpoints used by the application. The currently installed QNAP release must still be upgraded before those endpoints are live; until then `/buy/owner` fails closed to the verified internal fallback.
- The Owner approved the second deduplicated ten-vehicle batch for Browse on 2026-08-27. The verified repository fallback therefore contains 20 customer-safe records. Approval for Browse does not verify current availability, price, condition, or unresolved specifications.
- The legacy Google migration source retains deterministic per-vehicle folders for audit/recovery, but customer runtime no longer depends on it by default.
- `Media.sort_order = 1` is the reviewed customer cover contract. Four approved records that previously opened with interior/bed photos now use deterministic redacted derivatives of their real source covers; original files remain internal evidence.
- Production public/internal hardening now requires an explicit server-side Owner account allowlist for `/buy/owner`. Raw browser evidence is retained under repository-private evidence storage and is no longer shipped from `public/`; the nine reviewed POC images were moved under the approved customer marketplace asset boundary.
- The customer DTO uses first-party NK media-proxy URLs and never receives source URL, seller data, Drive file IDs, or Drive URLs.
- The existing QNAP database still requires an infrastructure-owned publication-state import for the second batch. Until that handoff is applied, external runtimes use the verified 20-record repository snapshot rather than pretending QNAP is synchronized.
- Signed-in customer Vehicle Cases, saved vehicles, imported customer-safe listings, and conversation history now synchronize to a D1-backed account workspace. Anonymous activity remains device-local until the customer signs in.
- Current application branch: `codex/app`.
- Previous pushed implementation checkpoint: `e1b4cacc57bdd914c09c671be908f32e817e7a8f`. The current sync milestone commit is recorded in `docs/CODEX_PROGRESS.md`.
- Bangkok Metro is now the default Browse scope. Sixteen of the twenty reviewed records are in the default operating area; direct links and All Thailand filtering retain access to the remaining records.
- Mobile navigation is now Browse, Saved, My Cases, Messages, and Account. Inspection remains available inside My Cases.
- Vehicle detail now surfaces Check Availability and Ask NK AI before specifications, uses a photo-level Save control, and replaces customer-facing technical normalization labels with translated vehicle language.

## 13. Next implementation priority

Do not rewrite working Buying Browser / Vehicle Case / pricing / inspection / localization modules.

Latest durable operations update:
- Authenticated Owner Case verification is implemented with server-side allowlist enforcement.
- Owner can record availability, actual purchase price, and material cost confirmations; null remains Pending and explicit zero is required for no-charge lines.
- Every Owner update uses optimistic Revision protection and append-only old/new value audit evidence.
- Final quotation issue, PI, payment, purchase, and external communication remain disabled.
- Customer workspace sync cannot self-verify or overwrite Owner-confirmed availability, purchase price, fee rates, material costs, or Owner audit history.
- Next milestone is `BB-V1D-04 - Owner-Approved Quotation Record`, followed by gated PI preparation only after customer acceptance.
- Owner-approved quotations are now implemented with `QT-YYYY-######` numbering, immutable verified pricing/FX snapshots, three-day validity, signed-in customer acceptance, audit history, and material-change supersession.
- Accepted quotations move the Case to `Ready for PI Review`; no PI, payment confirmation, seller transfer, or vehicle purchase is created automatically.
- Current next milestone is `BB-V1D-05 - Gated Proforma Invoice`, followed by Finance-only payment confirmation controls.
- Gated Proforma Invoice is now implemented: Owner-only issue from an accepted current quotation, `PI-YYYY-######` numbering, immutable pricing/FX snapshot, three-day validity/recheck, multilingual customer view, and print/save-PDF layout.
- PI payment status remains `Not confirmed`; the application does not invent bank instructions, confirm money, pay sellers, or approve vehicle purchase.
- Further commercial activation is blocked until Owner/Finance supplies approved legal issuer details, payment instructions, roles, and actual-funds confirmation policy.

Completed source-layer items:
1. QNAP PostgreSQL customer inventory adapter
2. separate customer-visible and internal-only QNAP media roots
3. strict allowlisted customer DTO parser for QNAP responses
4. repository fallback and safe QNAP-centric sync status
5. optional Google migration bridge, disabled by default
6. authenticated QNAP Owner inventory parser/client and Owner-only media application proxy
7. QNAP Owner inventory/media Data API endpoints with customer/internal visibility enforcement
8. deterministic Hermes/connector worker bridge and review-only candidate ingestion with duplicate and Bangkok-day limit enforcement
9. internal-only source-image download, bounded raster validation, re-encoding, and QNAP persistence

Next priority:
1. QNAP infrastructure supplies a stable authenticated HTTPS Data API origin reachable by the approved app runtime without exposing PostgreSQL
2. QNAP infrastructure deploys the repository Data API release that implements the authenticated Owner inventory/media and candidate-ingestion endpoints; the application client has validated all 20 migrated records and 368 media references
3. verify the deployed Owner account allowlist and D1 account-workspace migration on the existing Site
4. verify Quotation requests and readiness history through a signed-in production account; PI remains gated until an approved final quotation is accepted
5. add an authenticated Owner operations queue for availability, actual purchase price, and material cost confirmation
6. verify QNAP media retention, customer/internal separation, backup, and restore under the infrastructure runbook
7. provision the private worker credential and authorized Facebook browser profile, then prove one real candidate reaches `NEEDS_REVIEW` without publication or seller messaging

## 14. QNAP / Hermes direction

Approved application storage direction:
- GitHub remains source-of-truth for code and project decisions.
- QNAP PostgreSQL and media/file storage are the V1 authoritative inventory storage target; the signed-in workspace cutover remains separate.
- Hermes may perform sourcing/AI operator tasks through authorized browser/source workflows.
- Google Sheets + Drive remain only a temporary import/migration source and optional export/reporting surface.
- Target flow is `Hermes/authorized capture -> QNAP PostgreSQL + QNAP storage -> NK App`.
- The application now includes an Owner-only mobile sourcing automation menu for rule criteria, year range, Bangkok Metro areas, daily cap, schedule, and Hermes Run Now/Pause/Resume commands.
- The repository now includes the QNAP PostgreSQL sourcing-rule/audit/command/runtime/candidate schema, authenticated admin endpoints, separate worker-token endpoints, deterministic connector bridge, internal-only media persistence, and a bounded HTTPS ingress allowlist. Candidate ingestion can only create `NEEDS_REVIEW` records. These components remain fail-closed until the tested release is installed on QNAP and production identity/ingress/worker authorization is activated.
- QNAP full stack commit `f9793f15189b6eaf356dae03f92ee5dc94478c71` was deployed on 2026-08-27 and the Data API is healthy. A QNAP-only `NK_HERMES_WORKER_TOKEN` is configured and distinct from `NK_INTERNAL_API_TOKEN`.
- The installed Hermes container is running, but its current free inference provider has returned rate-limit errors and its browser profile/connector runtime is not connected. The application must continue to report `not_configured` or the real safe error state; it must not claim that automated sourcing ran.
- The requested Phetchaburi Hermes pilot is blocked by current QNAP rule validation, which only permits Bangkok Metro locations. No Facebook search, candidate retention, publication, seller message, payment, or purchase was performed during the activation attempt.

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

## 17. V1 application completion checkpoint - 2026-08-27

The maximum technically achievable Buying Browser V1 application scope is complete on `codex/app`:

- Browse contains 20 Owner-reviewed customer-safe vehicle snapshots, including 16 in the default Bangkok Metro scope.
- English, Simplified Chinese, and Thai now cover the core customer surfaces: Browse, vehicle detail/gallery, Saved, Vehicle Cases, inspection requests, Messages, Account, Paste/Share fallback, source browser companion, and NK AI search.
- Language selection changes presentation only. It does not duplicate or mutate vehicle, pricing, quotation, PI, or Case records.
- Deterministic commercial flow is implemented through 6% Platform & Transaction plus 4% Buying Service, configured pass-through costs, Owner verification, quotation/acceptance, and gated PI preparation.
- Availability, inspection, messages, and AI actions record honest workflow state without pretending a provider, seller reply, payment, or purchase exists.
- Customer/internal data boundaries and QNAP/repository fail-safe source adapters remain intact.
- Mobile verification at 390 x 844 passed for all core routes, all three languages, galleries, images, and horizontal layout.

Remaining items are activation blockers rather than unfinished application behavior: production identity/workspace persistence, approved legal issuer/payment instructions, authorized seller messaging/reply ingestion, inspection-provider booking, and stable authenticated QNAP Data API/media ingress. These must not be faked or activated without the required Owner/external inputs.

Public entry behavior: `https://nkautotrade.com/` redirects directly to `/buy`. Existing `/buy/...` routes remain stable for vehicle, Case, PI, and shared links.

Identity/workspace activation checkpoint:
- The application now supports a provider-neutral QNAP identity gateway without collecting passwords in NK forms.
- The identity gateway contract now supports allowlisted Google and Apple provider selection. The Account UI renders provider-specific actions only when the corresponding gateway providers are explicitly enabled.
- Vercel defaults to identity disabled until the QNAP gateway is explicitly configured; raw ChatGPT identity headers are not trusted there.
- A strict QNAP workspace adapter covers customer workspace reads/writes, Owner queue/verification, quotation acceptance/issue, and PI issue while preserving ownership, revision, deterministic commercial controls, and append-only audit contracts.
- ChatGPT Site + D1 remain the rollback adapter. Production account activation still waits for QNAP infrastructure to implement the documented endpoints and for Owner-controlled runtime secrets/URLs to be configured.
