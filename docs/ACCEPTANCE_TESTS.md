# Acceptance and Parity Test Plan

This is the release gate for replacing the current private NK Cars V1 prototype. Test at mobile viewport sizes and against production-like database, Storage, Auth, job, connector, and AI boundaries.

## 1. Test identities and fixtures

Create separate identities:

- Owner in NK Cars organization.
- Internal Staff in NK Cars organization.
- Owner/Staff in an unrelated organization.
- Authenticated user with no membership.
- Anonymous/customer browser.
- Trusted job worker/service role.

Keep production-like fixtures separate from the explicit demo tenant.

Required demo fixture parity:

- 9 vehicles: 3 Waiting Review, 4 Published, 1 Reserved, 1 Sold.
- 5 leads.
- 3 wanted requests.
- 3 sourcing rules.
- Toyota Hilux Revo, Toyota Vigo, Ford Ranger, and Isuzu D-Max examples.
- All demo views visibly marked `DEMO DATA`.

## 2. Visual/mobile parity

- [ ] Current white/light, navy/charcoal automotive B2B style is preserved.
- [ ] Sticky top bar and fixed bottom navigation retain current position and labels.
- [ ] Internal nav is `Home | Vehicles | Leads | Wanted | More`.
- [ ] Customer nav is `Home | Vehicles | Wanted | Ask NK AI | More`.
- [ ] Large vehicle images, status badges, card radii, typography, spacing, and touch targets match the private preview.
- [ ] No long Vehicle Specs form appears when Add Vehicle first opens.
- [ ] Screens remain usable at 390 px and 430 px widths without horizontal page overflow.
- [ ] Photo controls, review actions, lead stages, and bottom nav meet reasonable mobile touch sizing.
- [ ] Loading, empty, error, conflict, and fallback states do not cause layout shifts that hide the primary action.
- [ ] Any intentional visual change has a documented technical reason and Owner approval.

Use screenshot comparison against the current private preview for key screens, with a reviewed tolerance for dynamic text/images.

## 3. New versus edit form isolation

- [ ] Opening Add Vehicle creates a blank draft: no URL, listing text, source, price, seller, specs, or photos.
- [ ] No demo vehicle is reused by the create screen.
- [ ] Opening Edit Vehicle loads only that vehicle, its images, sources, and field evidence.
- [ ] Switching between two edits does not leak stale values or images.
- [ ] `Clear All` clears the current unsaved intake and returns to the primary link-first state.
- [ ] Leaving/reopening a saved production draft restores only that draft.
- [ ] Reset Demo changes demo fixtures only and cannot affect production records.

## 4. Multi-photo mobile upload

Test on physical or device-cloud iPhone Safari and Android Chrome.

- [ ] File input supports `multiple` and selects 30 photos in one Photo Library action.
- [ ] Selected images appear in a thumbnail grid.
- [ ] User can add a second batch without replacing the first.
- [ ] User can reorder images using touch-accessible controls.
- [ ] Reorder persists after reload.
- [ ] User can choose/change cover image; exactly one active cover is persisted.
- [ ] User can delete any single image without deleting the draft.
- [ ] Delete persists and does not leave a broken public object reference.
- [ ] Upload retry resumes or clearly recovers from a transient connection loss.
- [ ] Unsupported MIME, excessive file, malformed image, and excessive pixel count receive safe validation messages.
- [ ] AI extraction starts only after the intended evidence batch is available and treats it as one vehicle.

## 5. Facebook Marketplace import — successful/partial fixture

Use an authorized connector test fixture or deterministic connector stub; do not depend on a live third-party listing in CI.

- [ ] Add Vehicle shows Marketplace URL as the primary action.
- [ ] Valid URL creates one idempotent import job.
- [ ] Repeated tap/retry with the same idempotency key does not create duplicate vehicles/jobs.
- [ ] Job captures reachable title, price, description, location, seller, URL, and images.
- [ ] Imported images are copied to owned private Storage and are not permanently hotlinked.
- [ ] Maximum 30 retained listing images; order is stable.
- [ ] Partial evidence is labelled partial, not falsely complete.
- [ ] All imported/uploaded text and images are passed to one logical AI analysis.
- [ ] Result opens Review with all imported images, cover, source, source price, extracted fields, and confidence.
- [ ] `Save Vehicle Draft` submits the record to Waiting Review, not public Marketplace.
- [ ] Reopening the Waiting Review item shows the same evidence and values.

## 6. Facebook blocked/unavailable/login fallback

- [ ] Invalid/non-Facebook URL receives a simple safe validation message.
- [ ] Connector not configured shows integration/connector-required state; no fake success.
- [ ] Login/checkpoint/two-factor page returns `login_required` and stops automation.
- [ ] Unavailable/blocked/timeout/temporary provider failure never exposes 429, API bodies, selectors, cookies, stack traces, or tokens.
- [ ] UI shows `Unable to import this listing automatically`.
- [ ] Original URL remains in the draft.
- [ ] `Upload Screenshots / Photos` and `Paste Listing Text` are immediately available.
- [ ] Uploading screenshots automatically continues the same draft flow without requiring manual specs.
- [ ] Pasted text plus screenshots/photos are analyzed together.
- [ ] The fallback can produce a reviewable draft and Waiting Review record.

## 7. AI extraction quality/guardrail fixtures

Create deterministic evidence fixtures for each case.

- [ ] Reads Marketplace screenshot title, price, year/model text, location, seller, and visible description.
- [ ] Reads supported evidence from front/rear/side, engine bay, interior, dashboard/odometer, VIN/spec label, and grade badges.
- [ ] Extracts all supported fields in `CODEX_HANDOFF.md`.
- [ ] Each AI-filled field has confidence, status, and evidence reference.
- [ ] Unknown information remains Unknown/null; no plausible default is invented.
- [ ] Low-confidence information is Need Review.
- [ ] Conflicting year/drive/price evidence is Conflict with alternatives; no silent choice.
- [ ] Document/VIN/spec-label evidence outranks listing text; listing text outranks visual inference.
- [ ] Model year and registration year remain separate.
- [ ] Screenshot OCR evidence points to the originating image.
- [ ] Full VIN/chassis remains internal and masked/absent publicly.
- [ ] A provider/schema failure produces a safe retry/fallback message and durable failed run metadata.

## 8. Manual correction and AI non-overwrite

- [ ] AI-filled fields are visually highlighted.
- [ ] User can edit immediately from Review.
- [ ] Editing an AI value records correction and locks the active value.
- [ ] Re-analysis fills blank/unlocked fields only.
- [ ] Re-analysis does not overwrite a locked manual correction.
- [ ] A contrary AI result is stored/displayed as suggestion/conflict when appropriate.
- [ ] Explicit unlock/use-suggestion action is required to replace a manual value.
- [ ] Correction record contains actor, old/new values, extraction/prompt/model version, evidence, and timestamp.

## 9. Duplicate and source behavior

- [ ] One Vehicle can retain multiple Source records.
- [ ] Exact external listing ID/normalized VIN fixture attaches a new source to the existing Vehicle.
- [ ] Exact merge does not create a second public card.
- [ ] Ambiguous match creates Possible Duplicate for Owner review.
- [ ] Owner can confirm same, confirm different, or defer.
- [ ] Staff cannot finalize a duplicate merge if the rule is Owner-only.
- [ ] Cheapest Verified source becomes default.
- [ ] If no source is Verified, cheapest usable source becomes provisional default with warning.
- [ ] Source price change creates activity and Need Your Attention item.
- [ ] Possibly unavailable source creates attention item and does not let AI confirm availability.

## 10. Waiting Review, approval, rejection, and publication

- [ ] Every saved intake reaches Waiting Review.
- [ ] Review includes photos, identity/specs, mileage/color, source cost, source/seller/URL, last verified, AI confidence, duplicate warning, selling price, GP, and markup.
- [ ] Staff can edit and save but cannot see/use Owner approve/publish/reject endpoints successfully.
- [ ] Owner approval is blocked when required publish data or NK Selling Price is missing/invalid.
- [ ] GP and markup update immediately in UI and are recomputed on server.
- [ ] Approve & Publish transaction sets status, public projection, public image availability, and activity events atomically.
- [ ] Concurrent Staff edit causes stale Owner approval to fail safely rather than publish stale data.
- [ ] Owner reject requires a reason and creates an event.
- [ ] Rejected vehicle is not public.
- [ ] Published vehicle appears in Marketplace without a refresh race or partial private data.

## 11. Marketplace and public data minimization

- [ ] Search and All/Available/Reserved/Sold filters work on mobile.
- [ ] Available maps from internal Published.
- [ ] Vehicle cards/detail show only approved public fields.
- [ ] Source cost, source/dealer, seller/contact, source URL, GP/markup, internal notes, raw AI evidence, and full VIN/plate never appear in HTML, JSON, RSC payload, cache, metadata, image alt text, or API response.
- [ ] Anonymous direct database/API attempts cannot read internal tables.
- [ ] Reserved displays Reserved.
- [ ] Sold remains visible with SOLD badge, last sold price, month/year, destination, and Find Similar.
- [ ] Public detail includes gallery/specs/price/availability and Ask AI, Check Availability, I'm Interested, Find Similar.
- [ ] Internal Vehicle 360 route is inaccessible to anonymous/customer users.

## 12. NK AI Sales and inquiry/lead

- [ ] Assistant receives the current public vehicle ID/context.
- [ ] It accurately returns stored public price only.
- [ ] It does not confirm stale/unverified availability and creates/requests Availability Check.
- [ ] It does not invent shipping cost/schedule.
- [ ] It does not offer a discount.
- [ ] It does not reveal internal fields through direct, indirect, prompt-injection, or tool-error questions.
- [ ] It captures country, port, quantity, budget, preferred model/year/spec, and vehicle interest.
- [ ] It creates one Inquiry and associated New Lead idempotently.
- [ ] The Lead appears on Owner Dashboard/Leads with correct last activity.
- [ ] If no inventory matches, it creates a Wanted Request in Searching.
- [ ] Public inquiry endpoints validate input, rate limit abuse, and do not grant internal read access.

## 13. Leads, wanted, rules, dashboard, and activity

- [ ] Owner Dashboard shows six real KPI counts.
- [ ] Need Your Attention links open the exact actionable record.
- [ ] Lead list shows all specified fields.
- [ ] Owner/Staff can transition through New, Qualified, Vehicle Selected, Availability Check, Closed.
- [ ] Unauthorized/cross-organization lead mutations fail.
- [ ] Wanted create form persists all specified fields.
- [ ] Wanted transitions through Searching, Matched, Customer Reviewing, Closed.
- [ ] A hot vehicle/request match produces Hot Match attention.
- [ ] Owner can create/edit/toggle all Sourcing Rule fields.
- [ ] Owner mobile sourcing menu validates year range, Bangkok Metro areas, daily limit 1-50, required/excluded keywords, schedule, priority, and active state.
- [ ] Run Now/Pause/Resume requires authenticated Owner access, uses an idempotency key, and produces an audit event.
- [ ] Hermes respects the daily cap and concurrency one, stops on Login Required/MFA/CAPTCHA/rate limiting, and never auto-publishes or sends seller messages.
- [ ] Unconfigured/unavailable QNAP/Hermes control fails closed without pretending a command or rule was saved.
- [ ] Anonymous Account exposes an Owner sourcing menu preview that renders the default rule and permits temporary form exploration without internal records.
- [ ] Owner sourcing preview cannot save rules or send Run/Pause/Resume commands; operational Owner routes and APIs remain authenticated.
- [ ] Facebook/Meta rule integration is visibly connector-ready only; it cannot fake ingestion.
- [ ] Vehicle 360 includes information, sources, pricing, inquiries, status, timeline, and AI summary.
- [ ] Every required important action produces a chronologically correct immutable activity entry.

## 14. Authorization/RLS/security tests

- [ ] RLS enabled and explicit privileges reviewed for every exposed table.
- [ ] Owner reads/writes only own organization and can use Owner transitions.
- [ ] Staff reads/writes allowed own-organization records but cannot publish/reject/use Owner procedures.
- [ ] Unrelated organization member cannot infer existence through IDs, counts, errors, realtime, Storage, or signed URLs.
- [ ] Authenticated non-member has no internal access.
- [ ] Anonymous has only intended public projection and validated create endpoints.
- [ ] Service role is never included in client bundle or public environment output.
- [ ] Storage original/evidence objects require active membership; public bucket contains only published derivatives.
- [ ] Storage upsert/update/delete policies are tested separately.
- [ ] URL/image fetchers block private networks, unsupported redirects/hosts, IP literals, and oversized content.
- [ ] CSRF/same-origin, XSS/output encoding, upload validation, rate limits, webhook signature/replay, and idempotency controls are tested.
- [ ] Logs/traces do not contain secrets, cookies, full VIN, seller contacts, or unnecessary customer PII.

## 15. Reliability and recovery

- [ ] Job can resume/retry after worker restart without duplicate vehicle/source/image rows.
- [ ] AI/provider retry is bounded and idempotent.
- [ ] Failed jobs are visible internally with safe remediation.
- [ ] Connector/AI kill switch moves users to fallback/manual evidence flow.
- [ ] Database migration rollback/forward-fix is rehearsed.
- [ ] Database restore and Storage object restore are tested separately.
- [ ] Published public projection remains internally consistent during partial provider outages.

## 16. End-to-end Definition of Done scenarios

### Scenario A — successful link import

1. Staff opens Add Vehicle on mobile; screen is blank/link-first.
2. Staff pastes a supported Facebook fixture URL and taps Analyze.
3. Connector fetches listing data/images; AI returns supported fields/confidence.
4. Staff corrects one low-confidence field and saves.
5. Vehicle appears Waiting Review; correction survives re-analysis.
6. Owner enters selling price and approves/publishes.
7. Vehicle appears public with no internal leakage.
8. Customer opens detail, asks AI, submits interest.
9. Inquiry/New Lead and dashboard KPI/activity appear.

### Scenario B — blocked Facebook fallback

1. Staff pastes a URL whose connector fixture returns login/blocked.
2. UI retains URL and shows safe fallback, no technical error.
3. Staff selects 30 mixed vehicle photos/screenshots in one mobile picker action.
4. AI analyzes them as one set and exposes conflicts/unknowns.
5. Staff reviews and saves to Waiting Review without manually completing a long form.

### Scenario C — duplicate source

1. Staff imports a second listing for an existing exact vehicle.
2. System attaches the new source instead of creating a duplicate public Vehicle.
3. Cheapest Verified source becomes default.
4. Ambiguous fixture creates Possible Duplicate and Owner attention.

### Scenario D — permission and privacy

1. Staff calls Owner publish/reject endpoints directly and is denied.
2. Anonymous/customer requests internal rows, source URLs, original images, and another tenant IDs and is denied.
3. Public card/detail/RSC/API/cache inspection contains only approved projection fields.

Release requires all four scenarios plus the relevant checklist sections to pass in the private preview. Public publication still requires explicit Owner approval.

