# NK Cars Gap Analysis

Status: Owner-approved native cross-platform Buying Browser POC is implemented; Windows real-listing navigation is proven, mobile runtime validation remains
Date: 2026-08-25
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
- Customer-safe English vehicle descriptions based only on available evidence.
- Local Playwright connector foundation with a versioned source-adapter contract, dedicated persistent browser profiles, manual login, safe login/checkpoint stop states, concurrency-one FIFO queue, limits/timeouts/cancellation, and deterministic browser fixtures.
- Existing `MARKETPLACE_CONNECTOR_URL` server boundary and safe provider-error handling.
- Rollback/reference commit `61d4bc8` on `codex/production-rebuild`.

Buying Browser V1 preview completed on 2026-08-24:

- Additive customer routes and account shell under `/buy`; the existing root remains unchanged.
- Browse, Saved, detail, search, sort, Thai location, year, price, mileage, transmission, drive, and body filtering.
- Customer-safe normalized English facts, eight labeled realistic demo source results, and source/customer DTO separation.
- Paste Link through the existing import boundary plus open-source, up-to-30-photo, listing-text, and manual-review fallback.
- Deduplicated Vehicle Cases, availability requests, case timeline, My Cases, messages/history, grounded NK AI preview responses, deterministic pricing, and deterministic inspection/travel requests.
- Separate Owner/internal demo view and customer redaction tests.
- Manual browser verification at 390 x 844 and 1280 x 900 with no horizontal overflow or console errors.
- Corrected customer Browse UX to a compact marketplace-first mobile layout with vehicle results in the first viewport; Paste Link and Ask NK AI are secondary tools instead of a dominant feature panel.
- Corrected customer vehicle detail to be photo-first, followed by normalized specifications/description and the five approved NK actions, without changing domain logic or internal visibility boundaries.

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

- Persist external Share/Copy Link captures and Vehicle Cases in authenticated tenant-scoped server storage; browser-local state is proof-of-concept only.
- Add a supported mobile share target only after browser/PWA/native compatibility testing; manual Share/Copy Link remains the proven baseline.
- Complete customer-specific source-profile isolation only if the remote-browser contingency is activated for real multi-user access.
- Source adapters beyond Facebook and a policy-compliant production connector network path.
- Live result normalization, ranking, freshness, duplicate matching, and operational snapshot policy.
- Production AI provider/model, structured extraction/translation, cost policy, retention, and grounded-response evaluation.

### Commercial And Provider Activation

- Owner-approved production commission/minimum/fleet configuration and inspection/travel rate table.
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

- Real NK customer authentication, tenant isolation, database project/configuration, RLS, and durable Storage are not connected.
- Web iframe embedding remains blocked by Facebook's `X-Frame-Options: DENY`. Native top-level browser adapters are now the approved experiment; runtime support must be reported per platform and external Share/Copy Link retained wherever blocked.
- A remote customer-specific source session, if later activated, requires an approved encrypted session-storage design and manual user authentication.
- Facebook/other source UI and access can change; live browser access cannot be a CI dependency.
- No production connector URL/token, AI model/key, durable worker, monitoring, or alerting configuration is approved.
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

The smallest next V1 production milestone is **BB-V1D - Production Identity And Durable Cases**:

- connect the approved Auth/database project without changing the production root;
- add organization membership and customer identity;
- persist saved vehicles, Vehicle Cases, timeline, and conversations under tenant-scoped RLS;
- add material-action audit and private media/storage boundaries;
- retain the current source adapter, customer DTO, pricing, and inspection contracts.

BB-V1D is blocked on approved production project/configuration and must not deploy, replace the existing ChatGPT Site, enable real messages, or activate commercial pricing without the corresponding Owner approvals.
