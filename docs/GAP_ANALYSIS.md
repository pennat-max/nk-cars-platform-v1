# NK Cars Gap Analysis

Status: Buying Browser includes a private Google Sheets + Drive staging contract for ten Owner-reviewed vehicles and sixty approved media items, a server-side sync adapter with customer-safe media proxy, repository fallback, swipe galleries, deterministic split NK fees, and English/Simplified Chinese/Thai presentation; runtime Google credentials, durable identity/cases, production translation, and mobile native runtime validation remain
Date: 2026-08-26
Branch: `codex/buying-browser-rebuild`

## Source Of Truth

Conflict priority for current V1 work:

1. Explicit current Owner instruction, including the approved iOS WKWebView + Android WebView + Windows WebView2 direction.
2. `docs/PRODUCT_PIVOT_BUYING_BROWSER.md` for the customer-facing V1 Buying Browser.
3. `docs/PRODUCT_DIRECTION_LIVE_BROKER.md` for authorized live sourcing, adapters, profiles, queueing, and candidate controls.
4. `docs/MASTER_SPECIFICATION.md` for non-conflicting rules and downstream V2-V5 operations.
5. Existing acceptance, architecture, handoff, and implementation documents.

The pivot changes V1 from a stock-first dealership experience to an AI-assisted vehicle buying browser. Existing inventory/review/lead and downstream operational modules remain rollback/reference and future building blocks; they are not deleted.

## Approved V1 Journey

Open real Facebook Marketplace inside the NK native browser adapter where permitted -> customer authenticates directly with Facebook -> browse/select a real listing -> use the compact native NK action bar -> capture only the explicitly selected listing URL and atomically create a customer-safe Vehicle Case -> translate/normalize facts -> request current availability/price -> show deterministic service pricing -> request inspection -> retain case conversation/history -> continue toward a controlled Buy Through NK workflow.

External Share to NK Cars and Copy Link remain platform fallbacks. The earlier iframe `X-Frame-Options` failure does not apply to a top-level native WebView navigation, but no native adapter may bypass a Facebook login, checkpoint, MFA, CAPTCHA, or access control.

## Cross-Platform POC Status

| Target | Adapter | Build/runtime evidence | Remaining gap |
| --- | --- | --- | --- |
| Windows | Microsoft WebView2 | Release build passes. A real Marketplace item loaded successfully and its current URL was recognized/capturable in a persistent local profile. | Human Facebook login, search/filter interaction, restart session check, and explicit Save-to-case UI evidence still require a customer-operated session. |
| Android | Android WebView | Source adapter, isolated profile, native toolbar, explicit capture, ACTION_SEND share fallback, and external-open fallback are implemented and covered by shared contract tests. | APK build requires acceptance/installation of Android SDK 35; emulator/physical-device Facebook behavior and session persistence are untested. |
| iOS | WKWebView | XcodeGen source, persistent app-sandbox data store, native toolbar, explicit capture, external-open fallback, and policy tests are implemented. | A Mac with Xcode, signing team, simulator/device, and human Facebook session is required; no iOS runtime claim is made from Windows. |

The smallest next V1 milestone is **BB-NATIVE-2 - Device Validation And Signed Fallbacks**: build Android after SDK license acceptance, run the real listing plus restart/session test on Android, build/run iOS with Xcode and a signed Share Extension fallback, and validate explicit Save creates a durable/authenticated Vehicle Case. This precedes production identity activation and does not deploy or overwrite the live Site.

### Web Browser Companion

The additive `/buy/browser` route is complete as the closest zero-install web fallback. It provides browser chrome, Facebook launch, clipboard/manual listing capture, and the NK action bar on mobile and desktop. Facebook remains in its own real tab/app because cross-origin browser controls and Facebook framing policy prevent a normal web application from embedding or reading the customer's Facebook page/session. A true same-window Facebook experience still requires the native adapters or an approved remote-browser service.

The existing NK demo Browse grid, Ask NK AI, direct link paste, and photo/text fallback remain secondary paths in that order. Copy/paste is last resort. Demo cards are not evidence of real Marketplace access.

Important states must remain factual: `Live Market Result`, `Found in Thailand`, `Availability Not Yet Confirmed`, `Verified Available`, and `NK Secured` are not interchangeable.

## Current Implementation

Reusable and working:

- Existing responsive Next.js/Vinext shell, route-level stock/review/lead/wanted demo flows, extraction, photo review, and customer redaction.
- Hybrid link import: public metadata first, optional connector, then screenshot/photo/text fallback.
- Customer-safe structured vehicle facts based only on available evidence, rendered in English, Simplified Chinese, or Thai without duplicating business records.
- Local Playwright connector foundation with a versioned source-adapter contract, dedicated persistent browser profiles, manual login, safe login/checkpoint stop states, concurrency-one FIFO queue, limits/timeouts/cancellation, and deterministic browser fixtures.
- Existing `MARKETPLACE_CONNECTOR_URL` server boundary and safe provider-error handling.
- Rollback/reference commit `61d4bc8` on `codex/production-rebuild`.

Buying Browser V1 preview completed on 2026-08-24:

- Additive customer routes and account shell under `/buy`; the existing root remains unchanged.
- Browse, Saved, detail, search, sort, Thai location, year, price, mileage, transmission, drive, and body filtering.
- Customer-safe normalized English facts, ten Owner-reviewed real listing snapshots as the default Browse data, and source/customer DTO separation. Legacy one-car and demo data remain rollback/reference only.
- Paste Link through the existing import boundary plus open-source, up-to-30-photo, listing-text, and manual-review fallback.
- Deduplicated Vehicle Cases, availability requests, case timeline, My Cases, messages/history, grounded NK AI preview responses, deterministic pricing, and deterministic inspection/travel requests.
- Separate Owner/internal demo view and customer redaction tests.
- Manual browser verification at 390 x 844 and 1280 x 900 with no horizontal overflow or console errors.
- Corrected customer Browse UX to a compact marketplace-first mobile layout with vehicle results in the first viewport; Paste Link and Ask NK AI are secondary tools instead of a dominant feature panel.
- Corrected customer vehicle detail to be photo-first with six reviewed images per vehicle and touch-swipe/scroll-snap navigation, followed by normalized specifications/description and the five approved NK actions, without changing internal visibility boundaries.
- Scoped the default customer Browse view to Bangkok Metro (Bangkok plus five surrounding provinces) while preserving nearby-province and All Thailand filters. This is an operating-cost focus, not a deletion of out-of-area records.
- Simplified primary customer navigation to Browse, Saved, My Cases, Messages, and Account. Inspection remains a Vehicle Case workflow and is linked from My Cases.
- Clarified the vehicle action hierarchy: photo-level Save, Check Availability as the recommended first step, Ask NK AI beside it, then Inspection and Buy Through NK as continued case actions.
- Changed customer Browse, filters, Vehicle Cases, inspection pricing, and grounded price replies to USD using one deterministic preview FX rate of THB 35.00 per USD. Internal source records and deterministic calculations remain in THB; an approved quote must set the final stored USD/FX values.
- Split the NK fee into configurable 6% Platform & Transaction and 4% Buying Service components applied only to vehicle purchase price. Customer pricing shows monetary amounts and service inclusions without percentages; pass-through costs are never marked up by these formulas.
- Added English, Simplified Chinese, and Thai rendering from one authoritative structured vehicle/pricing record, plus preserved source-text metadata and prepared-not-sent buyer-to-Thai-seller translation traces.

One-car data-pipeline snapshot completed on 2026-08-25:

- Added `NK-POC-2026-0001` as a non-demo `Captured` browse result and seeded customer-safe Vehicle Case `NK-CASE-2026-000001`.
- Added nine reviewed app images, including a plate-masked cover; retained all 18 originals and browser evidence in the private Owner Drive folder.
- Normalized English listing evidence without inventing missing values. Odometer photo evidence (24,623 km) conflicts with listing text (24,000 km) and remains explicitly marked `Need Review`; AT and 4WD have evidence references.
- Kept source URL, seller/source notes, private Sheet/Drive links, and original media count outside customer routes; automated rendered-HTML leakage checks cover these identifiers.
- Adapter mode is `snapshot`, not `live`. The Google Sheet is an auditable handoff artifact, not yet a durable source-of-truth integration.
- Verified Browse, detail, all nine customer-safe media items, seeded case, and availability-request transition at 390 x 844 with no horizontal page overflow, broken images, or clean-session console errors.

Real Facebook source proof of concept completed on 2026-08-24:

- Tested an actual Facebook share URL supplied from the Owner's Facebook session and resolved it to Marketplace item `1716607786274590`.
- Rejected embedded Facebook because the real response sets `X-Frame-Options: DENY`; the implementation does not bypass that control.
- Selected external Facebook app/browser plus Share or Copy Link as the first viable approach. Facebook retains the customer's password, MFA, CAPTCHA, cookies, and authenticated session.
- Imported the accessible real title/specification evidence, kept inaccessible source price, seller/contact, exact location, full gallery, and availability Pending, and created a real-listing Vehicle Case.
- Added internal `SourceCapture` records and case linkage while keeping submitted/canonical URLs out of customer-facing vehicle/case DTOs and views.
- Kept the existing remote isolated browser foundation as an unactivated contingency rather than claiming it is a working production integration.

Authenticated-browser feasibility spike completed on 2026-08-24:

- Confirmed the actual Facebook Marketplace and listing responses set `X-Frame-Options: DENY`; iframe/proxy bypass is rejected.
- Rejected NK-controlled WebView login because it does not safely reuse the customer's normal Facebook session and gives the host custody/access to credentials and cookies.
- Kept the remote isolated browser as an unproven contingency because no authorized customer session, compliant streaming runtime, encrypted session custody, or production approval exists.
- Implemented Success Option B for supported installed Chromium PWAs: OS Share -> Save to NK Cars -> `/buy/share` -> real import -> SourceCapture -> Vehicle Case -> case opens automatically.
- Verified current browser compatibility data: Web Share Target is unsupported in Safari/iOS. Best iPhone UX requires a signed native NK Cars Share Extension and durable authenticated case API; this is an Owner/external integration blocker, not a web-code defect.
- Moved the demo grid to `/buy/browse`; `/buy` is the real Facebook source launch and `/buy/paste` is explicitly last resort.
- Full evidence and test matrix: `docs/BUYING_BROWSER_FEASIBILITY_SPIKE.md`.

## V1 Production Activation Remaining

The approved Buying Browser V1 preview acceptance criteria are complete. The following are production gaps and external integrations, not simulated preview features:

### Identity, Persistence, And Operations

- Supabase Auth or an approved equivalent, individual customer accounts, organization membership, least-privilege RBAC, and tenant isolation.
- Durable Vehicle Case, saved-vehicle, conversation, timeline, pricing, inspection, and source-reference storage with RLS, idempotency, audit, backup, and restore.
- Private media storage, file visibility, signed access, retention, deletion, and evidence policy.
- Durable jobs, observability, retries, alerts, kill switches, production rate limits, and operational support controls.

### Live Sources And AI

- Replace the one-car static Google Sheet snapshot with an authenticated, auditable server-side ingestion/synchronization job; do not expose Drive or Sheet credentials/links to customer clients.
- Persist external Share/Copy Link captures and Vehicle Cases in authenticated tenant-scoped server storage; browser-local state is proof-of-concept only.
- Add a supported mobile share target only after browser/PWA/native compatibility testing; manual Share/Copy Link remains the proven baseline.
- Complete customer-specific source-profile isolation only if the remote-browser contingency is activated for real multi-user access.
- Source adapters beyond Facebook and a policy-compliant production connector network path.
- Live result normalization, ranking, freshness, duplicate matching, and operational snapshot policy.
- Production AI provider/model, evaluated English/Chinese/Thai free-text translation, seller-reply translation, cost policy, retention, and grounded-response evaluation.

### Commercial And Provider Activation

- Authenticated, versioned, audited Owner pricing settings for the approved 6% + 4% NK fee model, plus future minimum/fleet configuration and inspection/travel rate tables.
- Real inspection provider directory, service areas, assignment, acceptance, checklist/report, and customer-safe result delivery.
- Approved seller/provider communication channel with consent, retention, send authorization, delivery status, and audit.

## V2 Remaining Work

- Dealer Portal, verification, submissions, availability updates, dealer history, and sanitized Wanted reverse marketplace.
- Dealer offers, AI ranking/shortlisting, Owner-approved presentation, source reliability, and Seller/Dealer Trust Score.
- Controlled seller communications and sourcing automation within platform rules.
- Customer-specific authorized source sessions at production scale and additional compliant source adapters.

## V3 Remaining Work

- Final quote, negotiation approval/floor controls, PI, immutable FX rate, payment reporting versus Finance confirmation, and financial audit.
- Purchase approval, seller payment controls, reservation, multi-vehicle approval, Purchase Fund legal gate/ledger, Auto-Buy, seller deposits/refund recovery, and alerts.
- Customer Trust Score, referral accounting separated from Purchase Fund, and deterministic commercial rules.

## V4 Remaining Work

- Procurement assignment/routing, route optimization, one-trip procurement, pre-purchase check, payment/handover controls, and Vehicle Secured.
- Inspection checklist/evidence, repair/modification jobs, outsource approval, unexpected-issue stop controls, repair completion, and Ready for Export.
- Shipping jobs/providers, approved shipping expense, customer tracking, destination clearance, received/completed state, and after-sales cases.

## V5 Remaining Work

- Vehicle/Customer/Seller/Order 360, grounded AI summaries, event-driven task engine, employee assistant, deadlines/escalation, and KPI attribution.
- Owner AI Command Center, dashboard attention queue, daily/evening/weekly/monthly reporting, P&L, and 30-day forecast separated from actuals.
- Fraud/anomaly detection with evidence, immutable audit expansion, backup/version restore, media/document vault, document intelligence/generation/numbering, global and natural-language search, and notification platform.

## Technical Blockers

- The private Google staging data is populated, but the application runtime has no `GOOGLE_SERVICE_ACCOUNT_JSON`. Live sync requires an approved Google Cloud service account with Viewer access to the staging root and the JSON stored only in the hosting secret manager.
- The 167 raw source-evidence images still exist under repository `public/vehicle-evidence/`. They must move to authenticated private storage before production; no source copy should be deleted until the migration is verified.
- Real NK customer authentication, tenant isolation, database project/configuration, RLS, and durable Storage are not connected.
- Web iframe embedding remains blocked by Facebook's `X-Frame-Options: DENY`. Native top-level browser adapters are now the approved experiment; runtime support must be reported per platform and external Share/Copy Link retained wherever blocked.
- A remote customer-specific source session, if later activated, requires an approved encrypted session-storage design and manual user authentication.
- Facebook/other source UI and access can change; live browser access cannot be a CI dependency.
- No production connector URL/token, AI model/key, durable worker, monitoring, or alerting configuration is approved.
- The persisted Sites project ID points to the existing live NK Cars Site. A separate review Site is not configured in this working tree, so review deployment remains blocked by the no-overwrite/no-production rule; local-network preview remains available.
- Real inspection provider directory, service areas, availability, and Owner-approved rate table do not yet exist.
- Production commission/minimum-fee/fleet-tier configuration is not commercially or legally activated.
- Remote media retention/proxy rights and evidence-retention policy require confirmation before production copying.

## Legal And Integration Blockers

- Source access must comply with platform terms and use authorized sessions; no password collection, MFA/CAPTCHA bypass, stealth, or rate-limit evasion.
- Real seller/customer communication requires an approved channel, consent/retention policy, and Owner approval before first live sends.
- Purchase Fund remains blocked pending Thai legal, banking, and payment-regulatory review.
- Payment, seller deposit/refund, and shipping integrations require provider contracts, credentials, and deterministic controls.
- Marketing/media reuse requires explicit customer permission.

## Milestone Status And Next Step

- `BB-V1A - Additive Buying Browser Foundation`: Complete.
- `BB-V1B - Assisted Buying Workflow`: Complete.
- `BB-V1C - Internal View And Preview Hardening`: Complete.
- `BB-V1-POC - Real Facebook External Handoff`: Complete with a real Marketplace listing; external Share/Copy Link is the selected baseline.
- `BB-V1-POC2 - One-Car Sheet Snapshot In App`: Complete with one captured listing, reviewed customer media, explicit evidence conflict, and seeded Vehicle Case.

The smallest next V1 production milestone is **BB-V1D - Production Identity And Durable Cases**:

- connect the approved Auth/database project without changing the production root;
- add organization membership and customer identity;
- persist saved vehicles, Vehicle Cases, timeline, and conversations under tenant-scoped RLS;
- add material-action audit and private media/storage boundaries;
- retain the current source adapter, customer DTO, pricing, and inspection contracts.

BB-V1D is blocked on approved production project/configuration and must not deploy, replace the existing ChatGPT Site, enable real messages, or activate commercial pricing without the corresponding Owner approvals.

## Ten-Vehicle Capture Gap Update - 2026-08-25

### Implemented Evidence

- Ten real Toyota Hilux Revo Marketplace listings from model year 2020 were captured through the Owner's authenticated desktop Chrome session.
- Internal records now hold canonical source URL, seller/source facts, observed price and timestamp, normalized English specifications, confidence-by-review state, and 167 local gallery images.
- The Owner preview exposes complete raw evidence while the existing customer-safe DTO boundary prevents these ten unreviewed records from entering customer Browse, Vehicle Cases, or customer HTML.

### Remaining V1 Gaps

- **Customer media approval:** plate masking, source-clue redaction, image rights/retention policy, cover selection, and per-file visibility classification are not yet implemented for the batch.
- **Owner review state:** records need deterministic Approve, Edit, Reject, and publication-state persistence instead of static snapshot data.
- **Durable ingestion:** files and records are repository-local; database, private object storage, RLS, audit, retries, and deduplication are still required.
- **Automation:** the proof is human-initiated browser capture. Scheduled search, result freshness, duplicate detection, authorized session health, and failure recovery are not implemented.
- **Live operations:** availability checks and seller communications remain blocked from automatic execution and have not been sent.

### V1-V5 Classification Impact

- **V1:** review/approval state, customer-safe media processing, publish-to-Browse, durable cases, compliant desktop capture worker, search criteria, freshness, and operational fallback.
- **V2:** dealer/source network, seller trust, multi-source matching, and controlled seller automation.
- **V3:** quotes, payment, purchase approval, deposits/refunds, and other deterministic commercial controls remain unchanged.
- **V4:** procurement, inspection operations, repair, shipping, delivery, and after-sales remain unchanged.
- **V5:** 360 views, task/KPI engine, audit expansion, risk intelligence, reporting, and Owner command center remain unchanged.

### Smallest Next V1 Milestone

`BB-V1-POC3 - Review-To-Publish Ten Vehicles`: add persisted review decisions for the ten captures, produce plate/source-redacted customer media for Owner-approved vehicles, generate customer-safe listing DTOs, and verify Browse/detail/case flows without publishing or contacting sellers.

## Ten-Vehicle Marketplace Review Update - 2026-08-26

### Implemented

- Ten real capture snapshots now appear in the customer Marketplace through a dedicated customer-safe adapter; the eight demo cards and one-car POC are no longer the default Browse feed.
- Thirty visually reviewed images are available under NK-only public references. The selected set excludes visible registration plates and source-identifying URLs/names; all 167 raw files remain restricted to the authenticated Owner route.
- `/buy` is now the Marketplace-first customer entry. Search, location/year/price/spec filters, saved vehicles, detail gallery, Ask NK AI, availability, inspection, Buy Through NK, and Vehicle Case contracts remain intact.
- Automated tests now verify ten customer records, thirty reviewed assets, customer module separation, and rendered-route non-disclosure.

### Remaining V1 Gaps

- **Durable review/publish state:** the ten publication decisions are code-backed snapshots rather than database records with Approve/Edit/Reject history and audit.
- **Identity and persistence:** customer auth, tenant-scoped saved vehicles/Cases/messages, RLS, idempotency, and backups are not connected.
- **Private media:** raw source evidence still needs private object storage, signed access, visibility metadata, retention, and restore policy before production.
- **Freshness and operations:** source price, availability, duplicate state, seller response, and condition are unverified; no seller messages were sent.
- **Automated ingestion:** scheduled search/capture, session health, retries, compliant source policies, and additional source adapters remain external/integration work.

### V1-V5 Impact

- **V1:** customer Marketplace preview is complete for the reviewed batch. Remaining work is durable identity/cases, review audit, private media, freshness, compliant ingestion, and operational verification.
- **V2:** dealer portal, source network, offers, seller trust, and controlled sourcing automation remain unchanged.
- **V3:** quote/PI, negotiation approval, payment, Purchase Fund, deposits/refunds, and purchase approval remain unchanged.
- **V4:** procurement, secured-vehicle controls, inspection operations, repair, export/shipping, delivery, and after-sales remain unchanged.
- **V5:** 360 pages, task/KPI engine, risk detection, immutable audit expansion, reporting, forecast, and Owner command center remain unchanged.

### Smallest Next V1 Milestone

`BB-V1D-01 - Durable Review And Cases`: connect the approved development identity/database boundary and persist review decisions, saved vehicles, Vehicle Cases, timeline, and messages under tenant-scoped RLS. Keep the current Marketplace UI, deterministic pricing, inspection rules, customer-safe DTOs, and internal source records unchanged.

## Google Staging Sync Update - 2026-08-26

### Implemented

- The private `NK Cars Vehicle Staging Registry` now has header-mapped `Vehicles` and `Media` tabs containing ten approved vehicles and sixty approved customer-safe images.
- Google Drive has deterministic per-vehicle `photos/` and `evidence/` folders under one private staging root. Six reviewed customer images are stored per vehicle.
- A server-only Google service-account adapter reads approved rows on demand with a configurable five-minute cache. Authentication, schema, or network failures activate the verified repository snapshot instead of blanking Browse.
- Customer records expose only first-party NK media-proxy URLs. Source URL, seller identity/contact, exact location, internal notes, Google file IDs, and Drive URLs remain inside the Owner boundary.
- Sync state is available through a customer-safe status route and the Owner preview. The current runtime truthfully reports fallback mode until credentials are configured.

### Remaining V1 Gaps

- **Runtime activation:** provision the approved read-only Google service account, share the private staging root, and store its JSON only in the approved preview/runtime secret manager.
- **Private evidence migration:** move all raw source evidence out of public repository assets into private storage with visibility, retention, and audit metadata.
- **Durable Vehicle Cases:** case creation must snapshot customer-visible facts and media references so later Sheet edits cannot silently rewrite historical customer records.
- **Automated staging:** authorized capture, normalization, review-state writes, duplicate handling, retries, and source freshness remain operator-assisted.

### V1-V5 Impact

- **V1:** Google staging schema, approved-media storage, server adapter, safe proxy, sync status, and fallback are implemented. Credential activation, private evidence, durable cases, and authorized ingestion remain.
- **V2:** dealer/source network, trust scoring, offers, matching, and controlled seller automation remain unchanged.
- **V3:** quote/PI, payment, Purchase Fund, deposits/refunds, and purchase approvals remain unchanged.
- **V4:** procurement, secured-vehicle controls, inspection operations, repair, export/shipping, delivery, and after-sales remain unchanged.
- **V5:** 360 views, task/KPI engine, risk detection, immutable audit expansion, reporting, forecast, and Owner command center remain unchanged.

### Smallest Next V1 Milestone

`BB-V1-SYNC-02 - Activate And Verify Private Google Sync`: configure the read-only runtime credential in a non-production preview, verify all ten vehicles and sixty media records through the real server adapter, test fallback/error states, and retain the existing Site unchanged. After that, continue to durable tenant-scoped Vehicle Cases.
