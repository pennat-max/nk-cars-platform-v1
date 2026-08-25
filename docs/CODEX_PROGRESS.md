# Codex Progress

## 2026-08-25 - One-Car Google Sheet Snapshot In Buying Browser

Branch: `codex/buying-browser-rebuild`

### Completed

- Added the Owner-selected real Marketplace vehicle as the first non-demo `Captured` result in `/buy/browse` without changing the approved marketplace-first layout.
- Added customer-safe normalized English facts, a pre-created Vehicle Case (`NK-CASE-2026-000001`), 10% preview service-fee calculation, Bangkok inspection quote, Ask NK AI, availability, inspection, and Buy Through NK actions.
- Added nine customer-safe evidence images to the app. The cover registration is masked; the 18 original images and browser evidence remain in the private Owner Drive folder.
- Recorded the 24,623 km odometer evidence conflict against the 24,000 km listing text as `Need Review`; confirmed AT from photo 15 and 4WD from available listing/photo evidence without inventing unavailable facts.
- Kept Facebook source URL, Google Sheet, Drive evidence folder, seller/source notes, and original media count out of all customer routes. They appear only in the internal preview boundary.
- Changed the preview source adapter mode to `snapshot` so the UI does not claim a live source feed.
- Updated the private Google Sheet Customer View, Internal, and Audit Log records with the confirmed transmission evidence.

### Verification

- Full build and Node test suite: passed, 28/28.
- Typecheck: passed.
- Lint: passed with 0 errors and 13 existing legacy `<img>` warnings outside Buying Browser.
- Customer route leakage checks: passed for Facebook listing URL, Google Sheet ID, Drive folder ID, seller data, and demo internal data.
- iPhone viewport 390 x 844: Browse, captured vehicle detail, and Vehicle Case verified with no horizontal page overflow, no broken images, and no console warnings/errors in a clean session.
- Nine-image gallery: thumbnail selection verified through the odometer image; the gallery remains horizontally scrollable inside its own bounds without widening the page.
- Vehicle Case action: Check Availability verified and moved the case to `Availability Check Requested` without sending a real seller message.
- `git diff --check`: passed with line-ending notices only.

### Current Limitation / Next

- This milestone is a deliberate one-car snapshot, not automatic Google Sheet synchronization and not a live Marketplace feed. Adding more vehicles still requires an explicit authorized capture/import step.
- Durable authenticated Vehicle Cases, tenant-scoped database/media storage, and server-side Google Sheet/Drive synchronization remain Owner/integration blockers for production.
- Mobile verification is complete. Next: update only the separate Owner review Site. Do not overwrite the existing NK Cars Site or deploy production.

## 2026-08-25 - Windows WebView2 Manual Marketplace POC

Branch: `codex/buying-browser-rebuild`

### Completed

- Kept the Windows proof-of-concept deliberately small and separate from the NK website UI.
- Added WebView2 browser area, editable current-URL address bar, Back, Forward, Reload, Home, external-open fallback, and Save to NK.
- Retained a stable per-Windows-user WebView2 profile under local application data so Facebook cookies/session can survive close and reopen.
- Save to NK is enabled only on a real HTTPS Facebook Marketplace item URL and forwards that selected URL through the existing `/buy/share` import and Vehicle Case flow.
- Added Case ID confirmation and a View Vehicle Case action after case navigation.
- Navigation failures show the WebView2 error status without bypassing Facebook security controls.

### Automated Verification

- Windows Release build: passed with 0 warnings and 0 errors.
- Native browser contract and Windows shell tests: 4/4 passed.
- Real public Marketplace listing smoke: navigation passed, listing detection passed, current URL capture passed, and persistent profile folder exists.
- `git diff --check`: passed with line-ending notices only.

### Manual Owner Test Pending

- Facebook login and close/reopen session persistence.
- Search for `Revo`, Marketplace filters, real listing details, and photo navigation.
- Save to NK through the private review Site and resulting Vehicle Case ID.
- Android and iOS remain intentionally paused until this Windows test is completed.

## 2026-08-25 - Web Buying Browser Companion

Branch: `codex/buying-browser-rebuild`

### Completed

- Added `/buy/browser`, a zero-install browser-style NK companion for iPhone, Android, and Windows browsers.
- Added compact browser chrome, real Facebook Marketplace launch, clipboard/manual vehicle-link capture, and Save/Translate/Ask NK AI/Check Car actions.
- Routed explicit actions through `/buy/share` with `web_browser_companion` provenance so the existing real import and Vehicle Case flow is reused.
- Kept Facebook login, cookies, MFA, CAPTCHA, searches, and page content entirely with Facebook; no iframe, proxy, DOM access, credential form, or simulated integration was added.
- Added the new experiment to the `/buy` source screen without changing the demo Browse, Vehicle Case, pricing, inspection, Owner source, or customer-safe DTO behavior.

### Verification

- Build and complete Node suite: 27/27 passed.
- Typecheck: passed.
- Lint: passed with 0 errors and 13 pre-existing `<img>` warnings.
- `git diff --check`: passed with line-ending notices only.
- iPhone viewport 390 x 844: no horizontal overflow; Save and all four NK toolbar actions fit without overlap.
- Real Marketplace item URL enables Save, Translate, Ask NK AI, and Check Car actions.
- Desktop viewport 1280 x 900: no horizontal overflow and no browser console errors.

### Limitation / Next

- A web app cannot place Facebook itself inside the NK page while retaining the customer's real Facebook session. `/buy/browser` is an honest external-tab companion; same-window browsing requires native WKWebView/WebView/WebView2 validation.
- Next: publish only to the separate Owner review Site if review deployment is authorized; production and the existing live NK Cars Site remain untouched.

## 2026-08-25 - Cross-Platform Buying Browser POC

Branch: `codex/buying-browser-rebuild` (implemented in the isolated preview worktree before promotion)

### Completed

- Preserved rollback branch `rollback/pre-cross-platform-buying-browser` before native work.
- Added one versioned browser-adapter contract and capture provenance for `ios_wkwebview`, `android_webview`, and `windows_webview2` without changing Vehicle Case, pricing, inspection, Owner source, or customer-safe DTO logic.
- Added a Windows WPF/WebView2 shell with per-user persistent profile, real Marketplace navigation, native NK toolbar, explicit listing URL capture, external-open fallback, and no injected Facebook bridge or NK credential form.
- Built Windows Release with zero warnings/errors and ran a real Owner-supplied Marketplace item smoke test: navigation succeeded, the item URL remained current, listing detection passed, and the URL was capturable. Facebook login itself was not tested.
- Added an Android WebView shell with per-install profile isolation, cookies/session persistence, native toolbar, explicit capture, external-open fallback, and ACTION_SEND share fallback.
- Added an iOS WKWebView/XcodeGen project with persistent app-sandbox website data, native toolbar, explicit capture, and external-open fallback.
- Updated `CURRENT_V1.md` and added `CROSS_PLATFORM_BUYING_BROWSER.md`; the Owner-approved native direction now explicitly supersedes the earlier external-share-only conclusion.

### Verification

- Shared native contract tests: 3/3 passed.
- Windows WebView2 Release build: passed, 0 warnings and 0 errors.
- Real Windows WebView2 Facebook listing smoke: passed for public navigation, listing recognition, persistent profile creation, and current URL capture.
- Full web build/tests: build passed; all 27 tests passed, including 3 native contract tests.
- Android pure-Java listing policy compile/test: passed on JDK 17; only HTTPS Facebook Marketplace item URLs are accepted.
- Typecheck: passed.
- Lint: passed with 0 errors and 13 pre-existing `<img>` performance warnings.
- `git diff --check`: passed with line-ending notices only.
- Android APK/runtime: not yet run because the Android SDK license/toolchain is not accepted/installed on this machine.
- iOS build/runtime: not possible on this Windows host; requires macOS/Xcode/signing/device.

### Owner Blockers

- Android SDK license acceptance and Android SDK 35 installation, plus an emulator or physical Android device.
- macOS/Xcode, Apple signing team, and a physical/simulator iPhone test environment.
- Human-operated Facebook login is required for authenticated search, filters, restart persistence, and checkpoint behavior on every target. NK will not collect or automate credentials, MFA, CAPTCHA, or checkpoints.
- Durable authenticated Vehicle Cases and native distribution/signing remain prerequisites before customer release.

### Current Work / Next

- Cross-platform POC milestone was promoted to `codex/buying-browser-rebuild` and pushed to the private GitHub repository after all available checks passed.
- Next milestone: `BB-NATIVE-2 - Device Validation And Signed Fallbacks`. No production deployment or live Site overwrite is authorized.

## 2026-08-24 - Authenticated Facebook Buying Browser Feasibility Spike

Branch: `codex/buying-browser-rebuild`

### Completed

- Re-aligned the source experience: `/buy` launches the real Facebook source journey, `/buy/browse` keeps the demo/NK grid secondary, and `/buy/paste` is last resort.
- Tested the Owner-supplied real Marketplace item and Marketplace root; both return `X-Frame-Options: DENY`, so iframe embedding is blocked and will not be bypassed.
- Evaluated system browser/in-app browser tab, NK-controlled WebView, remote isolated browser, PWA Web Share Target, native iOS Share Extension, iPhone, Android, and desktop constraints.
- Implemented a Chromium-compatible PWA Web Share Target at `/buy/share`.
- Shared Facebook URLs now import permitted real evidence, record `captureMethod: web_share_target`, create/link a customer-safe Vehicle Case atomically, and open the case automatically.
- Preserved all existing Vehicle Case, pricing, inspection, customer-redaction, Owner source, source-adapter, and NK AI boundaries.
- Added `docs/BUYING_BROWSER_FEASIBILITY_SPIKE.md` with evidence, architecture matrix, exact limitations, and production gates.

### Owner / External Blockers

- iPhone Safari does not implement Web Share Target. The intended one-share iPhone UX requires an Apple Developer team, signed NK Cars iOS containing app + Share Extension, authenticated durable case API, Universal Links, and TestFlight/App Store installation.
- A customer-presented remote Facebook browser remains unproven and unapproved; it requires platform/legal review, encrypted isolated session custody, remote streaming infrastructure, and a real customer-authorized login test.
- No production deployment, live-site overwrite, real seller message, password/OTP/MFA/CAPTCHA capture, or security-control bypass was performed.

### Checks

- Typecheck passed.
- Lint passed with 0 errors and 13 pre-existing legacy `<img>` warnings.
- Build passed.
- Automated tests passed: 24/24.
- Real Owner-supplied Facebook URL passed the `/buy/share` browser flow and opened `NK-CASE-2026-001245` automatically with real Toyota/Hilux/Revo evidence and no Facebook URL/item ID in the customer DOM.
- Mobile 390 x 844 and desktop 1280 x 900 checks passed with no horizontal overflow, no demo cards on `/buy`, and no browser console errors.

## 2026-08-24 - Real Facebook Source Proof Of Concept

Branch: `codex/buying-browser-rebuild`

### Completed

- Stopped treating the demo vehicle grid as proof of Marketplace access and tested the three approved source approaches in order.
- Rejected embedded Facebook after the real listing response returned `X-Frame-Options: DENY`; no frame, proxy-header, authentication, MFA, CAPTCHA, or session-control bypass was attempted.
- Selected external Facebook app/browser plus Share or Copy Link as the first viable compliant architecture. The customer's authenticated Facebook session remains entirely under Facebook control.
- Proved the path with the Owner-supplied real share URL. NK resolved Marketplace item `1716607786274590`, imported available public evidence for a 2025 Toyota Hilux Revo GR Sport Wide, left unavailable fields Pending, and created `NK-CASE-2026-001245`.
- Added an external Facebook handoff to `/buy/paste`, user-triggered clipboard paste, and `?url=` / `?text=` handoff support.
- Added an internal `SourceCapture` linked to `VehicleCase.sourceCaptureId`. Submitted/canonical source URLs stay out of the customer vehicle DTO and customer case UI, while `/buy/owner` can resolve the internal capture.
- Preserved screenshot/photo/listing-text fallback and the existing downstream case, AI, pricing, availability, and inspection workflows.
- Documented evidence, constraints, and production gaps in `docs/REAL_SOURCE_POC.md`; updated `docs/CURRENT_V1.md` and `docs/GAP_ANALYSIS.md` to make the real external handoff the primary V1 source path.

### Current Work

- Real-source proof of concept implementation and verification are complete. Production activation remains unapproved.

### Owner Blockers

- Production deployment remains explicitly unapproved.
- Durable multi-user activation requires approved Auth/database configuration, tenant-scoped RLS, server-side source/case persistence, audit, backup, and private media policy.

### External Integration Blockers

- Facebook blocks embedded Marketplace with `X-Frame-Options: DENY`; this control is authoritative and will not be bypassed.
- Public Facebook metadata exposed only one listing image and omitted seller/contact, source price, exact location, full gallery, and current availability. These remain Pending unless the customer supplies evidence or an approved connector is configured.
- Remote isolated browsing remains a contingency requiring customer-authorized manual login, secure isolated profile storage, and an approved compliant runtime. It was not selected because external Share/Copy Link works without NK taking custody of the Facebook session.

### Verification

- Real source path passed in browser: external share URL -> NK import -> customer-safe listing -> Save as Vehicle Case -> internal source capture.
- Customer case body contained no Facebook URL, Marketplace item ID, seller identity, or seller contact; Owner/internal view retained the canonical source URL.
- Mobile check passed at 390 x 844 with the external Facebook action, three-step handoff, prefilled link, paste/import actions, and no horizontal overflow.
- Fresh mobile browser verification created `NK-CASE-2026-001245`, linked it to `https://www.facebook.com/marketplace/item/1716607786274590/` internally, and produced no application console warning/error.
- `npm.cmd test`: passed with a production build and 22/22 tests.
- `npm.cmd run build`: passed independently.
- Typecheck: passed with `tsc --noEmit --incremental false`.
- Lint: passed with 0 errors and 13 existing legacy `<img>` warnings outside Buying Browser.
- `git diff --check`: passed; only Git line-ending notices were emitted.

### Next Recommended Step

- After this POC is committed and pushed, retain external Share/Copy Link as the production baseline. The next production milestone remains authenticated durable Vehicle Cases and internal SourceCapture persistence; do not activate production without Owner approval.

## 2026-08-24 - Customer Browse UX Correction

Branch: `codex/buying-browser-rebuild`

### Completed

- Reworked only the customer-facing `/buy` Browse presentation into a compact mobile marketplace: header, search, filter/sort controls, horizontal location chips, result count, and an immediate two-column vehicle grid.
- Removed the large Browse/Paste/Ask feature panel and source explanation from the main viewport. Paste Vehicle Link and Ask NK AI remain available as small secondary tools.
- Reduced Demo treatment to small badges and reordered vehicle cards around photo, price, year/model, mileage, and general location.
- Reordered vehicle detail as photo, customer-safe summary, normalized specifications/description, then Save Vehicle, Ask NK AI, Check Availability, Request Inspection, and Buy Through NK actions.
- Preserved Vehicle Cases, pricing, inspection/travel quotes, progressive translation states, customer/internal DTO separation, Owner view, bottom navigation, source adapters, provider state, and all deterministic business rules.
- Kept the original NK Cars Sites project and `.openai/hosting.json` unchanged. The approved deployment target is the separate owner-only review Site at `https://nk-cars-buying-browser-v1-review-32d38b1.pennat.chatgpt.site/buy`.

### Verification

- `npm.cmd test`: passed with production build and 20/20 tests.
- Typecheck: passed with `tsc --noEmit --incremental false`.
- Lint: passed with 0 errors and 13 existing legacy `<img>` warnings outside Buying Browser.
- Browser checks passed at 390 x 844: six vehicle cards intersected the first viewport, the first vehicle image appeared above bottom navigation, filters/search worked, and no horizontal overflow or console warning/error was found.
- Desktop regression check passed at 1280 x 900 with a four-column grid and no removed feature panel.
- Customer detail showed no internal source URL, seller/contact, or exact source location and rendered all five approved actions after normalized vehicle information.

### Current Work

- The tested correction is committed, pushed, and deployed to the existing separate owner-only ChatGPT Site review project. Awaiting Owner mobile review; production activation remains unapproved.

### Next Recommended Step

- Owner reviews the corrected mobile marketplace preview. Keep `BB-V1D - Production Identity And Durable Cases` blocked until the preview is accepted and production infrastructure is approved.

## 2026-08-24 - Buying Browser V1 Preview Complete

Branch: `codex/buying-browser-rebuild`

### Completed

- Completed `BB-V1A`, `BB-V1B`, and `BB-V1C` as an additive preview under `/buy`; the legacy root and stock-first implementation remain unchanged as rollback/reference.
- Added the customer shell and routes for Browse, Saved, Paste Vehicle Link, Ask NK AI, Vehicle detail, My Cases, Case detail, Inspections, Messages, and Account.
- Added marketplace-style search, sort, Thai location, year, price, mileage, transmission, drive, and body filters with an iPhone two-column result grid.
- Added eight realistic AI-generated pickup demo images and source records that are visibly labeled Demo rather than represented as live inventory.
- Added a source-adapter boundary with separate internal and customer-safe DTOs. Customer routes exclude source URL/platform, seller/contact, exact source location, internal notes, source-cost context, and margin.
- Added deduplicated Vehicle Case creation, browser-local preview persistence, availability request history, deterministic pricing, deterministic inspection/travel quotes, inspection request state, and case-linked conversation history.
- Added deterministic grounded NK AI preview responses. The UI marks unknowns Pending and does not claim that a source, seller, AI provider, or inspector was contacted.
- Connected Paste Link to the existing real import API for supported Facebook URLs and retained open-source/photo/text/manual-review fallbacks for blocked or unsupported sources. Up to 30 photos are handled as one vehicle evidence set, retained in the Vehicle Case gallery, and stored separately in preview IndexedDB so metadata persistence does not silently discard the gallery.
- Added an Owner/internal demo route at `/buy/owner` for source URL, seller/contact, exact location, source price, notes, adapter state, and case status. It is explicitly not represented as a production authorization boundary.
- Replaced the browser-native reset confirmation with an accessible in-page confirmation and verified a clean preview reset.
- Preserved `.openai/hosting.json`, the existing Sites project association, the production root, and all rollback branches. No production deployment, Site overwrite, public publish, secret change, paid action, or real message occurred.

### Current Work

- Buying Browser V1 preview implementation and verification are complete. Awaiting Owner mobile review; production activation is not approved.

### Owner Blockers

- Production deployment, switching the public root to `/buy`, or overwriting the existing ChatGPT Site requires explicit Owner approval.
- Production customer identity and durable persistence require the approved Auth/database project, tenant configuration, RLS review, Storage policy, and production environment configuration.
- Production activation of the 10% commission and inspection/travel rates requires final Owner/commercial/legal approval.

### External Integration Blockers

- Real customer-specific Facebook/source sessions require customer-authorized manual login, encrypted isolated session storage, and a compliant connector network path. MFA, CAPTCHA, checkpoints, and platform restrictions are never bypassed.
- No approved production AI model/key, connector endpoint/token, durable worker, monitoring/alerting service, inspection provider directory, or live message channel is configured.
- Seller availability checks and inspection requests remain prepared/pending records only; no seller or provider message is sent.

### Verification

- Browser flow: Browse -> Vehicle detail -> Save Vehicle -> Vehicle Case -> Check Availability -> Request Inspection -> Ask NK AI passed and persisted across reload.
- Paste unsupported link -> photo/text fallback -> manual evidence review passed without fabricated source access or remote placeholder imagery.
- Multi-photo fallback -> Vehicle Case gallery passed with two selected files, gallery switching, and both images restored after reload from preview media storage.
- Customer/internal redaction boundary passed in browser and route tests; internal source facts appeared only in the Owner demo view.
- Responsive checks passed at 390 x 844 and 1280 x 900 with no horizontal overflow, framework error overlay, or console warning/error.
- `npm.cmd test`: passed, including a verified production build and 20/20 Node tests.
- `npm.cmd run build`: passed independently after the test run.
- `npm.cmd run test:connector-browser`: passed with two queued candidates and a completed three-image gallery fixture.
- Typecheck: passed with `tsc --noEmit --incremental false`.
- Lint: passed with 0 errors and 13 existing legacy `<img>` warnings outside the Buying Browser files.
- `git diff --check`: passed; only Git line-ending notices were emitted.

### Preview

- Local network preview: `http://192.168.0.184:4200/buy` while the development server and iPhone are on the same Wi-Fi.
- This is a temporary non-production preview; it does not change the existing ChatGPT Site.

### Next Recommended Step

- Owner reviews the mobile preview. The smallest following production milestone is `BB-V1D - Production Identity And Durable Cases`, starting with approved Auth, organization membership, tenant-scoped Vehicle Case persistence, RLS, and audit. Do not deploy or switch the public root without explicit approval.

## 2026-08-23 - Buying Browser Rebuild

Branch: `codex/buying-browser-rebuild`

### Approved Direction

- Read `docs/PRODUCT_PIVOT_BUYING_BROWSER.md` and applied it as the highest-priority direction for conflicting customer-facing V1 requirements.
- Preserved `codex/production-rebuild` at commit `61d4bc8` as the stock-first rollback/reference implementation.
- Created the dedicated additive rebuild branch; the existing root, legacy routes, demo data, `.openai/hosting.json`, and Sites association remain unchanged.
- Created `docs/BUYING_BROWSER_REBUILD_PLAN.md` covering routes, reuse/replacement, source sessions/fallback, Vehicle Case model, AI and inspection boundaries, pricing, migration, privacy, milestones, and acceptance tests.
- Replaced `docs/GAP_ANALYSIS.md` with a Buying Browser analysis and current V1-V5 classification.

### Current Work

- `BB-V1A - Additive Buying Browser Foundation`: customer account shell, Browse/search/filters/location, customer-safe source detail, saved state, Vehicle Case creation, and separate customer/internal source DTOs.
- Reusing the completed local Playwright Source Adapter/profile/queue foundation; it remains isolated from production and uses manual authorized login only.

### Assumptions And Limits

- `/buy` is the preview entry point; changing `/` or replacing the current public Site requires Owner approval.
- V1 preview uses realistic data explicitly marked Demo wherever no live authorized source is connected.
- Preview local storage is not production authentication, tenancy, audit, or durable persistence.
- Default 10% commission and inspection zones are deterministic preview configuration only; production activation requires final Owner/legal/rate approval.
- Availability checks, translated seller inquiries, and inspection requests record pending workflow state only. No real seller/customer message or provider booking is sent.

### Verification

- Imported `docs/CURRENT_V1.md` from the latest private `origin/main` as the concise active working context.
- Source-adapter contract tests: 7/7 passed.
- Real Chrome connector fixture: passed with two queued candidates, a login/checkpoint state, and a three-image gallery.
- Typecheck: passed.
- Lint: passed with 0 errors and the existing 13 legacy `<img>` warnings.
- Build and complete current test suite: 13/13 passed.
- `git diff --check`: passed; only Git line-ending notices were emitted.
- Buying Browser UI interaction and 390 x 844 mobile review remain pending.

### Next Recommended Step

- Complete BB-V1A, then implement BB-V1B and BB-V1C through a tested mobile preview. Do not deploy or overwrite the existing Site before Owner approval.

## 2026-08-23

Branch: `codex/production-rebuild`

### Live AI Broker Direction Amendment

- Read and imported `docs/PRODUCT_DIRECTION_LIVE_BROKER.md` from `origin/main` into the development branch as an authoritative V1 product-direction amendment.
- Updated source-of-truth order so the Live AI Broker amendment controls conflicting V1 sourcing assumptions while `docs/MASTER_SPECIFICATION.md` remains binding for non-conflicting and future commercial/operational requirements.
- Reframed the primary V1 journey as customer request -> structured requirement -> controlled authorized source search -> normalized candidates -> customer interest -> current availability/price verification -> Lead/Wanted/Deal.
- Reclassified published NK inventory and manual intake as valid secondary paths rather than requiring permanent bulk copies of live Facebook inventory.
- Updated `docs/GAP_ANALYSIS.md` with Live Broker gaps, source-first candidate/snapshot policy, profile/queue requirements, V1-V5 classification, blockers, and redaction/legal constraints.
- Replaced the V1 milestone sequence in `docs/IMPLEMENTATION_PLAN.md` with a Live Broker plan that preserves the approved mobile UI and V2-V5 boundaries.
- Proposed the smallest next milestone: `V1-LB1 - Authorized Source Search Foundation` using `SourceAdapter`, `BrowserProfileManager`, a concurrency-one `SearchQueue`, source-first candidates, and a dedicated Playwright profile with manual login only.
- Work on the local connector was paused when the amendment arrived. Early untested scaffolding remains isolated in the working tree and will be completed only through the new adapter/profile/queue boundaries.
- No production deployment, Site overwrite, production secret/environment change, real message, or public publication was performed.

### Master Specification Intake

- Owner instructed Codex to treat `docs/MASTER_SPECIFICATION.md` in the repository as the authoritative NK Cars product specification and ignore truncated Master Specification chat messages.
- Current repository source of truth contains detailed Sections 26-46 and preserves Sections 0-25 by accepted binding index/summary pending full text consolidation.
- Received Master Specification Part 1, sections 0-25, from the Owner. Requirements remain binding and must not be removed or reinterpreted.
- Received Master Specification Part 2, sections 26-46, from the Owner.
- Created `docs/MASTER_SPECIFICATION.md` and merged Part 2 into it.
- Preserved the existing accepted requirements by referencing sections 0-25 as binding until the full Part 1 text is consolidated.
- Created `docs/GAP_ANALYSIS.md` from the repository Master Specification only.
- Classified remaining work into V1-V5 and proposed the smallest next V1 milestone: Milestone 2A - Auth, Tenant, And Schema Foundation.
- Per Owner instruction: no production deployment, no public publish, no existing ChatGPT Site overwrite, and no next milestone coding without approval.

### Context Read

- Read `AGENTS.md`.
- Read all files in `docs`: `CODEX_HANDOFF.md`, `AI_MARKETPLACE_IMPORT.md`, `DATA_MODEL.md`, `PRODUCTION_ARCHITECTURE.md`, `ACCEPTANCE_TESTS.md`, `IMPLEMENTATION_PLAN.md`, and `CLOUD_BROWSER_SETUP.md`.
- Reviewed current source and tests under `app`, `db`, `worker`, `scripts`, and `tests`.

### Milestone

Started Milestone 1: Next.js shell and visual parity.

### Changes

- Added route-level entry points for the existing shell without redesigning UI or changing demo fixtures.
- Added internal route group pages for dashboard, vehicles, new/edit/review/360 vehicle views, leads, wanted, sourcing rules, and more.
- Added public route group pages for marketplace, vehicle detail, wanted create entry, and inquiry.
- Kept the prototype shell as the parity source and wired routes to initial shell state only.

### Constraints

- No public publish performed.
- No new repository created.
- No UI redesign, CSS token change, or demo seed change.

### Verification

- Installed dependencies with `npm ci`.
- Ran `npm.cmd test` with Git Bash added to the process PATH because the package build script invokes `bash`.
- Result: pass. The command ran `npm run build` and `node --test tests/rendered-html.test.mjs`.
- Verified rendered shell metadata and route entry points for `/`, internal routes, and public routes.
- Pre-commit audit ran on 2026-08-23:
  - `git diff --check`: pass.
  - `npm.cmd test`: pass.
  - `npm.cmd run build`: pass.
  - `npm.cmd exec tsc -- --noEmit --incremental false`: pass after adding local Cloudflare worker type declarations.
  - `npm.cmd run lint`: pass with existing `<img>` warnings in prototype components.
  - Local preview served at `http://127.0.0.1:4173/` and returned HTTP 200.
  - Chrome headless mobile screenshot was used for a 390px home-page check; a compact mobile action-button CSS adjustment was added to avoid narrow viewport overflow without changing flow or demo data.

### Notes

- The existing `npm` PowerShell shim is blocked by local execution policy, so tests were run through `npm.cmd`.
- The build emits Vinext route classification warnings for some routes as expected from static analysis; the build still completed successfully.
- `.openai/hosting.json` remains unchanged and still points to Sites project `appgprj_6a89acb712e481919bac8101abd6bf7e`.
- No commit, push, new Sites project, URL change, or public publish was performed.

### Gap Analysis Summary

- V1 remaining work is primarily production foundation plus durable sourcing/import/review/publish/marketplace/lead flow.
- V2 remaining work centers on Dealer Portal, Wanted reverse marketplace, dealer offers, seller availability, and Seller/Dealer Trust Score.
- V3 remaining work centers on quote/PI, negotiation approvals, payment control, Purchase Fund, Auto-Buy, deposits/refunds, Customer Trust Score, referral, and multi-vehicle purchase approvals.
- V4 remaining work centers on procurement, pre-purchase checks, purchase payment controls, Vehicle Secured, inspection, repair/modification, export/shipping, delivery, and after-sales.
- V5 remaining work centers on 360 pages, employee workflow/KPI, fraud/risk, immutable audit expansion, reporting/forecasting, Owner AI Command Center, and management briefs/reviews.
- Blocking dependencies include Supabase project/env confirmation, migrations/RLS/storage, durable job provider, compliant Facebook/Marketplace connector approach, AI key/model/cost policy, legal review for Purchase Fund, and Owner approval before production deployment.

### Hybrid Marketplace Import

- Implemented the chosen V1-safe import path: Facebook public metadata first, then screenshot/photo fallback, with Cloud Browser remaining optional.
- `/api/marketplace-import` now resolves Facebook share links to canonical Marketplace item URLs when public metadata is available.
- The importer extracts OpenGraph/Twitter metadata: title, description, cover image, canonical URL, and available price metadata.
- The importer returns `draft_fields` from deterministic text extraction so a draft can show brand/model/year/spec hints even if NK AI is not configured.
- The Add Vehicle UI now accepts `draft_fields` and keeps a metadata-based Review screen available if the AI extraction endpoint fails or is not configured.
- Missing fields from public metadata are surfaced as review issues, prompting screenshot/photo evidence for gallery, seller/contact, location, source price, and current availability.
- Fixed the hosted import request to use Facebook's public mobile content path with an iPhone-compatible request profile that identifies NK Cars. The previous crawler-style user agent was denied by Facebook from the Sites runtime.
- Fixed multi-line OpenGraph attribute parsing. Facebook places the Marketplace description across multiple lines, which previously caused the importer to drop mileage, body type, drive, and description evidence.
- Public metadata now prefers the canonical `og:url`, reads Thai price labels when present, recognizes Thai mileage text, and excludes placeholder `Unknown` / `Need Review` values from prefill so NK AI can still fill them.
- Added an API regression test covering mobile Facebook metadata, a multi-line Thai description, canonical URL, cover image, Thai price and mileage, 4WD, and Double Cab extraction.
- Verified against sample Facebook share URL `https://www.facebook.com/share/1DF6CzLM1A/?mibextid=wwXIfr` through a local endpoint call:
  - Status: `partial`.
  - Provider: `Facebook public metadata`.
  - Canonical URL: `https://www.facebook.com/marketplace/item/1716607786274590/`.
  - Title: `2025 Toyota HILUX REVO 2.8 4WD GR SPORT WIDE`.
  - Draft fields: Toyota, Hilux Revo, 2025, 4WD, Double Cab, 24,000 km.
  - Cover images: 1.
  - Missing evidence: full photo gallery, seller/contact, location, source price, current availability.

### Full Gallery And Customer-Safe English

- Fixed the hosted importer short-circuit that returned immediately after finding one public OpenGraph cover image. Public metadata is now treated as the initial result and a configured Cloud Browser supplements it.
- Added standard-Chromium gallery traversal for accessible Facebook listings. The connector opens the listing media, follows visible Next Photo controls, detects counters such as `1 of 18`, deduplicates Facebook CDN images, and returns up to 30 images with `expected_image_count` and `gallery_complete` evidence.
- Login UI no longer causes a false `login_required` result when real public listing evidence is also visible. Checkpoint/login-only pages still stop safely for human authentication.
- Added connector merge behavior and regression coverage proving that public metadata plus a configured Browserless session produces one completed gallery result instead of stopping at the cover image.
- Expanded deterministic Thai listing extraction for Toyota Revo shorthand, Rocco/GR Sport grade, 2.4L engine capacity, A/T and M/T variants, D/C body shorthand, Thai `ไมล์` mileage, and Thai source price text. Hard requirements such as 2WD/4WD remain unconfirmed when evidence is absent.
- Added an AI-generated customer English description field to Waiting Review. It summarizes only evidence-backed identity, grade, engine, transmission, drive, body, mileage, color, and features.
- Added defense-in-depth sanitization at AI response, draft save, and customer render. Customer copy removes URLs, seller/dealer/source/platform/contact/location, phone, source price/currency, VIN/chassis, registration, and plate references.
- Added a customer photo gallery with selectable thumbnails and retained imported HTTPS image collections in prototype device state. Customer pages do not visibly expose source URL, source platform, seller identity/contact, source price, or sourcing location.
- Verified the supplied Facebook public-content path directly: Facebook's unauthenticated HTML contains only one unique listing JPG, confirming that the remaining gallery requires an authenticated compliant browser session or owner-supplied photos/screenshots.

### Full Gallery Verification

- `git diff --check`: passed.
- `npm.cmd exec tsc -- --noEmit --incremental false`: passed.
- `npm.cmd run lint`: passed with 0 errors and the existing 13 `<img>` optimization warnings.
- `npm.cmd test`: passed, including build and 6/6 Node tests.
- Browserless function source syntax check: passed.
- Local preview at `http://127.0.0.1:4197` returned HTTP 200.
- iPhone-size viewport check at 390 x 844 passed for Add Vehicle and the customer vehicle detail page. No horizontal overflow or browser console errors were found; the public detail showed the English Vehicle Overview without source/seller/cost details.

### Current External Dependency

- Full Facebook carousel import is code-complete but cannot run on the existing private Site until `BROWSERLESS_TOKEN` and an authenticated `BROWSERLESS_PROFILE` are configured. The Site currently has neither value.
- This is a one-time Owner account/login setup, with occasional re-authentication only when Facebook expires or challenges the saved session. NK Cars does not store the Facebook password and does not bypass checkpoints or CAPTCHA.
- Until that connection exists, the deployed fallback remains usable: keep the listing URL, import the public cover/title/description, then upload multiple screenshots/photos and analyze them as one vehicle.
- Before a real customer launch, imported remote images must be copied into first-party durable media storage. The current prototype retains HTTPS gallery URLs, which can expire and can reveal the upstream CDN hostname to a technically inspecting user even though no source is visible in the UI.
- Superseded deployment instruction: completed and tested milestones may be committed and pushed to the development branch, but any production deployment or overwrite of the existing ChatGPT Site now requires explicit Owner approval.
