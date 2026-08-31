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

HiSpeed domain status: the Owner approved replacing `xiangshihai.com` with `taishuaiauto.com` for HiSpeed on 2026-08-31. The same Vercel application now routes `taishuaiauto.com` / `www.taishuaiauto.com` to the existing HiSpeed presentation layer without creating a separate backend, inventory database, QNAP stack, Hermes runtime, or pricing engine. `nkautotrade.com/buy` remains the NK Cars customer route.

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

Approved customer navigation:
**Browse | Saved | Shipments | My Cases | Account**

Messages/conversation are shown inside Vehicle Case context rather than as a primary customer navigation item.

V1 Browse defaults to **Bangkok Metro** to reduce inspection/travel time and cost. The operating group currently includes Bangkok, Nonthaburi, Pathum Thani, Samut Prakan, Samut Sakhon, and Nakhon Pathom. Nearby provinces and All Thailand remain available through filters; they are not the default customer view.

Inspection remains a first-class Vehicle Case workflow but is no longer a separate primary mobile navigation destination. Customers access inspection status and requests from My Cases. Vehicle detail presents Check Availability as the recommended first step, keeps Ask NK AI beside it, and keeps Save as a familiar photo-level heart action.

Owner-approved marketplace UI direction: Browse is mobile-first and uses a two-column vehicle grid on small phones, with larger readable text, image-first vehicle cards, THB price primary, USD estimate secondary, and only key facts on the card. Saved vehicles act as a shortlist where customers can select multiple vehicles and add them to a shipment plan. The customer shipment planner guides 1, 2, or 3 cars per shipment, shows full-shipment and per-car planning estimates, explains that 3 cars share freight plus the THB 25,000 Rushing/loading service, and keeps shipping estimates separate from confirmed totals.

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

Inspection/travel rule approved on 2026-08-28:
- Bangkok Metro vehicle inspection starts at THB 5,000. The active Bangkok Metro group is Bangkok, Nonthaburi, Pathum Thani, Samut Prakan, Samut Sakhon, and Nakhon Pathom.
- Outside Bangkok Metro inspection/travel uses configured distance from Bangkok x THB 20 per km, with THB 5,000 as the current minimum charge.
- Unknown locations remain Pending until NK configures or confirms the location; AI must not estimate the distance or fee.

Customer shipping plan rule approved on 2026-08-28:
- Vehicle Case pricing lets the customer select destination country/port and shipment quantity from 1 to 3 cars.
- Destination choices cover a broader right-hand-drive / left-traffic target-market list. This is routing/planning coverage, not a guarantee that every vehicle can be legally imported into that country.
- The destination country is required before a shipping estimate can be calculated. If the customer changes only the car quantity without a destination, the Export / Shipping line prompts them to choose the country first.
- The customer screen may show public-source indicative ocean freight ranges or Owner-approved planning benchmark groups as a pre-booking estimate only. The customer-facing planning range keeps the benchmark low end and adds a 15% planning buffer to the upper end so customers understand possible booking movement. These estimates can move up or down at actual booking.
- Countries without a direct seaport use a gateway/transit plan, for example Mombasa, Dar es Salaam, Maputo, Durban, Beira, or Kolkata/Haldia depending on country. Customer pricing must explain that ocean freight to the gateway port is separate from inland transit, border, clearing, and local delivery unless NK later confirms an all-in route.
- Countries with strict import/compliance rules can be listed for planning but must show import eligibility as requiring NK/local-agent confirmation before final quotation.
- Destinations without a route-specific public benchmark may still show a planning estimate by inheriting the nearest approved benchmark group, such as Mombasa/East Africa gateway, Dar es Salaam/East Africa gateway, Southern Africa gateway, Asia RHD markets, Pacific/Indian Ocean RHD markets, or long-haul RHD markets. The UI must label the benchmark group so customers understand it is not a live forwarder quote.
- Main export/ocean freight remains Pending for final quotation readiness until NK confirms the current route price from an Owner-approved freight rate table, provider quote, or API. Customer pricing may still display the selected route's per-car planning range directly on the Export / Shipping line with an estimate label.
- Customer-facing shipping estimates are per-car: 1 car uses the full shipping estimate, 2 cars divide the shipping estimate by 2, and 3 cars divide the shipping estimate by 3.
- The pricing line uses the midpoint of the per-car planning range as the primary "about" estimate, while the low/high planning range stays visible in the shipping details.
- The footer may show an estimated total with selected shipping by adding the per-car midpoint estimate to the known subtotal. This is still not final quotation readiness; other pending cost lines remain excluded.
- If the customer selects 3 cars in one shipment, the customer-facing Export / Shipping per-car estimate also includes the approved THB 25,000 Rushing/loading/stuffing service charge divided by 3 and explains the approximate per-car share using the customer FX rate. At the current preview FX of THB 35.00 = USD 1, this displays as about USD 714 total or about USD 238 per car when shared by 3 cars. The customer UI labels the 3-car option as best value and shows the shared-freight explanation immediately beside the quantity selector so the lower per-car estimate is not presented without context.
- The customer pricing UI shows quote-size choices for 1, 2, and 3 cars, including each option's estimated per-car shipping amount. Selecting a choice updates the shipment quantity and the estimated total, but it does not issue a final quotation automatically.
- The customer pricing UI includes a fill-the-shipment prompt and visible shipment slots. The customer can see the Vehicle Cases currently counted toward the selected 1/2/3-car shipment target, see open slots, open existing cases, and use Browse, Paste Link, or Ask NK AI to add another vehicle. The planner can show the current planned set total for the cases already in the plan, but it remains a planning guide only; a real grouped shipment/quote still requires NK verification before final quotation.
- The customer selection records only the shipping plan. It does not book shipping, send a message, confirm freight, accept payment, or purchase a vehicle.

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
- QNAP full stack commit `f31c030f6d7a0946af033f9005412c6671e84238` is now deployed and includes the Owner-approved Phetchaburi pilot sourcing location. The pilot rule exists in QNAP as `7412f2fb-fe79-4469-b36b-96d3c55daa3a`.
- The installed Hermes container is running, but its current free inference provider has returned rate-limit errors and its browser profile/connector runtime is not connected. The application must continue to report `not_configured` or the real safe error state; it must not claim that automated sourcing ran.
- Phetchaburi is approved as a narrow Hermes pilot sourcing location. Bangkok Metro remains the default customer Browse and Owner sourcing scope. The pilot remains `NEEDS_REVIEW` only and does not authorize publication, seller messaging, reservation, purchase, or payment.
- The Owner sourcing menu now includes safe Hermes browser-profile controls for multiple Facebook profiles when a server-side local connector admin URL/token is configured. It can add profile IDs/labels, check state, pause a profile, and open a visible Facebook login browser window. It must never collect Facebook passwords, OTPs, cookies, or tokens in NK forms.
- QNAP Hermes pilot operations now include a local, non-secret PowerShell runbook script at `scripts/run-hermes-qnap-pilot.ps1`. It prompts the Owner for QNAP SSH credentials, creates a PostgreSQL backup before running, opens a private loopback tunnel to the QNAP Data API container, starts the local connector with a temporary token, runs one worker command, writes a sanitized result to the Windows temp directory, and tears down the connector/tunnel. It does not issue publish, seller message, reservation, purchase, or payment commands.
- Latest QNAP Hermes pilot check on 2026-08-28 reached QNAP Data API and the authorized Facebook browser profile successfully, with backup `/share/CACHEDEV6_DATA/nk-cars/backups/postgres/nk-cars-before-hermes-profile-pilot-20260828T100000Z.dump`. The worker completed command `41a8edb0-b823-4a0a-b34f-0ad0c326e1c9` but retained `0` vehicles, so there is still no candidate vehicle ID and the "one Toyota Revo 2022 Phetchaburi vehicle in NEEDS_REVIEW" proof remains incomplete.
- A direct Facebook URL helper now exists at `scripts/run-hermes-qnap-url-pilot.ps1` for Owner-supplied listing links. It still requires the candidate to pass the active QNAP sourcing rule before retention. A 2026-08-28 direct URL attempt opened the supplied listing and found 18 image URLs, but QNAP correctly refused retention because the normalized facts were year `2024` and location was not confirmed as Phetchaburi.
- Owner changed the live QNAP Hermes pilot rule on 2026-08-28 to `Toyota Revo 2020+ - Bangkok Metro pilot`: Toyota Revo, pickup, year 2020 through 2026, dailyLimit `1`, and locations Bangkok, Nonthaburi, Pathum Thani, Samut Prakan, Samut Sakhon, and Nakhon Pathom. QNAP rule `7412f2fb-fe79-4469-b36b-96d3c55daa3a` was updated from revision 1 to revision 2 after backup `/share/CACHEDEV6_DATA/nk-cars/backups/postgres/nk-cars-before-hermes-rule-update-20260828T102957Z.dump`.

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

Owner visual review route: `/preview/marketplace-style` is an isolated, noindex visual preview for a lighter Marketplace-style mobile Browse/Detail direction. It does not mutate workspace data and does not activate real messaging, payment, QNAP, Hermes, or production sourcing behavior.

Shipment quote planner visual review route: `/preview/shipment-quote-planner` is an isolated, noindex static preview for the 1/2/3-car quote choice, fill-the-container prompt, and estimated per-car/total summary direction. The Owner approved this direction for the active customer pricing UI on 2026-08-28. The preview route itself still does not mutate workspace data, issue quotations, book shipping, accept payment, or activate production shipment grouping.

Customer mobile visual direction: the active `/buy` customer screens now use an Owner-approved Facebook Marketplace-inspired mobile Browse layout on small phones: white feed background, dense two-column image grid, square photos, minimal/no heavy card frame, price-first typography, simple listing title/location text, and lighter search/filter chips. The earlier readability pass remains for non-feed customer surfaces: Vehicle Detail keeps the shorter mobile source-price copy, top-level Check Availability / Ask NK AI / Request Inspection actions, no bottom-navigation overlap, and larger specification/summary text. My Cases, Account, chat, pricing, quotation, and PI customer surfaces keep larger mobile text and touch targets. The underlying Vehicle Case, pricing, inspection, localization, source adapter, and safety boundaries remain unchanged.

Pricing update: Vehicle Case now applies the approved inspection/travel rule of THB 5,000 across the active Bangkok Metro operating group and configured outside-Bangkok-Metro distance x THB 20/km with the same THB 5,000 minimum. Customer pricing also includes a destination country/port and 1-3 car shipping planner. The shipping planner can show public-source indicative ocean-freight ranges plus a 15% upper-bound planning buffer. The customer-facing Export / Shipping line displays the midpoint per-car estimate as "about" while details retain the low/high range: 1 car uses the full route estimate, 2 cars divide by 2, and 3 cars divide by 3 plus the THB 25,000 Rushing/loading/stuffing charge divided by 3. The UI explains that 3 cars is the best value because freight and Rushing/loading are shared. The fill-the-shipment area now shows concrete shipment slots with existing Vehicle Cases and open add-car slots so the customer can understand how to complete a three-car plan. The footer can show an estimated total with selected shipping, but final quotation readiness remains Pending until Owner-confirmed freight pricing is recorded.

HiSpeed preview checkpoint:
- `/hispeed`, `/hispeed/vehicles/[id]`, `/hispeed/saved`, `/hispeed/shipments`, `/hispeed/cases`, `/hispeed/cases/[caseId]`, `/hispeed/cases/[caseId]/pi`, and `/hispeed/account` now provide an additive second-brand storefront.
- `taishuaiauto.com` and `www.taishuaiauto.com` are routed as HiSpeed host aliases: `/` rewrites to `/hispeed`, short HiSpeed paths such as `/vehicles/[id]`, `/saved`, `/shipments`, `/cases`, and `/account` rewrite into `/hispeed/...`, and `/buy` redirects to `/hispeed` on the HiSpeed host.
- HiSpeed defaults to Simplified Chinese, with English and Thai language switching, and uses a distinct red/white China-friendly marketplace UI.
- HiSpeed reuses the same customer-safe inventory adapter, Vehicle Case, inspection, deterministic pricing, shipping planner, quotation, PI, and workspace contracts. `/buy` remains unchanged.
- Application DTOs now support `visibleOnNk` and `visibleOnHispeed`, mapping to future QNAP `visible_on_nk` and `visible_on_hispeed`. Missing values default to visible on both brands for backward compatibility.
- HiSpeed-created customer Cases are tagged with channel `hispeed` for reporting while preserving the same underlying vehicle listing identity.
- No QNAP infrastructure, Hermes runtime, production DNS, seller messaging, purchase, payment, or destructive PostgreSQL schema/data change was made.

HiSpeed commercial/payment preview checkpoint:
- HiSpeed now has two preview-only purchase plan presentations: Standard Plan and HiSpeed Flex Plan.
- Standard calculates customer vehicle selling price from the same source/purchase cost plus a 10% HiSpeed sourcing/service margin, then displays a 30% deposit, 50% top-up before container closing so paid total reaches 80%, and 20% final payment at container closing.
- Flex calculates customer vehicle selling price from the same source/purchase cost plus a 20% HiSpeed sourcing/service margin, then displays 50% initial, 20% before shipment, and 30% destination/gateway milestone schedule.
- HiSpeed customer UI shows the selling price and service-included disclosure; it does not expose source cost or frame the comparison as profit percentages.
- HiSpeed quote snapshot preview records the selected payment plan, vehicle selling price, inspection/travel, shipping estimate, other approved costs, payment schedule, FX snapshot, and three-day validity presentation.
- HiSpeed money presentation now follows the selected language: English uses USD, Simplified Chinese uses CNY, and Thai uses THB. The underlying source/purchase cost and deterministic calculations remain THB-based and shared; only HiSpeed presentation changes.
- HiSpeed now includes a preview Payment Request presentation that groups each selected vehicle's plan schedule by collection milestone: secure vehicle, before container closing, container closing, before shipment for Flex, and destination/gateway milestone for Flex. It shows customer-facing request totals and per-vehicle line amounts in the selected presentation currency.
- Payment Request preview is bank-transfer only to the configured HiSpeed company account. Real company bank details are not displayed until Owner/Finance configures approved payment instructions. Uploading proof or a SWIFT reference does not confirm payment automatically; Finance must verify actual received funds.
- HiSpeed Inspection Wallet / Inspection Credit is UX-prepared only. New customers must pay inspection/travel before dispatch; regular customers may use wallet balance; approved dealers/VIP credit terms require separate approval. No credit is automatically granted.
- Flex statuses are represented as `FLEX_NOT_REQUESTED`, `FLEX_REQUESTED`, `FLEX_UNDER_REVIEW`, `FLEX_APPROVED`, and `FLEX_DECLINED`. Flex approval, real payment movement, customer financing, seller payment, purchase, vehicle release, and document release remain disabled until Owner policy and authorized controls are implemented.
- NK Cars `/buy` pricing remains unchanged.

Identity/workspace activation checkpoint:
- The application now supports a provider-neutral QNAP identity gateway without collecting passwords in NK forms.
- The identity gateway contract now supports allowlisted Google and Apple provider selection. The Account UI renders provider-specific actions only when the corresponding gateway providers are explicitly enabled.
- Vercel defaults to identity disabled until the QNAP gateway is explicitly configured; raw ChatGPT identity headers are not trusted there.
- A strict QNAP workspace adapter covers customer workspace reads/writes, Owner queue/verification, quotation acceptance/issue, and PI issue while preserving ownership, revision, deterministic commercial controls, and append-only audit contracts.
- ChatGPT Site + D1 remain the rollback adapter. Production account activation still waits for QNAP infrastructure to implement the documented endpoints and for Owner-controlled runtime secrets/URLs to be configured.
