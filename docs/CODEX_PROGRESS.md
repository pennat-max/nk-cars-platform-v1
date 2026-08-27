# Codex Progress

## 2026-08-26 - Fullscreen Mobile Vehicle Gallery

Branch: `codex/buying-browser-rebuild`

### Completed

- Made every primary vehicle image tappable without changing the existing gallery layout or vehicle workflow.
- Added a Facebook-style fullscreen viewer with a black background, safe-area-aware close control, current/total counter, touch swipe, desktop previous/next controls, keyboard arrows, and Escape-to-close behavior.
- Kept the selected photo synchronized with the existing inline swipe gallery and locked background page scrolling while the viewer is open.

### Verification

- `npm.cmd test`: passed, 35/35, including the production build and fullscreen-gallery contract coverage.
- Typecheck: passed.
- Lint: passed with 0 errors and the existing 13 legacy `<img>` warnings outside Buying Browser.
- `git diff --check`: passed with line-ending notices only.
- iPhone viewport 390 x 844: tapping the primary image opened a full-viewport viewer at `1 of 6`; horizontal navigation advanced the counter to `2 of 6`; close restored the inline gallery and page scrolling. No horizontal overflow, error overlay, or console error was found.

### Deployment

- The milestone will be committed and pushed to the development branch. Updating the public Production Site still requires explicit Owner approval.

## 2026-08-26 - Split NK Fees And Three-Language Customer UI

Branch: `codex/buying-browser-rebuild`

### Completed

- Replaced the customer-visible single 10% service-fee presentation with deterministic NK Platform & Transaction and NK Buying Service monetary lines. New cases record configurable Owner rates of 6% and 4%; both components apply only to the current/actual vehicle purchase price, never to inspection, travel, transport, repair, shipping, tax, or other pass-through costs.
- Added Owner-only pricing settings with a deterministic 10% combined target. Existing cases retain recorded rates, while legacy browser-local cases migrate safely to 6% + 4% defaults.
- Added customer-facing “What's included?” disclosures for both NK fee components and an explicit statement that these are NK Cars fees, not Facebook, Marketplace, government, or third-party charges. Percentages are not rendered on customer pricing screens.
- Added one shared localization layer for English, Simplified Chinese, and Thai with a compact persistent mobile selector. Browse, Vehicle, Vehicle Case, Pricing, Inspection, Messages, and NK AI customer actions now render from the selected language without duplicating vehicle or pricing records.
- Added structured source-text evidence metadata and case translation traces. Original source/buyer text is preserved, normalized text is separate, and English/Chinese buyer availability or price intent can prepare a Thai seller request without sending it or inventing a reply.

### Verification

- `npm.cmd test`: passed, 34/34, including build, 6% + 4% calculations, pass-through protection, customer redaction, source-text preservation, and language/data immutability tests.
- Typecheck: passed.
- Lint: passed with 0 errors and 13 existing legacy `<img>` warnings outside Buying Browser.
- Browser flow: English -> Simplified Chinese -> Thai switching passed; vehicle price and Case ID stayed unchanged.
- iPhone viewport 390 x 844: Thai Vehicle Case, actions, split pricing, and bottom navigation passed with no overlap or console errors.

### Current Limitation / Next

- Translation is deterministic preview behavior and preserves prepared-not-sent boundaries. Production multilingual free-text translation and seller reply translation require an approved AI provider, evaluation, durable audit storage, and an authorized messaging channel.
- Owner pricing settings are browser-local preview configuration. Production requires authenticated server-side settings, versioned pricing snapshots, RBAC, and audit history.
- No production or ChatGPT Site deployment was performed.

## 2026-08-26 - Customer Swipe Galleries And USD Pricing

Branch: `codex/buying-browser-rebuild`

### Completed

- Expanded the ten Owner-reviewed Marketplace snapshots from three to six customer-safe images per vehicle, for 60 reviewed customer assets total. Raw evidence remains internal and images exposing source identity/contact or visible registration were not promoted.
- Rebuilt the customer vehicle-detail gallery as a touch-swipe, horizontal scroll-snap gallery with synchronized counter, thumbnails, and accessible previous/next controls.
- Changed customer Browse cards, USD price filters, imported previews, Vehicle Cases, transparent pricing, inspections, and grounded price replies to USD.
- Centralized the deterministic customer preview conversion at `THB 35.00 = USD 1`; internal source values and calculations remain in THB. The UI states that an Owner-approved quote sets the final USD price and stored FX.
- Preserved the existing design, five vehicle actions, customer/internal DTO separation, Owner THB source view, and all source/seller redaction controls.

### Verification

- `npm.cmd test`: passed, 31/31, including build and rendered-route leakage checks.
- Typecheck: passed.
- Lint: passed with 0 errors and 13 existing legacy `<img>` warnings outside Buying Browser.
- iPhone viewport 390 x 844: Browse and detail verified with no horizontal overflow, no broken gallery images, and no console errors/warnings.
- Touch-style horizontal gesture moved the gallery from image 2 to image 3; counter and active thumbnail stayed synchronized.
- USD maximum-price filter at `USD 16,000` returned the expected four vehicles.

### Current Limitation / Next

- The THB/USD rate is a configurable deterministic preview rate, not a live market feed and not a final commercial quote. Production Quotes/PIs must persist their approved historical FX rate.
- Production Auth, durable cases/media, live source sync, external AI/provider messaging, and native iOS/Android runtime validation remain blocked or future integration work.
- The approved deployment target is the separate Owner-only ChatGPT Site review project. The existing NK Cars live Site remains unchanged and must not be overwritten without explicit production approval.

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
- Mobile verification is complete. A local-network preview is running from the development machine for same-network iPhone review.

### Owner Blocker

- `.openai/hosting.json` resolves to the existing live `nk-cars-platform-v1` Site rather than a separate review project. No Sites deployment was performed because that would overwrite or modify the existing Site without explicit production approval.
- Next online step requires either explicit approval to update that existing Site or an approved, separately configured review Site. Do not create a new Site project implicitly.

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

## 2026-08-25 - Ten-Vehicle Owner Capture Review

### Completed

- Used the Owner's existing Facebook session in Chrome to search the real Facebook Marketplace for Toyota Revo vehicles from model year 2020 onward. No Facebook password, cookie, MFA value, or CAPTCHA response was collected by NK Cars.
- Captured ten real listing snapshots selected from the search results. Each record retains its canonical Marketplace item URL, seller/source facts, observed price, location, timestamp, and evidence-based English normalization in the internal Owner boundary.
- Stored all 167 accessible gallery images (12-20 per listing, 15.18 MB total) under `public/vehicle-evidence/nk-capture-batch-2026-08-25` for this local review milestone.
- Added explicit `Unknown` / `Need Review` handling. Notable conflicts include 35,000 versus 36,000 km on one source and model year 2020 versus registration year 2021 on another.
- Added an expandable Owner evidence gallery for every captured vehicle. Raw images can contain registration plates and source clues and are intentionally excluded from the customer Browse adapter and customer Vehicle Case DTOs.
- Kept `/buy/owner` behind ChatGPT user authentication. Local review used an ephemeral loopback-only development proxy that injects a test identity; no authentication bypass was added to production source.

### Verification

- Browser evidence count: 10 listing folders / 167 local images / zero capture-download failures.
- `npm.cmd exec tsc -- --noEmit --incremental false`: passed.
- `git diff --check`: passed.
- Direct ESLint invocation: passed with zero errors and 13 pre-existing prototype `<img>` optimization warnings.
- `npm.cmd test`: passed, including the production build and 29/29 Node tests. Coverage includes production Owner authentication, ten-listing/167-image evidence counts, and customer-route source/seller leakage checks.
- Desktop and iPhone-size 390 x 844 browser checks passed. The page rendered all records and evidence controls with no horizontal overflow or browser console errors.

### Current Work And Limits

- This is an operator-assisted proof using the Owner's logged-in computer, not autonomous scheduled Marketplace collection.
- Availability, seller claims, price freshness, ownership, accident/flood history, and condition remain unverified.
- Raw captured media is not customer-safe until registration plates and other source-identifying details are reviewed/redacted and media-use policy is confirmed.
- The proof currently uses repository-local static assets for local review. This capture directory must not be production deployed until evidence moves to authenticated private storage with visibility controls.
- No production deploy, existing ChatGPT Site overwrite, real seller message, or automated Facebook search was performed.

### Next Recommended Step

- After Owner review of the ten internal records, run the smallest publication milestone: select customer-safe covers/gallery media, mask registration/source clues, create customer-safe DTOs for approved records, and add only those approved records to Browse and Vehicle Cases.

## 2026-08-26 - Ten-Vehicle Customer Marketplace Review

### Completed

- Replaced the customer Browse demo feed with ten customer-safe snapshots derived from the real Owner capture batch. `/buy` now opens the Marketplace-style Browse experience directly; the source-launch and link/share fallback code remains available as rollback/reference.
- Added an explicit customer-only DTO module and source adapter. It does not import the internal capture records and contains no seller identity, seller phone, source URL, exact source location, or internal notes.
- Selected and visually reviewed 30 customer-safe photos, three per vehicle. The public asset paths use NK references rather than Facebook listing IDs, and the selected set excludes visible registration plates and direct source identifiers.
- Preserved all 167 raw images and complete source/seller evidence in the authenticated Owner boundary. No source record, source URL, or internal media was deleted.
- Kept price and availability honest: cards show the observed vehicle price while every listing remains `Availability Not Yet Confirmed`; seller contact and purchase commitment are not automated.
- Corrected one internal/customer mileage field to 247,356 km from the captured odometer image and retained `Need Review` for condition and modifications.

### Verification

- `git diff --check`: passed.
- `npm.cmd exec tsc -- --noEmit`: passed.
- `npm.cmd run lint`: passed with zero errors and 13 pre-existing prototype `<img>` optimization warnings.
- `npm.cmd test`: passed, including the production build and 30/30 Node tests.
- iPhone viewport checks at 390 x 844 passed for Browse, search, and vehicle detail. Browse rendered ten cards, `Rocco` search returned three, detail rendered three reviewed images and all five actions, and no customer-page horizontal overflow, missing image, console error, or source/seller leakage was found.
- `.openai/hosting.json` remains unchanged and still points to the existing NK Cars Site. The separate ChatGPT Site review deployment is the current release task; the existing Site will not be overwritten.

### Current Limits

- The ten records are reviewed static snapshots, not a live Marketplace feed. Current seller price, availability, condition, documents, and ownership claims still require NK verification.
- Customer account state, saved vehicles, Vehicle Cases, and conversations remain browser-local preview state; durable tenant-scoped persistence is not connected.
- Raw source media remains repository-local and must move to authenticated private storage before production activation.
- No production deployment, existing Site overwrite, seller/customer message, payment, or purchase commitment was performed.

### Next Recommended Milestone

- `BB-V1D-01 - Durable Review And Cases`: persist publication decisions, saved vehicles, Vehicle Cases, timeline, and conversation history under approved customer identity/RLS while retaining the current customer-safe DTO and private-source boundary.

## 2026-08-26 - Bangkok Metro And Customer Navigation Simplification

### Completed

- Changed the default Browse scope from All Thailand to Bangkok Metro: Bangkok, Nonthaburi, Pathum Thani, Samut Prakan, Samut Sakhon, and Nakhon Pathom.
- Kept Nearby Provinces and All Thailand available in the full filter sheet. Direct links to out-of-area vehicles continue to work.
- Corrected the current result status from the ambiguous `10 selected` label to `NK Selection`; the default view now truthfully shows six matching vehicles.
- Simplified mobile navigation to Browse, Saved, My Cases, Messages, and Account. Inspection remains accessible from My Cases and its existing route/workflow was preserved.
- Added a photo-level Save heart on Vehicle detail and moved Check Availability plus Ask NK AI above the location/specification sections. Check Availability is marked as the recommended first step.
- Replaced customer-facing technical normalization labels with translated vehicle details, translated-from-Thai/needs-review state, listing facts, and source-photo count.
- Expanded the deterministic Bangkok Metro inspection zone to Samut Sakhon and Nakhon Pathom without changing the configured fee amounts.

### Verification

- `git diff --check`: passed.
- TypeScript `--noEmit`: passed.
- ESLint: passed with 0 errors and 13 existing `<img>` optimization warnings.
- `npm.cmd test`: passed, including build and 36/36 Node tests.
- iPhone viewport 390 x 844: Browse, Vehicle detail, Chinese labels, bottom navigation, and Vehicle Case availability transition passed with no horizontal page overflow.
- Check Availability created/opened a deduplicated Vehicle Case and recorded `Availability Check Requested`; no real seller message was sent.

### Current Limits

- The six default-area vehicles are reviewed static snapshots, not a live synchronized feed.
- Inspection/travel amounts remain configured preview rules. No provider was assigned or booked.
- Customer state remains browser-local until the durable identity/case milestone is approved and connected.

### Next Recommended Milestone

- `BB-V1D-01 - Durable Review And Cases` remains next. Preserve the Bangkok Metro defaults and clarified customer action hierarchy while adding tenant-scoped persistence.

## 2026-08-26 - Google Sheets + Drive Staging Sync

### Completed

- Promoted Google Sheets + Drive from a one-car proof to the V1 staging system without changing the customer UI or removing the verified repository fallback.
- Renamed and retained the existing private spreadsheet as `NK Cars Vehicle Staging Registry` (`1IXEZTH2EYcIeM6HQKJ2Qfk4LZYsVWu4ipNolXoTnxhw`).
- Created a private `NK Cars Vehicle Staging` root (`1TVQxbCQP7KePJTLoEwHhXQY6FjsLcvc5`) with ten deterministic vehicle folders, each containing `photos/` and `evidence/`.
- Added header-mapped `Vehicles` and `Media` tabs with ten approved vehicles and sixty approved customer-safe images, six per vehicle. Existing proof/audit tabs were preserved.
- Added a server-only Google Sheets/Drive adapter using service-account OAuth, bounded responses, schema validation, configurable cache, and repository fallback.
- Added a first-party media proxy that rechecks vehicle/media publication and visibility, allows only bounded raster image content, and rejects active SVG/HTML before serving Drive media.
- Connected Browse and the authenticated Owner view to the new adapter. Customer DTOs continue to exclude source URL, seller identity/contact, exact location, internal notes, Google file IDs, and Drive URLs.
- Added safe sync-status reporting and documented setup, schema, operating procedure, failure behavior, and security boundaries in `docs/GOOGLE_STAGING_SYNC.md`.

### Current Work And Limits

- The Google Registry/Drive data is populated and connector-verified at ten vehicles and sixty media records.
- The app runtime does not yet have `GOOGLE_SERVICE_ACCOUNT_JSON`; it therefore truthfully serves the tested repository fallback. Live activation requires an approved read-only Google service account and secret configuration.
- The 167 raw source-evidence images remain in repository public assets. They were not deleted and require a separate verified migration into private evidence storage before production.
- Vehicle Cases remain browser-local. Google staging is not a replacement for durable tenant-scoped case persistence.
- No production deploy, existing ChatGPT Site overwrite, public Sheet/Drive sharing, real seller/customer message, or financial action was performed.

### Verification

- Google connector read-back: 10 `Vehicles` rows and 60 `Media` rows; staging root contains the Registry and all ten vehicle folders.
- TypeScript `--noEmit`: passed.
- ESLint: passed with zero errors and 13 existing `<img>` optimization warnings.
- `npm.cmd test`: passed, including the production build and 39/39 Node tests. Coverage includes header-mapped Google staging parsing, visibility enforcement, bounded raster-media enforcement, fail-closed API behavior without credentials, safe fallback status, customer/Owner data separation, and existing Buying Browser flows.
- iPhone viewport 390 x 844: Bangkok Metro Browse rendered six NK Selection cards with six working images, no horizontal overflow, no console errors, and no Google ID/source/seller leakage in customer HTML.

### Owner Blocker

- Create/approve a Google Cloud read-only service account, share the private staging root as Viewer, and store `GOOGLE_SERVICE_ACCOUNT_JSON` in the approved non-production runtime secret manager. The credential must not be pasted into a public page or committed to GitHub.

### Next Recommended Milestone

- `BB-V1-SYNC-02 - Activate And Verify Private Google Sync`: configure the credential in a separate non-production preview, verify all ten vehicles/sixty media through the live adapter, test fallback/error behavior, then continue to durable tenant-scoped Vehicle Cases.

## 2026-08-26 - Google Staging Operator Guardrails

### Completed

- Audited the private Registry metadata, active `Vehicles`/`Media` validation, and the ten-folder Drive root after the Owner authorized routine structural improvements.
- Confirmed the existing publication, visibility, review-status, availability, and translation validations are already present; no duplicate columns or replacement tabs were added.
- Added a compact `README` as the first Registry tab with the runtime tabs, exact vehicle/media publication rules, safe edit order, privacy warning, stable identity rules, Drive structure, five-minute cache, Vehicle Case snapshot rule, and legacy-tab status.
- Preserved every existing tab, row, Drive folder, file, ID, and private sharing state. No production deployment or public sharing was performed.

### Verification

- Google Sheets metadata read-back confirms `README` at index 0 with frozen title row; `Vehicles` and `Media` retain their original sheet IDs and names.
- `README!A1:B15` value and formatting read-back passed.
- Drive root read-back still contains the Registry and all ten vehicle folders and remains not shared publicly.

### Current Blocker And Next Step

- Runtime live sync still requires the approved read-only Google service account and `GOOGLE_SERVICE_ACCOUNT_JSON` in a non-production secret manager. Until then, the app continues using the verified repository fallback.

## 2026-08-26 - Authorized Ten-Vehicle Marketplace Sourcing Test

### Completed

- Searched real Facebook Marketplace through the Owner-controlled authenticated Chrome session for Toyota Hilux Revo pickups, model year 2020+, in Bangkok and the metropolitan area.
- Selected ten plausible listings after deduplicating against the existing ten listing IDs and excluding an implausible-price result.
- Captured normalized listing facts, original seller claims, source URL, seller identity, price, mileage, location, and all 137 accessible listing photos without sending seller messages or collecting Facebook credentials.
- Created `NK-MKT-2026-0826-11` through `NK-MKT-2026-0826-20`, each with private `photos/` and `evidence/` folders. All 137 captured files are private in `evidence/`.
- Added ten Registry rows as `Needs Review + INTERNAL_ONLY`, 137 Media rows as `Needs Review + INTERNAL_ONLY`, and one Audit Log entry. The original ten approved vehicles and sixty approved customer media rows were unchanged.
- Preserved conflicts for human review: vehicle 14 has AT/6MT and black/blue conflicts; vehicle 20 has listing-year 2020 versus model-year 2019/registered-2020 conflict.
- Updated the Google staging parser and Owner UI so the internal review queue can include unpublished rows while customer Browse still receives only approved vehicles with approved customer-visible media.

### Verification

- Google Sheet read-back: 10/10 new Vehicles rows, all `Needs Review + INTERNAL_ONLY`; 137/137 new Media rows, all `Needs Review + INTERNAL_ONLY`, with Drive IDs present.
- Google Drive read-back: ten evidence folders contain 17, 7, 20, 18, 12, 10, 15, 10, 19, and 9 files respectively; all 137 files report private/not shared.
- `npm.cmd test`: passed, including the production build and 39/39 Node tests.
- TypeScript `--noEmit`: passed.
- ESLint: passed with zero errors and 13 existing `<img>` optimization warnings.
- No production deployment, Site overwrite, public sharing, seller/customer message, or financial action occurred.

### Current Limits And Next Step

- The ten new records are intentionally not customer-visible. Owner review must select/redact customer-safe photos and explicitly approve rows/media before publication.
- Runtime live sync still requires the approved read-only service account and `GOOGLE_SERVICE_ACCOUNT_JSON`; the current Site remains on repository fallback.
- Next: activate private Google sync in a separate approved preview when the credential is available, then review/redact and explicitly approve selected vehicles/media for Browse.

## 2026-08-26 - Customer Cover Image Contract

### Completed

- Defined the first approved media item (`sort_order = 1`) as the customer cover used by both Browse cards and the first Vehicle Detail gallery slide.
- Visually audited the first approved image for all ten published vehicles. Vehicles 02, 04, 07, and 09 previously started with an interior, pickup bed, or detail image.
- Created deterministic customer-safe derivatives from those four real source covers. Registration/source-identifying regions are redacted; the original source files remain unchanged internal evidence.
- Added the four derivatives to the repository fallback and private Google Drive `photos/` folders, then synchronized the Registry to positions 1-7 for the affected galleries.
- Updated Registry guidance and parser validation so approved customer media must have a unique position-1 cover. The second ten-vehicle batch remains `Needs Review + INTERNAL_ONLY`.

### Data Status

- Registry: 20 vehicle rows: 10 approved and 10 Needs Review.
- Media: 201 rows: 64 approved customer-safe media and 137 private Needs Review evidence media.
- Customer publication status did not change; no new vehicle was approved by this milestone.

### Verification

- Google read-back confirms each affected vehicle has exactly one approved `sort_order = 1` cover and six existing images at positions 2-7.
- Google Drive upload/read-back confirms all four derivatives are in their existing private per-vehicle `photos/` folders.
- Full verified build and test suite passed: 39/39 tests.
- TypeScript `--noEmit` passed.
- ESLint passed with 0 errors and 13 pre-existing `<img>` optimization warnings.
- `git diff --check` passed.
- Mobile verification at 390x844 confirmed the reviewed cover is used on Browse and as slide 1 of the Vehicle Detail gallery without horizontal overflow or browser console errors.
- iPhone viewport 390 x 844 passed: Browse uses the exterior cover for affected in-area vehicles; Vehicle 02 detail starts with the redacted real cover, shows 1 of 7, loads all seven images, has no horizontal overflow, and produced no browser warnings/errors.

### Current Limits And Next Step

- Runtime live sync still requires the approved read-only service account and `GOOGLE_SERVICE_ACCOUNT_JSON`; until then the app uses the updated repository fallback.
- The ten new records remain private pending explicit Owner review and customer-safe media approval.
- Next remains `BB-V1-SYNC-02 - Activate And Verify Private Google Sync`, followed by review/redaction of the second batch and durable tenant-scoped Vehicle Cases.

## 2026-08-26 - Production Public/Internal Security Boundary

### Completed

- Extended the existing ChatGPT identity helper to require both the stable authenticated user ID and email.
- Changed `/buy/owner` from signed-in-only access to a fail-closed server-side Owner allowlist using `NK_OWNER_ACCOUNT_IDS`. Anonymous visitors are redirected to ChatGPT sign-in; signed-in non-Owners and deployments without an allowlist receive Not Found.
- Preserved all 167 raw Marketplace evidence images while moving them out of `public/` so Sites no longer packages or serves them as static customer assets.
- Moved the nine already reviewed POC customer images into the approved `vehicle-marketplace/owner-reviewed-2026-08-26` public boundary and updated their references without changing customer behavior.
- Removed raw evidence image URLs from repository fallback Owner records. The internal UI shows an honest pending-image state until authenticated Google/private-media sync is available.

### Security Contract

- Customer routes continue to receive only the customer-safe DTO and approved media.
- ChatGPT authentication alone does not grant Owner access; the authenticated account must also match the server-side Owner allowlist.
- Source files and business evidence were not deleted. Public build exclusion is independent of private evidence retention.

### Next

- Deploy and verify the Owner allowlist on the existing Site, then implement authenticated durable Vehicle Case persistence. Quotation/PI preparation follows durable Case identity and audit; real payment remains disabled.

## 2026-08-26 - Authenticated Durable Vehicle Case Workspace

### Completed

- Added stable ChatGPT account identity for signed-in customers while retaining anonymous device-local Browse and Save behavior.
- Added a D1 schema and additive migration for account workspaces plus append-only workspace sync events.
- Added authenticated read/write API routes with server-side account ownership, bounded state validation, customer-safe field enforcement, optimistic Revision checks, and conflict responses.
- Added client synchronization that migrates the existing signed-in device state, serializes saves, merges concurrent-device conflicts without dropping unique history, and keeps a local safety copy.
- Updated Account to show Local, Syncing, Synced, or Error state and to offer ChatGPT sign-in for anonymous users.
- Removed the seeded demonstration Vehicle Case from signed-in accounts; it remains only in anonymous preview mode.
- Preserved current Marketplace, pricing, inspection, translation, customer-safe DTO, source adapter, and Owner flows.

### Verification

- `npm.cmd test`: passed, including production build and 42/42 tests.
- Workspace coverage verifies authentication rejection, cross-account isolation, server-owned Case identity, stale Revision rejection, conflict merging, append-only event creation, and internal-field rejection.
- TypeScript `--noEmit`: passed.
- ESLint: passed with 0 errors and 13 existing `<img>` optimization warnings.
- `git diff --check`: passed.

### Production Boundary

- The additive D1 migration does not delete or rewrite existing records.
- No real seller/customer message, payment, purchase, invoice, or commercial commitment is sent or enabled.
- Device-local embedded image evidence is not copied into D1; private object storage remains a separate milestone.

### Next

- `BB-V1D-02 - Quotation Readiness`: add deterministic readiness checks and a customer-safe quotation draft. PI issuance remains blocked until verified availability, actual purchase price, all required material amounts, and approval rules are satisfied.

## 2026-08-26 - Deterministic Quotation And PI Gate

### Completed

- Added a deterministic Quotation readiness checklist inside each Vehicle Case.
- Requires verified availability, actual vehicle purchase price, and explicit confirmation of inspection/travel, domestic transport, repair/modification, export/shipping, and other agreed charges.
- Treats null as Pending and zero as an explicit no-charge confirmation.
- Added an idempotent Request Quotation Review action that records the request in the durable Case timeline/messages without sending any external message.
- Added English, Simplified Chinese, and Thai readiness presentation.
- Kept PI issuance blocked until an approved final quotation is accepted and added the Finance confirmation boundary for real funds received.
- Did not add invoice/PI numbering, payment, seller communication, or financial commitment.

### Verification

- Targeted Buying Browser tests: passed 28/28 after correcting null-versus-zero readiness handling.
- Local Vehicle Case interaction: readiness checklist rendered, six unresolved checks were shown for the unverified POC case, Request Quotation Review changed to Quotation Requested, timeline history updated, and browser console had no errors.
- Responsive CSS keeps the checklist single-column and the action full-width below 720px.

### Next

- `BB-V1D-03 - Owner Case Verification Queue`: give the authenticated Owner a controlled view of customer Case requests and audited controls for verified availability, actual purchase price, and material cost confirmations. Continue blocking quote issue, PI, payments, and real messages until their approval rules are implemented.

## 2026-08-26 - Owner Vehicle Case Verification Queue

### Completed

- Added an authenticated Owner-only queue that reads signed-in customer Vehicle Cases from D1 rather than browser-local preview state.
- Added controlled updates for availability, actual vehicle purchase price, inspection/travel, domestic transport, repair/modification, export/shipping, and other agreed charges.
- Preserved the pricing rule that null remains Pending and explicit zero means a confirmed no-charge line.
- Added required verification evidence notes, optimistic workspace Revision checks, and append-only audit events containing actor, Case, old values, new values, reason/evidence, and timestamp.
- Customer workspace state, Case timeline, and NK Team history update atomically. Internal evidence notes remain Owner-only.
- Quotation readiness recalculates deterministically after Owner verification. Final quotation issue, PI, payment, purchase, and external messages remain disabled.
- Added responsive Owner controls for phone and desktop without changing the customer Marketplace design or navigation.

### Verification

- `npm.cmd test`: passed, including production build and 47/47 tests.
- Tests cover anonymous denial, non-Owner denial, Owner allowlist access, cross-account Case lookup, stale Revision rejection, append-only audit, customer workspace update, null-versus-zero costs, and continued PI/payment blocking.
- TypeScript `--noEmit`: passed.
- ESLint: 0 errors; 13 pre-existing `<img>` optimization warnings.
- `git diff --check`: passed.
- iPhone viewport 390 x 844: Browse layout, filters, cards, and bottom navigation passed without overlap or customer-flow changes.

### Remaining V1 Work

- Issue an Owner-approved customer-visible final quotation with deterministic numbering, validity, visibility classification, and acceptance history; do not enable PI or payment before acceptance.
- Add controlled PI generation after accepted quotation, with document visibility and three-day validity/recheck rules.
- Activate live read-only Google staging sync when the approved service-account secret is available.
- Review/redact/approve the second ten-vehicle batch and persist publication decisions.
- Add real availability/inspection operational assignments only after approved providers, rate tables, and communication channels exist.
- Add private object storage, retention, backup, and restore policy for customer and source evidence.

### Next

- `BB-V1D-04 - Owner-Approved Quotation Record`: create a customer-safe quotation draft from verified Case facts, require Owner approval before issue, assign a unique number and validity period, record customer acceptance, and keep PI/payment disabled until acceptance.

## 2026-08-26 - Server-Authoritative Commercial Case Fields

### Completed

- Closed the customer workspace sync boundary so a customer device cannot self-verify availability, set the actual purchase price, change NK fee rates, or write pass-through commercial amounts.
- New customer Cases are normalized server-side to configured 6% + 4% NK rates, deterministic inspection zones, Pending material costs, and customer-request availability states only.
- After Owner verification, all commercial fields and the Owner verification marker are server-authoritative on later customer syncs.
- Owner-generated customer timeline/messages are preserved even if a stale or modified customer payload omits them.
- Customer actions that are still allowed, including save, availability request, inspection request, quotation request, and conversation history, continue through the existing workspace flow.

### Verification

- Production build and 48/48 tests passed.
- Added tests for attempted customer self-verification, fee-rate manipulation, price/cost overwrite, and removal of Owner audit history.
- TypeScript `--noEmit` and `git diff --check` passed.

### Next

- Continue with `BB-V1D-04 - Owner-Approved Quotation Record` on top of the protected commercial data boundary.

## 2026-08-26 - Owner-Approved Quotation Record

### Completed

- Added Owner-only quotation issue after the customer requests a quotation and every commercial readiness item is verified.
- Added atomic yearly numbering in D1 using `QT-YYYY-######`, a customer-visible immutable pricing snapshot, recorded THB/USD FX, and a three-day validity window.
- Added signed-in customer acceptance with exact quotation-number matching, idempotency, timeline/message history, workspace revision protection, and append-only audit events.
- Material Owner changes to price, availability, fees, or pass-through costs automatically supersede the prior quotation.
- Customer workspace writes cannot create, replace, or remove the server-authoritative quotation.
- After acceptance, the Case changes to `Ready for PI Review`; PI, payment confirmation, seller payment, and vehicle purchase remain separate disabled controls.
- Added mobile customer quotation presentation in English, Simplified Chinese, and Thai.

### Verification

- `npm.cmd test`: passed production build and 50/50 tests.
- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run lint`: passed with 0 errors and 13 pre-existing `<img>` optimization warnings.
- `git diff --check`: passed.
- Tests cover numbering, snapshot totals, recorded FX, exact three-day expiry, signed-in acceptance, idempotency, audit events, material-change supersession, customer write protection, and PI gating.

### Assumption

- V1 quotations use the same conservative three-day validity planned for PI. This is configurable in a later Owner policy milestone; stale quotations cannot be accepted.

### Next

- `BB-V1D-05 - Gated Proforma Invoice`: allow Owner issuance of a customer-visible PI only from an accepted, current quotation, with its own `PI-YYYY-######` number, immutable snapshot, three-day validity, and no payment confirmation.

## 2026-08-27 - Gated Proforma Invoice

### Completed

- Added Owner-only PI issue from an accepted current quotation. Unaccepted, changed, superseded, or expired commercial records fail closed.
- Added atomic yearly `PI-YYYY-######` numbering using the existing D1 document sequence table.
- PI snapshots the accepted quotation's line items, THB/USD exchange rate, THB total, USD total, and quotation reference; customer workspace writes cannot create or modify it.
- Added independent three-day PI validity. An expired PI cannot be reissued directly; Owner recheck supersedes both PI and quotation and requires a new accepted quotation.
- Added a customer-visible PI summary plus a dedicated mobile/print layout at `/buy/cases/:caseId/pi` in English, Simplified Chinese, and Thai.
- The document always shows `Payment status: Not confirmed`; it contains no invented bank account, payment instruction, payment confirmation, seller transfer, or purchase approval.
- Owner issue, Case/timeline update, workspace Revision, event, document number, and audit record are persisted through controlled server paths.

### Verification

- `npm.cmd test`: passed production build and 52/52 tests.
- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run lint`: passed with 0 errors and 13 pre-existing `<img>` warnings.
- `git diff --check`: passed.
- Microsoft Edge mobile viewport 390 x 844: PI rendered without horizontal overflow, bottom-navigation overlap, or console errors; print/save-PDF action and Case return action were visible.

### Owner / External Blockers

- Real legal issuer name/address/tax details and authorized payment instructions are not configured. They require Owner/Finance approval and must not be invented.
- Actual-funds confirmation remains Finance-only future work and no real payment flow is enabled.
- Live Google staging still requires the approved service-account secret and Drive Viewer access.
- Real availability messages, inspection booking, provider assignment, and seller/customer communications require approved external channels/providers and send authorization.
- Private operational media storage/retention and production backup/restore require approved QNAP/R2 infrastructure and policy.

### Next Recommended Step

- Owner/Finance supplies and approves legal issuer/document details and the payment-control policy. After that, implement authorized PI issuer configuration and Finance-only payment reporting/confirmation without enabling automatic transfers.

## 2026-08-27 - QNAP Infrastructure Handoff Integration

### Completed

- Verified QNAP infrastructure commit `cfc9644f8a31baa6f574f70914c78ea5c8b0d010` and pushed its branch to the actual GitHub remote as `origin/codex/qnap-infrastructure`.
- Imported only the five-file infrastructure commit into `codex/buying-browser-rebuild`; unrelated historical application changes from the infrastructure branch were not merged.
- Added the QNAP Dockerfile, Compose definition, Thai LAN deployment guide, and infrastructure handoff without changing NK Cars business logic.
- Recorded that QNAP currently serves old snapshot `f018cd5`, while the application branch already contains newer D1-backed Case, quotation, and PI work.

### Verification

- Confirmed the QNAP handoff reports HTTP 200 for LAN `/buy` and the temporary public tunnel.
- Confirmed the Quick Tunnel is unauthenticated and suitable only for non-confidential preview data.
- `npm.cmd test`: production build and 52/52 tests passed after adding Git Bash to this Windows session's `PATH`.
- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run lint`: passed with 0 errors and 13 pre-existing `<img>` warnings.
- `git diff --check`: passed.
- QNAP handoff records `docker compose config --quiet` as passed on QNAP. It could not be repeated on this Windows session because Docker CLI is not installed here.

### Blockers

- QNAP does not yet run the current application commit or a persistent NK Cars PostgreSQL/media backend.
- The temporary Quick Tunnel has no access control or uptime guarantee.
- Production data migration, secrets, named tunnel/access policy, backup, restore, and cutover still require separate implementation and Owner approval where applicable.

## 2026-08-27 - Current Build QNAP Release Preparation

### Completed

- Added a side-by-side QNAP Compose release for the current application build using container `tony-nk-cars-current` and LAN port `4331`.
- Preserved the old QNAP preview container at port `4330` as an immediate rollback/reference point.
- Added a bounded deployment script that validates Compose on QNAP, builds a commit-tagged image, waits for container health, and verifies `/buy` before reporting success.
- Documented that container deployment alone cannot migrate ChatGPT authentication headers or Cloudflare D1 persistence.

### Verification

- `bash -n deploy/qnap/deploy-current.sh`: passed.
- `npm.cmd test`: production build and 52/52 tests passed.

### Owner Blocker

- The QNAP admin page is reachable, but no authenticated browser or SSH session is available to this Codex session. The Owner must authenticate directly; the password must not be placed in Git, chat, scripts, or environment templates.

### Architecture Blocker

- A QNAP-hosted build cannot provide the current signed-in workspace, Owner queue, quotation, or PI behavior until an approved replacement for ChatGPT auth headers and the Cloudflare D1 binding is implemented. The safe interim architecture is to keep the current ChatGPT Site for identity/customer access while QNAP services are introduced behind a controlled API.

## 2026-08-27 - Current Build Deployed to QNAP

### Completed

- Deployed application commit `736277a` to QNAP as side-by-side container `tony-nk-cars-current` without stopping or replacing the existing preview, Hermes, n8n, or PostgreSQL containers.
- Kept the previous QNAP preview on LAN port `4330`; the current build uses port `4331`.
- Added a separate account-less Cloudflare Quick Tunnel for mobile review.
- Corrected the deployment script for QNAP POSIX shell compatibility and enforced Unix line endings in release archives.

### Verification

- Local production build and 52/52 tests passed.
- QNAP Docker build and container health check passed.
- LAN and public `/buy` returned HTTP 200.
- Browse and Vehicle Detail passed a 390 x 844 mobile check with no console errors or horizontal overflow; Vehicle Detail loaded 12 image elements.

### Security / Owner Action

- The temporary public tunnel has no authentication or uptime guarantee and must not be used for confidential production data.
- The QNAP administrator password was disclosed in chat and must be rotated. It was not written to Git, repository files, release archives, or application environment variables.

### Remaining Migration Work

- ChatGPT authentication headers and Cloudflare D1 data remain on the existing ChatGPT Site.
- Moving signed-in Cases, Owner approvals, quotations, PI records, and audit history requires an approved QNAP authentication boundary, PostgreSQL adapter, D1 export/import, backup, and restore test before cutover.

## 2026-08-27 - QNAP Inventory, Media, PostgreSQL, And Backup Migration

### Completed

- Preserved the existing ChatGPT Site and QNAP ports `4330`/`4331` as rollback/reference deployments.
- Deployed commit `99ed4c02ee98da6709f6ba10cd0040e752bdf437` side-by-side on QNAP port `4332` with isolated PostgreSQL, authenticated internal Data API, customer web, and daily backup services.
- Migrated the Google staging export and Drive/repository media snapshot: 20 vehicles and 368 media records, with internal-only media excluded from the public web mount.
- Switched QNAP Browse inventory reads to PostgreSQL through the Source Adapter boundary while retaining Google/repository fallbacks.
- Split QNAP networking into private data and public web edge networks so PostgreSQL/Data API stay internal while the web port is reachable.
- Fixed portable backup checksums and verified a complete post-import restore in an isolated temporary database.
- Created a temporary QNAP public review URL: `https://desktop-tampa-unnecessary-provinces.trycloudflare.com/buy`.

### Verification

- QNAP containers `tony-nk-cars-postgres`, `tony-nk-cars-data`, and `tony-nk-cars-full`: healthy.
- Inventory: 10 approved + 10 needs review; media: 64 customer-visible + 304 internal-only.
- Public Browse and image requests: HTTP 200.
- iPhone-size 390 x 844 Browse: 6/6 covers loaded; Vehicle Detail: 14/14 images loaded.
- Backup SHA-256: passed; restore result: 20 vehicles and 368 media rows.
- `npm.cmd test`: production build and 54/54 tests passed; TypeScript `--noEmit`, lint (0 errors, 13 existing image warnings), and `git diff --check` passed.

### Owner Blockers

- A production QNAP account/authentication boundary must be approved before migrating signed-in customer/Owner workflows away from ChatGPT authentication.
- A complete non-truncated Cloudflare D1 export is required before importing existing Saved items, Vehicle Cases, quotations, PI records, and audit history. No partial state was imported.
- A stable domain/Cloudflare Named Tunnel with access policy requires Owner-controlled Cloudflare authorization. The current Quick Tunnel is review-only.
- Rotate the QNAP administrator password because it was disclosed in chat; it was not stored in Git or application configuration.

### Next Recommended Step

Approve and configure the production identity boundary and stable tunnel, then add a PostgreSQL workspace adapter and perform a verified D1 export/import before any traffic cutover. Until then, use QNAP for the migrated inventory/media review while the existing ChatGPT Site remains the authoritative signed-in workspace.

## 2026-08-27 - QNAP Becomes Primary Inventory/Media Application Source

### Completed

- Changed the application source priority to QNAP PostgreSQL/media first, verified repository snapshot second.
- Retained Google Sheets/Drive only as an explicit migration bridge controlled by `NK_ENABLE_GOOGLE_STAGING_FALLBACK=true`; it is disabled by default.
- Updated sync status and customer/Owner UI copy in English, Simplified Chinese, and Thai to describe NK/QNAP storage rather than Google staging.
- Rebuilt QNAP listing payloads into a strict customer-field allowlist and rejected traversal/non-NK media paths.
- Preserved Vehicle Case, pricing, inspection, localization, source adapters, and customer/internal redaction behavior.
- Added `docs/QNAP_APP_REQUIREMENTS.md` as the application-to-infrastructure handoff; no change was made to `codex/qnap-infrastructure`.

### Remaining Blockers

- The Site runtime needs an approved stable authenticated QNAP API URL/token before it can use live QNAP inventory; otherwise it safely uses the repository snapshot.
- QNAP infrastructure must provide the Owner/internal inventory endpoint before the Owner review queue can read all needs-review records from QNAP.
- Identity/D1 workspace migration remains separate and incomplete; no production cutover was performed.

### Verification

- Production build and 54/54 tests passed.
- TypeScript `--noEmit` passed.
- Lint passed with 0 errors and 13 existing `<img>` optimization warnings.
- All 10 approved records in the private QNAP migration seed passed the strict customer DTO parser.
- Mobile 390 x 844 Account view showed QNAP storage/fallback status with no horizontal overflow and no Google-primary copy.

## 2026-08-27 - QNAP Owner Inventory And Protected Media Application Contract

### Completed

- Added an authenticated server-side QNAP Owner inventory client for `/v1/admin/inventory-records`.
- Added a strict allowlisted Owner parser that validates stable vehicle/source identities, publication/visibility rules, commercial vehicle fields, HTTPS source links, media identities, and bounded field sizes.
- Added an Owner-only media application route. It requires the existing ChatGPT Owner account allowlist, validates vehicle/media IDs and raster MIME/size, and returns private `no-store` responses.
- Kept customer and Owner data paths separate. Unknown database fields and legacy Drive storage IDs are discarded rather than passed through.
- Preserved imported `Conflict` evidence as explicit Owner review labels while mapping presentation fields to the existing safe `Unknown` / `Need Review` states.
- Updated the Owner route so live customer inventory is not mistaken for live Owner inventory. If the Owner endpoint is unavailable, the page explicitly uses the verified internal fallback.
- Expanded `docs/QNAP_APP_REQUIREMENTS.md` with exact Owner inventory and protected media contracts. No `deploy/qnap` infrastructure file was changed.

### Verification

- Production build passed and includes `/api/buying-browser/owner/media/:vehicleId/:mediaId`.
- `npm.cmd test`: 55/55 tests passed.
- TypeScript `--noEmit`: passed.
- Lint: 0 errors; 13 existing `<img>` optimization warnings.
- `git diff --check`: passed.
- Full private migration seed compatibility: 20/20 Owner records and 368/368 protected media references parsed successfully.
- Anonymous and unconfigured Owner media requests fail closed with `404`.

### Remaining Infrastructure Blocker

- QNAP Data API must implement `/v1/admin/inventory-records`, `/v1/public/media/:vehicleId/:mediaId`, and `/v1/admin/media/:vehicleId/:mediaId` before the application can use the new clients live from an external runtime.
- Stable authenticated QNAP ingress remains required. The current Quick Tunnel is review-only and may change after restart.
- No production deployment, Site overwrite, production data migration, real message, payment, or purchase action was performed.

### Next Recommended Step

QNAP infrastructure implements the documented endpoints and runs the contract against the existing 20-vehicle/368-media dataset. The application can then perform a live Owner/customer separation test without changing production identity or D1 workspace storage.

## 2026-08-27 - Vercel Project And Custom-Domain Preview Foundation

### Completed

- Authenticated the Owner's Vercel CLI through Vercel's device authorization flow without collecting or storing a password.
- Confirmed `nkautotrade.com` is registered with Vercel nameservers under team `nkautotrade`.
- Created and linked the separate Vercel project `nk-cars-platform-v1`.
- Added a Vercel-specific Next.js build command while preserving the existing Vinext/ChatGPT Sites build and `.openai/hosting.json`.
- Added a bounded Vercel upload ignore list for private migration evidence, browser profiles, native projects, deployment artifacts, and generated Cloudflare output.
- Made canonical/Open Graph metadata configurable through `NEXT_PUBLIC_SITE_URL` with the current ChatGPT Site retained as the default.
- Deployed and verified a Vercel Preview at `https://nk-cars-platform-v1-oywvjmu8z-nkautotrade.vercel.app/buy`.

### Verification

- Vercel remote Next.js build: passed; 29 static/dynamic application routes generated.
- Mobile 390 x 844 Browse verification: passed; six Bangkok Metro listings rendered and no browser console errors were recorded.
- Existing Vinext/ChatGPT Sites build: passed.
- Application tests: 55/55 passed.
- Lint: 0 errors and 13 existing `<img>` optimization warnings.
- `git diff --check`: passed.

### Current Limitation

- Vercel does not provide the ChatGPT Site identity headers or D1 binding. Anonymous Browse and device-local fallback work, but signed-in workspace cutover requires the approved QNAP/PostgreSQL identity and workspace adapter.
- Production deployment and domain assignment succeeded for `nkautotrade.com` and `www.nkautotrade.com`; both returned HTTP 200 on `/buy`.
- Public Vercel Production disables the seeded demo workspace. Anonymous visitors use a blank Guest device workspace until production identity is connected.
- The existing ChatGPT Site and QNAP deployments remain unchanged as rollback/reference environments.

## 2026-08-27 - Second Reviewed Inventory Batch

### Completed

- Applied the Owner's approval to the remaining ten staged Toyota pickup records without treating approval as availability verification.
- Added ten strict customer-safe listing records to the verified repository fallback, bringing Browse to 20 reviewed vehicles and the Bangkok Metro default result to 16 vehicles.
- Selected 71 customer-visible images from the private evidence batch. Plates and source/contact markings on six covers use customer-safe derivatives; original evidence was retained unchanged outside the public asset boundary.
- Preserved unresolved evidence explicitly: transmission/color conflict remains Need Review for record 14 and model year remains unset/Need Review for record 20.
- Expanded regression coverage for the 20-record/135-image customer marketplace and customer-source leakage boundary.

### Checks

- Verified build completed successfully.
- Customer inventory/media regression passed; both stale Bangkok Metro count assertions were updated from 6 to 16.

### Remaining

- QNAP infrastructure must import the approved publication states/media mapping and expose the authenticated Data API before QNAP can be reported synchronized.
- V1 operational activation still requires approved customer identity, legal issuer/payment instructions, seller availability messaging, and inspection-provider setup. No integration was faked or activated.

## 2026-08-27 - Buying Browser V1 application completion

### Completed

- Completed English, Simplified Chinese, and Thai localization for the core customer V1 routes: vehicle detail/gallery, Vehicle Cases, inspections, Messages, Account, Paste/Share fallback, browser companion, and NK AI search.
- Preserved one authoritative vehicle/Case/pricing record while translating presentation labels and normalized customer text.
- Fixed the mobile Messages conversation grid so long titles and translated previews cannot widen the page.
- Reverified all 20 reviewed listings, 135 customer images, customer/internal redaction boundaries, deterministic pricing, quotation/PI controls, QNAP adapters, and repository fail-safe behavior.

### Verification

- TypeScript `--noEmit`: passed.
- `npm.cmd test`: production build and 55/55 tests passed.
- Lint: passed with 0 errors and 13 existing `<img>` optimization warnings.
- `git diff --check`: passed.
- Mobile 390 x 844: English, Simplified Chinese, and Thai passed with no broken images or horizontal overflow across Browse, vehicle detail/gallery, Cases, inspections, Messages, Account, Paste, and browser companion.

### Owner / external blockers

- Production identity and durable customer workspace for Vercel/QNAP are not configured.
- Approved issuer/tax/address/payment instructions and Finance actual-funds policy are not supplied; PI remains non-payment and payment/purchase remain disabled.
- No authorized seller messaging/reply channel or inspection-provider booking integration exists.
- QNAP must implement the stable authenticated customer/Owner inventory and media endpoints and synchronize the second publication batch.

The repository now contains the maximum technically achievable V1 application. Remaining work is controlled production/operations activation, not a simulated integration.

### Production delivery verification

- Deployed tested application commit `89b3b53` to the existing separate Vercel project; the ChatGPT Site and QNAP deployment were not overwritten.
- Production alias: `https://nkautotrade.com/buy`.
- Vercel deployment `dpl_5LGtGpQ3m8HWU3CVTY2VuPXwLdJC`: Ready.
- Production `/buy`, a real vehicle-detail route, and sync-status endpoint returned HTTP 200.
- Mobile 390 x 844 production check: 16 Bangkok Metro records, no broken images, no horizontal overflow, English/Chinese/Thai switching passed, and no browser console errors.
- Vercel production error-log scan for the deployment hour returned no errors.

## 2026-08-27 - Short production entry URL

- Changed only the public root entry so `https://nkautotrade.com/` redirects to Buying Browser at `/buy`.
- Preserved all existing vehicle, Vehicle Case, quotation, PI, Owner, and API routes.
- Added redirect regression coverage and retained the previous platform implementation as rollback/reference code.
