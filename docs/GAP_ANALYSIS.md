# NK Cars Gap Analysis

Status: Buying Browser includes a private Google Sheets + Drive staging contract with twenty vehicles: ten Owner-reviewed vehicles and 64 approved media items plus ten Needs Review vehicles and 137 private evidence items. The server adapter, customer-safe media proxy, repository fallback, swipe galleries, deterministic split NK fees, English/Simplified Chinese/Thai presentation, fail-closed Owner route, and private raw-evidence build boundary are implemented; runtime Google credentials, durable identity/cases, production translation, and mobile native runtime validation remain.
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
- The 167 raw source-evidence images are preserved under repository-private evidence storage and are excluded from the public Site build. Google Drive remains the private operational copy; authenticated private object storage, retention, backup, and restore policy remain future production work.
- ChatGPT customer identity and D1-backed account-isolated Buying Browser workspaces are connected for saved vehicles, Vehicle Cases, and conversation history. Organization membership, normalized operational tables, private blob storage, backup/restore, and broader role-based authorization remain incomplete.
- Web iframe embedding remains blocked by Facebook's `X-Frame-Options: DENY`. Native top-level browser adapters are now the approved experiment; runtime support must be reported per platform and external Share/Copy Link retained wherever blocked.
- A remote customer-specific source session, if later activated, requires an approved encrypted session-storage design and manual user authentication.
- Facebook/other source UI and access can change; live browser access cannot be a CI dependency.
- No production connector URL/token, AI model/key, durable worker, monitoring, or alerting configuration is approved.
- The persisted Sites project ID points to the existing live NK Cars Site. The Owner approved deploying each completed, tested milestone to this existing Site; deployment approval does not authorize real messages, payments, destructive data actions, or unrelated production configuration.
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

## Durable Customer Workspace Update - 2026-08-26

### Implemented

- Signed-in customers now use the stable ChatGPT Site account ID rather than email-derived identity.
- Added D1-backed account workspaces for saved vehicles, imported customer-safe listings, Vehicle Cases, case timelines, and conversations.
- Added optimistic Revision checks, deterministic conflict merging, account ownership enforcement on every Case, bounded payload validation, and rejection of internal seller/source fields in customer listing snapshots.
- Added append-only workspace sync events containing non-sensitive record counts for audit and recovery diagnosis.
- Anonymous Browse remains available and device-local; the Account screen clearly offers Sign in before business-critical Case use.
- Preserved the current UI, source adapters, customer-safe DTO, pricing engine, inspection rules, and local fallback.

### Remaining V1 Gaps

- Owner publication decisions remain staging/code-backed rather than durable workflow records with Approve/Edit/Reject audit.
- Vehicle media uploaded by customers still requires private object storage; embedded local photo evidence is intentionally not copied into D1.
- Quotation readiness, PI issuance gating, automatic document numbering, authorized document visibility, and approval history are not implemented.
- Real availability confirmation, seller messaging, inspection assignment, payment, and purchase commitment remain disabled or approval-gated.
- D1 backup/export/restore policy and operational monitoring remain required before treating this as the only business record store.

### V1-V5 Impact

- **V1:** durable customer Case identity and account isolation are implemented. Durable Owner review, quote readiness, private media, source freshness, and live operations remain.
- **V2-V5:** no scope or business-rule change.

### Smallest Next V1 Milestone

`BB-V1D-02 - Quotation Readiness`: add a deterministic Case readiness checklist and customer-safe quotation draft only after current vehicle price and availability are verified. Block PI issuance while material amounts or required approvals are unresolved; do not enable payment.

## Quotation Readiness Update - 2026-08-26

### Implemented

- Added a deterministic readiness engine that requires verified availability, actual vehicle purchase price, inspection/travel, domestic transport, repair/modification, export/shipping, and other agreed charges.
- Null amounts remain Pending; an explicit zero is required to confirm that a cost line does not apply.
- Added English, Simplified Chinese, and Thai customer presentation for every readiness check.
- Added an idempotent Request Quotation Review action that records customer/system messages and Case timeline history without sending an external message or issuing a document.
- PI remains deterministically blocked even when all pricing facts are ready. It may only follow an approved final quotation accepted by the customer.
- Added explicit Finance language: PI, invoice, receipt, or payment slip does not confirm payment; authorized Finance must confirm actual funds received.

### Remaining V1 Gaps

- Owner/staff cannot yet update availability, actual purchase price, or material cost confirmations through an authenticated operational Case screen.
- No quotation number, approved quotation document, acceptance record, PI number, PI document, document visibility classification, or expiry workflow is issued.
- No payment workflow is enabled.

### Smallest Next V1 Milestone

`BB-V1D-03 - Owner Case Verification Queue`: add Owner-only Case lookup and controlled updates for availability, actual purchase price, and material cost lines with audit evidence. Keep quotation issue and payment disabled until those facts are reviewed.

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

## Authorized Ten-Vehicle Sourcing Test - 2026-08-26

### Implemented

- Used the authenticated Owner-controlled browser session to search real Facebook Marketplace listings at low volume for Toyota Hilux Revo pickups, model year 2020+, in Bangkok and the metropolitan area.
- Deduplicated the selected results against the existing ten source listing IDs and rejected an implausible-price candidate.
- Added ten new vehicle rows as `Needs Review + INTERNAL_ONLY`; no customer publication state changed.
- Stored all 137 accessible listing photos in private per-vehicle Drive `evidence/` folders and added 137 matching `Media` rows as `Needs Review + INTERNAL_ONLY`.
- Preserved explicit conflicts instead of normalizing them away, including transmission/color conflict on vehicle 14 and model-year/registration conflict on vehicle 20.
- Updated the Google parser so authenticated Owner review receives staged internal rows even when they are not customer-published. The public listing DTO still requires an approved vehicle and approved customer-visible media.

### Remaining V1 Gaps

- The ten new records require Owner evidence review, customer-safe photo selection/redaction, and explicit publication approval before they can enter Browse.
- The runtime service-account credential is still not configured, so the deployed app continues to serve the verified repository fallback.
- Search/capture remains an authorized operator-assisted workflow; unattended scheduling, session health, retries, and source-policy controls are not implemented.

### V1-V5 Impact

- **V1:** private capture-to-review staging is proven for a second batch; review decisions, live runtime activation, durable cases, and compliant scheduled sourcing remain.
- **V2-V5:** no scope or business-rule change.

## Customer Cover Ordering Update - 2026-08-26

### Implemented

- Defined `Media.sort_order = 1` as the reviewed customer cover used by Browse and Vehicle Detail.
- Added customer-safe derivatives of the real source covers for approved vehicles 02, 04, 07, and 09, where the previous first approved image showed an interior or pickup bed.
- Redacted registration/source-identifying regions deterministically while preserving the original source images as internal evidence.
- Synchronized the four covers to private Drive, shifted each existing approved gallery to positions 2-7, and updated the Registry to 64 approved customer media plus 137 private Needs Review media.
- Added parser enforcement so approved media without a unique position-1 cover fails closed to the verified repository fallback.

### Remaining V1 Gaps

- The second ten-vehicle batch still requires Owner evidence review, cover/gallery selection, redaction, and explicit vehicle/media approval before customer publication.
- Automated redaction-region detection is not implemented; current approved cover derivatives use reviewed per-image regions.
- Runtime activation, durable Vehicle Cases, compliant scheduled capture, source freshness, and seller communication controls remain unchanged blockers.

### V1-V5 Impact

- **V1:** cover selection and ordering are now deterministic for the first approved batch; review-to-publish automation for later batches remains.
- **V2-V5:** no scope or business-rule change.

## Owner Case Verification Queue Update - 2026-08-26

### Implemented

- Owner-only lookup across durable customer workspaces, enforced by the server-side account allowlist.
- Deterministic verification updates for availability, actual purchase price, and every material cost line used by quotation readiness.
- Required evidence notes, optimistic Revision protection, and append-only old/new value audit events.
- Atomic customer Case, timeline, workspace Revision, workspace event, and Owner audit updates.
- Responsive operational UI that preserves the approved customer Marketplace and Vehicle Case presentation.
- Continued hard block on quotation issue, PI, payment, purchase, and real external messages.

### Remaining V1 Gaps

- **Quotation:** no approved quotation record, number, immutable pricing snapshot, customer-visible document, validity window, acceptance/rejection record, or material-change invalidation yet.
- **PI:** no gated PI number/document or three-day expiry/recheck workflow; PI must remain after quotation acceptance.
- **Operational availability:** Owner can record verified facts, but no approved seller channel, send authorization, reply ingestion, freshness expiry, or evidence attachment storage exists.
- **Inspection operations:** deterministic preview rates exist, but provider assignment, appointment, checklist/evidence, and real booking remain unconnected.
- **Source staging:** live Google credential activation and second-batch review/publication remain incomplete.
- **Storage/recovery:** private object storage and production backup/restore policy remain incomplete.

### V1-V5 Impact

- **V1:** durable Owner verification and audit are implemented. Quotation approval/acceptance, PI gating, source freshness, inspection operations, staging activation, and private media remain.
- **V2:** dealer/source network, trust scoring, matching, and controlled source automation remain unchanged.
- **V3:** payment confirmation, purchase approval, deposits/refunds, procurement finance, and Purchase Fund remain future scope and disabled.
- **V4:** secured vehicle, inspection execution, repair, export/shipping, delivery, and after-sales remain future scope.
- **V5:** expanded immutable audit, 360 views, task/KPI engine, risk detection, reporting, forecast, and command center remain future scope.

### Smallest Next V1 Milestone

`BB-V1D-04 - Owner-Approved Quotation Record`: snapshot only verified Case pricing, require Owner approval to issue a uniquely numbered customer-visible quotation with a validity deadline, record customer acceptance, invalidate approval on material changes, and keep PI/payment disabled until acceptance.

## Server-Authoritative Commercial Boundary Update - 2026-08-26

- Customer workspace sync can no longer create or overwrite Owner verification, actual purchase price, NK rates, or material cost confirmations.
- Verified Owner history is preserved across later customer/device syncs.
- This closes the commercial-integrity prerequisite for quotation records; no V2-V5 scope changed.
- Remaining next gap is the approved quotation snapshot/number/validity/acceptance workflow itself.

## Owner-Approved Quotation Update - 2026-08-26

### Implemented

- Owner-only issue from a customer-requested, fully verified Vehicle Case.
- Atomic `QT-YYYY-######` document numbering and customer-visible snapshots of all deterministic pricing lines and the recorded FX rate.
- Three-day validity, signed-in customer acceptance, idempotent updates, append-only audit history, and optimistic Revision protection.
- Automatic quotation supersession when Owner-verified material facts change.
- Server authority prevents customer workspace payloads from creating or changing quotation records.

### Remaining V1 Gaps

- **PI:** no Owner-issued `PI-YYYY-######` record/document, independent three-day validity, expiry/recheck workflow, or downloadable customer document yet.
- **Payment:** no Finance-only actual-funds confirmation, payment evidence, ledger, or balance tracking. These remain disabled.
- **Availability operations:** no approved seller channel, reply ingestion, verification freshness expiry, or evidence attachment storage.
- **Inspection operations:** no provider assignment, appointment, checklist/evidence, or real booking integration.
- **Source staging:** live Google credential activation and review/publication of the second ten-vehicle batch remain incomplete.
- **Storage/recovery:** private object storage, retention, production backup, and restore policy remain incomplete.

### V1-V5 Impact

- **V1:** quotation issue and acceptance are complete. PI, Finance confirmation boundary, operational availability/inspection, staging activation, and private evidence storage remain.
- **V2:** dealer network, trust scoring, and intelligent sourcing remain unchanged.
- **V3:** payment, purchase approval, deposits/refunds, procurement finance, and Purchase Fund remain disabled future scope.
- **V4:** secured vehicle through after-sales remains future scope.
- **V5:** expanded audit, 360 views, risk, reporting, and command center remain future scope.

### Smallest Next V1 Milestone

`BB-V1D-05 - Gated Proforma Invoice`: issue a uniquely numbered customer-visible PI only from an accepted current quotation, preserve the exact commercial snapshot and FX, enforce three-day validity/recheck, and keep payment confirmation Finance-only and disabled.

## Gated PI Update - 2026-08-27

### Implemented

- Owner-only `PI-YYYY-######` issuance from an accepted current quotation.
- Immutable customer-visible pricing/FX snapshot, quotation reference, independent three-day validity, print/save-PDF presentation, and multilingual customer labels.
- Expired PI reissue is blocked until Owner rechecks the Case and a new quotation is accepted.
- Server authority, optimistic Revision protection, atomic workspace/event/audit updates, and customer-write protection.
- Explicit `Not confirmed` payment state with no bank data, receipt, seller transfer, or purchase action.

### Remaining V1 Gaps And Classification

- **Owner Blocker - legal/commercial document setup:** approved legal issuer identity, address/tax details, and authorized payment instructions are required before the PI can be used as a real payment instruction.
- **Owner/Finance Blocker - payment control:** authorized Finance roles, evidence requirements, and actual-funds confirmation policy are required. Payment remains future V3 scope unless Owner explicitly promotes a controlled subset into V1.
- **External Integration Blocker - Google staging:** `GOOGLE_SERVICE_ACCOUNT_JSON` and Drive Viewer access are missing; repository snapshot fallback remains active.
- **External Integration Blocker - availability:** no approved seller messaging channel, send authorization, or reply ingestion.
- **External Integration Blocker - inspection:** no approved provider/rate/appointment integration; only deterministic estimates and requests exist.
- **Infrastructure Blocker - private evidence/recovery:** no approved R2/QNAP production storage, retention, backup, and restore setup.
- **Owner Review Blocker - staged inventory:** the second ten-vehicle batch remains internal until Owner evidence review/redaction/publication approval.

### V1-V5 Status

- **V1:** Browse, localization, customer-safe DTOs, Vehicle Cases, durable account workspace, requests/history, deterministic 6% + 4% pricing, Owner verification, quotation/acceptance, and gated PI are implemented. Remaining V1 work depends on the blockers above.
- **V2:** dealer portal/network, reverse marketplace, trust scores, and controlled sourcing automation remain future scope.
- **V3:** Finance confirmation, payment ledger, purchase approval, deposits/refunds, and Purchase Fund remain disabled future scope.
- **V4:** secured vehicle, inspection execution, repair, export/shipping, delivery, and after-sales remain future scope.
- **V5:** full 360 views, task/KPI engine, fraud/risk, expanded immutable audit, reporting, forecast, and command center remain future scope.

### Next Smallest Safe Milestone

`BB-V1D-06 - Authorized Issuer And Finance Setup` is blocked pending Owner-approved legal issuer details and Finance/payment policy. No further commercial activation should be coded with invented data.
