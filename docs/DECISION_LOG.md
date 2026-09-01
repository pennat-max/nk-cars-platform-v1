# NK Cars — Decision Log

Purpose: Durable project memory for approved product, architecture, pricing, workflow, infrastructure, and operating decisions.

Policy:
- GitHub is the source of truth for approved project decisions and implementation state.
- New approved decisions should be appended here and reflected in `docs/CURRENT_V1.md` when they materially change current behavior.
- Do not store secrets, credentials, customer private data, browser sessions, or production data in this file/repository.
- If a later decision supersedes an earlier one, append a new entry rather than silently rewriting history.

## 2026-08-26 — Google Sheets + Google Drive staging approved

Status: APPROVED

Decision:
Use Google Sheets + Google Drive as the V1 staging/control layer for captured vehicle inventory.

Target flow:
**Marketplace / authorized capture -> AI normalize -> Google Sheets vehicle staging + Google Drive media/evidence staging -> NK App Browse/NK Selection -> customer interest -> Vehicle Case.**

Rules:
- Sheet/Drive staging must sit behind adapters and must not be hard-coded into NK business logic.
- One authoritative staged vehicle record per captured vehicle.
- Google Drive should evolve toward deterministic per-vehicle folders/media references rather than one flat POC folder.
- Customer app reads only approved customer-safe projections.
- Existing Vehicle Case, pricing, inspection, localization, and Owner/internal source boundaries are reused.
- Vehicle Case becomes the operational customer/deal record after qualified customer interest/action.
- Historical Vehicle Case snapshots/audit must not be silently rewritten by later source/staging changes.
- Repository snapshot vehicles remain fallback/test fixtures while staging automation is implemented.
- Long-term storage/database may migrate to QNAP PostgreSQL + QNAP/private object/file storage without rewriting downstream business workflows.

## 2026-08-26 — GitHub as project memory / single source of truth

Status: APPROVED

Decision:
GitHub is the authoritative project memory for source code, architecture, approved product decisions, pricing rules, workflow rules, recovery documentation, and implementation checkpoints.

Rules:
- Codex should update `docs/CURRENT_V1.md` when a completed milestone materially changes current state.
- Material approved decisions should be appended to this log.
- Stable implementation + corresponding docs should be committed/pushed together when practical.
- GitHub is not the runtime database for inventory/customer data and must not contain secrets or production session data.

## 2026-08-26 — NK fee split presentation

Status: APPROVED FOR V1 / NOT PRODUCTION-ACTIVATED

Decision:
Internal target fee structure is:
- NK Platform & Transaction component: 6% of actual vehicle purchase price
- NK Buying Service component: 4% of actual vehicle purchase price
- Total NK fee target: 10%

Customer presentation:
- Show monetary amounts and service inclusions by default.
- Do not show the 6% / 4% percentages by default.
- Do not apply these percentages to inspection, travel, transport, repairs, shipping, taxes, or other pass-through costs unless a future approved rule explicitly changes this.
- Rates remain configurable and require final approval before production activation.

## 2026-08-26 — Language support

Status: APPROVED

Decision:
Customer-facing V1 supports:
- English (default)
- Simplified Chinese
- Thai

Rules:
- Use one authoritative structured business record.
- Language switching must not change underlying vehicle/pricing data.
- Preserve original source text separately from normalized/translated customer text.

## 2026-08-26 — Cross-platform Buying Browser direction remains valid

Status: APPROVED

Decision:
Keep the cross-platform browser/source-capture architecture as an input path rather than a runtime requirement for every customer browse.

Adapters under evaluation/use:
- iOS WKWebView
- Android WebView
- Windows WebView2
- external Share to NK
- Copy/Paste link fallback

The customer/source user authenticates directly to the source. NK must not collect source passwords or bypass MFA/CAPTCHA/security controls.

## 2026-08-26 — QNAP + Hermes infrastructure direction

Status: APPROVED DIRECTION / NOT YET PRODUCTION CUTOVER

Decision:
QNAP may become the future NK runtime host for:
- web/API services
- PostgreSQL database
- private media/file storage
- background workers
- Hermes sourcing/operations agent

Hermes may perform authorized sourcing, normalization, coordination, and data-entry/operations tasks.

Google Sheets + Drive remain the V1 staging/control layer while QNAP runtime is being proven.

Production migration to QNAP must not occur until backup/recovery, security, networking, secrets, monitoring, and restore procedures are tested.

## 2026-08-26 — Disaster recovery policy

Status: APPROVED DIRECTION

Decision:
Source code and project decisions live in GitHub. Secrets, production database, media, and source/browser sessions require separate protected storage/backups.

Target recovery objective:
**New machine/QNAP -> clone GitHub -> restore secrets -> restore database/storage -> install/build -> re-authenticate source sessions -> resume service.**

Facebook/source passwords and session cookies must not be committed to GitHub.

## 2026-08-26 - Bangkok Metro V1 operating focus

Status: APPROVED AND IMPLEMENTED IN PREVIEW

Decision:
- Customer Browse defaults to Bangkok Metro to reduce inspection/travel time and cost.
- Bangkok Metro includes Bangkok, Nonthaburi, Pathum Thani, Samut Prakan, Samut Sakhon, and Nakhon Pathom.
- Nearby provinces and All Thailand remain available as non-default filters. Out-of-area records are not deleted and direct Vehicle links remain valid.
- Primary mobile navigation is Browse, Saved, My Cases, Messages, and Account.
- Inspection is managed inside Vehicle Cases rather than occupying a primary navigation slot.
- Vehicle detail presents Check Availability as the recommended first step, Ask NK AI as the adjacent assistance action, and Save as a photo-level heart control.

## 2026-08-26 - Google Sheets + Drive staging system

Status: APPROVED AND IMPLEMENTED; RUNTIME CREDENTIAL PENDING

Decision:
- Google Sheets + Google Drive are the V1 staging and operating layer for reviewed inventory while the future QNAP database/storage runtime is being proven.
- The private Registry is authoritative for current staged vehicle/media publication state. It is not the durable Vehicle Case database and must never be public.
- NK reads Google data only on the server through a read-only service account. Customer pages receive customer-safe DTOs and first-party media-proxy URLs, never Google IDs, Drive URLs, source URLs, or seller data.
- The verified repository snapshot remains the deterministic availability fallback when Google credentials, schema, or network access fail.
- A Vehicle Case must snapshot the facts used at creation; later Sheet edits must not silently rewrite the historical case.
- Production activation requires Owner approval plus approved secret configuration. No Google credential may be committed to GitHub.

## 2026-08-26 - Google staging maintenance autonomy

Status: APPROVED

Decision:
- Codex may make routine, reversible improvements to the Google Sheet schema and Drive folder organization when they reduce operating errors or support the approved V1 flow.
- Stable vehicle/media identities, original evidence, audit history, privacy classification, and private sharing state must be preserved.
- Destructive deletion, irreversible migration, public sharing, or breaking schema changes remain subject to the existing Owner-approval rules.
- A `README` tab is the first Registry tab and documents the runtime tabs, publication rules, safe edit flow, privacy boundary, cache, identity rules, and preserved legacy tabs.

## 2026-08-27 - QNAP replaces Google as V1 inventory/media runtime storage

Status: APPROVED

Decision:
- QNAP PostgreSQL is the authoritative V1 runtime store for staged vehicle records.
- QNAP file/media storage is the authoritative V1 runtime store for customer-visible media and internal evidence.
- This supersedes the earlier decision that Google Sheets + Google Drive are the primary V1 runtime staging layer.
- Google Sheets + Google Drive are retained only as a controlled migration/import bridge or optional reporting/export surface. The bridge is disabled by default and requires explicit configuration.
- The verified repository snapshot remains a fail-safe availability fallback; it is not an editable production database and must be labelled non-live.

Application rules:
- Customer and domain logic continue through source/media adapters and must not depend directly on PostgreSQL columns or QNAP filesystem paths.
- QNAP API responses are rebuilt into an allowlisted customer DTO. Unknown fields, seller details, source URL, internal notes, and internal media references are discarded.
- Customer-visible and internal-only media remain physically and logically separated.
- Vehicle Cases keep historical snapshots; later inventory changes do not silently rewrite Case facts.

Infrastructure boundary:
- `codex/app` owns the application contracts and customer/Owner behavior.
- `codex/qnap-infrastructure` owns stable ingress, service deployment, secrets, backup/restore, monitoring, and storage operations.
- Production traffic cutover still requires Owner approval and a verified authentication/workspace migration.

## 2026-08-27 - nkautotrade.com Vercel delivery path

Status: APPROVED FOR OWNER SETUP AND STAGED ACTIVATION

Decision:
- `nkautotrade.com` is the intended stable customer-facing NK Cars domain.
- The Vercel project is separate from and must not overwrite the existing ChatGPT Site.
- Vercel may serve the customer web application while QNAP remains the authoritative inventory/media target behind authenticated application APIs.
- QNAP PostgreSQL and internal media must not be exposed directly through the public domain.
- Preview/build/mobile verification must pass before the domain is assigned to a production deployment.
- ChatGPT identity/D1 workspace behavior is not assumed to exist on Vercel; unsupported authenticated operations must fail safely until the approved workspace adapter is connected.

## 2026-08-27 - Second Ten-Vehicle Browse Approval

Status: APPROVED AND IMPLEMENTED IN VERIFIED FALLBACK

Decision:
- The Owner approved the remaining ten staged Toyota pickup records for customer Browse.
- Browse approval does not confirm current availability, source price, condition, model-year conflicts, transmission conflicts, or other unresolved facts.
- Customer media uses only reviewed selections. License plates and source/contact markings are redacted where required; original evidence remains internal and unchanged.
- Customer records continue to exclude seller identity/contact, source URL, internal notes, source cost/margin, storage identifiers, and full registration details.
- The repository fallback now contains 20 reviewed vehicles, including 16 in the Bangkok Metro operating group.
- QNAP publication-state synchronization remains an infrastructure handoff and must not be represented as complete until the QNAP Data API serves the updated states and customer-safe media.

## 2026-08-27 - Short public entry URL

Status: APPROVED

Decision:
- `https://nkautotrade.com/` is the single customer entry link and opens Buying Browser directly.
- The root redirects to `/buy`; existing deep links under `/buy/...` remain unchanged and valid.
- The legacy platform screen is not deleted and remains available through its existing internal route components as rollback/reference code.

## 2026-08-27 - Production identity and workspace boundary

Status: APPROVED APPLICATION CONTRACT; INFRASTRUCTURE ACTIVATION PENDING

Decision:
- Vercel must fail closed when no approved identity provider is configured and must not treat public `oai-authenticated-*` headers as trusted identity.
- Production QNAP identity uses an opaque, secure session validated server-to-server by the QNAP identity gateway. NK does not collect or store the identity-provider password.
- QNAP PostgreSQL is the target durable workspace store for Saved vehicles, Vehicle Cases, conversations, verification, quotation, and PI records.
- Application business rules remain deterministic and are revalidated at the adapter boundary. QNAP must enforce the same ownership, Revision, transaction, document-numbering, and append-only audit rules.
- The existing ChatGPT Site/D1 identity and workspace path remains rollback support and is not destructively migrated or removed.

## 2026-08-29 - Owner-approved marketplace UX refresh

Status: APPROVED FOR REVIEW SITE IMPLEMENTATION

Decision:
- Customer mobile navigation is Browse, Saved, Shipments, My Cases, and Account.
- Messages/conversation move into Vehicle Case context rather than remaining a primary customer navigation item.
- Browse should behave like a fast mobile marketplace: two vehicle cards per row on phones, 3-4 columns on larger screens, image-first cards, larger readable typography, and card content limited to price, key specs, location, reviewed/status badge, and Save.
- Saved vehicles become a shortlist that can support multi-select, comparison, and adding selected vehicles to a shipment.
- Shipment planning becomes a first-class customer flow for 1, 2, or 3 cars, with clear full-shipment and per-car planning estimates, savings messaging, and Request quote action.
- Shipping estimates remain Planning Estimates only and must stay separate from confirmed/final totals.

Shipping presentation rule:
- 1 car = shipment freight / 1.
- 2 cars = shipment freight / 2.
- 3 cars = (shipment freight + THB 25,000 Rushing/loading service) / 3.
- Use the configured FX rate. At the current configured preview FX of THB 35 = USD 1, THB 25,000 is approximately USD 714 per shipment or USD 238 per car when shared by 3 cars.

Boundaries:
- This approval is for presentation/UX and customer-visible flow only.
- Do not change QNAP infrastructure, Hermes runtime, Facebook automation, real payments, seller messages, destructive production data, or customer/internal privacy boundaries.
- Activating production identity/runtime secrets remains an Owner-controlled security action after the infrastructure endpoints are implemented and tested.

## 2026-08-27 - Google and Apple customer sign-in

Status: APPROVED PROVIDER DIRECTION; CREDENTIAL/INFRASTRUCTURE ACTIVATION PENDING

Decision:
- Customer identity may use Google and Apple through the QNAP identity gateway; NK Cars must not collect either provider's password.
- Start operational activation with Google. Apple remains supported and should be enabled after the required Owner Apple Developer configuration is available.
- The app sends only an allowlisted provider and safe return path. OAuth callbacks, token validation, account linking, role assignment, session rotation, and revocation remain deterministic gateway responsibilities.
- New social identities receive only the Customer role. Staff/Owner elevation requires a separate audited administrative action.
- Production remains fail-closed until the gateway, callback URLs, credentials, session cookie, and QNAP workspace isolation tests pass.

## 2026-08-27 - Owner-managed Hermes sourcing automation

Status: APPROVED APPLICATION CONTROL; QNAP/HERMES ACTIVATION PENDING

Decision:
- Owner may manage multiple sourcing rules from mobile, including brand/model, pickup body, year range, maximum source price, Bangkok Metro areas, keywords, priority, active state, daily candidate cap, weekdays, and Bangkok working hours.
- Owner commands are limited to Run Now, Pause, and Resume through an authenticated, audited QNAP API.
- V1 defaults to Toyota pickup, model optional, year 2020 onward, Bangkok Metro, and a target maximum of ten qualified retained candidates per day.
- Scheduler discovery never means verified availability and never authorizes automatic publication, seller messaging, reservation, payment, or purchase.
- Hermes must stop on Login Required, MFA, CAPTCHA, platform verification, rate limiting, or material account risk. It may not bypass source security controls.

## 2026-08-27 - Public Owner sourcing menu preview before account activation

Status: APPROVED AND IMPLEMENTED

Decision:
- Account may link to a public interactive preview of the Owner sourcing-rule menu while production identity remains unavailable.
- Preview input changes are temporary page state only. The preview receives no internal inventory, seller, customer, source, session, or Hermes runtime data.
- Save, Run Now, Pause, and Resume remain disabled in preview mode, and the authenticated Owner API remains the only mutation boundary.
- `/buy/owner` and `/buy/owner/sourcing` remain protected and must not be opened anonymously merely to simplify early review.

## 2026-08-27 - Sourcing command security and audit boundary

Status: IMPLEMENTED IN SOURCE; LIVE ACTIVATION PENDING

Decision:
- Owner rule mutations use optimistic revisions and append-only PostgreSQL audit events; rules and audit history cannot be physically deleted by the application role.
- Run Now, Pause, and Resume are persisted as idempotent commands with immutable rule snapshots and append-only lifecycle events.
- Owner/admin traffic and Hermes worker traffic use distinct bearer credentials. An absent worker credential disables worker endpoints instead of falling back to the admin credential.
- Public ingress is restricted to an explicit Data API allowlist through the QNAP web container. PostgreSQL, raw Data API ports, worker endpoints, tokens, browser sessions, and internal evidence remain private.
- Activation requires production Owner identity, stable authenticated HTTPS ingress, a separately provisioned worker secret, a compliant authenticated browser profile, and a functioning Hermes inference provider. No success state may be simulated while any dependency is absent.

## 2026-08-27 - Automated candidate retention boundary

Status: IMPLEMENTED IN SOURCE; LIVE STAGING RUN PENDING

Decision:
- Authorized sourcing results enter the existing inventory database as `NEEDS_REVIEW` with `customer_record = NULL`; automation cannot publish a vehicle or create a customer-visible price/availability claim.
- Source URL, seller, exact location, listing text, and unreviewed evidence remain internal-only. Customer DTOs continue to exclude them.
- Candidate retention is idempotent by connector candidate identity and deduplicated by canonical source reference. Only newly retained candidates count toward the rule's Bangkok-day limit.
- The Data API revalidates the candidate against the snapshotted Owner rule, including brand, year, price, keywords, pickup evidence, and Bangkok Metro location, instead of trusting the browser worker result.
- Permitted Facebook image URLs are downloaded with bounded size/type/redirect rules, decoded and re-encoded as JPEG, and written only to the internal QNAP media root. Missing media leaves an explicit review limitation and never blocks preservation of the candidate record.
- Worker, browser, and Data API credentials remain separate. The bridge stops on login/MFA/CAPTCHA/checkpoint/rate-limit conditions and cannot send seller messages, reserve, pay, purchase, or bypass source controls.

## 2026-08-27 - Phetchaburi Hermes pilot scope

Status: APPROVED FOR PILOT ONLY

Decision:
- Add Phetchaburi as an allowed Owner sourcing-rule location for the first Hermes QNAP activation pilot.
- Keep Bangkok Metro as the default customer Browse scope and default Owner sourcing rule.
- This approval does not open All Thailand sourcing or customer publication.
- The pilot remains limited to `NEEDS_REVIEW` candidate retention only.
- Seller messaging, reservation, purchase, payment, and automatic customer publication remain prohibited.

## 2026-08-27 - Marketplace-style mobile visual preview route

Status: OWNER APPROVED FOR ISOLATED PRODUCTION-DOMAIN REVIEW

Decision:
- Add a separate noindex visual preview route at `/preview/marketplace-style` so the Owner can review a lighter Marketplace-style mobile Browse/Detail direction from `nkautotrade.com`.
- The preview route must not replace `/buy`, change active customer workflows, mutate customer workspace data, or activate real sourcing, messaging, payment, QNAP, or Hermes behavior.
- The direction under review is image-first, price-forward, lower-text-density customer browsing with a simpler post-availability-check status before detailed quotation/pricing.

## 2026-08-27 - Marketplace-style mobile pass approved for active Browse and Detail

Status: APPROVED AND IMPLEMENTED

Decision:
- Apply the Marketplace-style visual direction to the active `/buy` Browse and Vehicle Detail customer screens.
- Keep the change visual and content-density focused: larger price/type hierarchy, less card metadata, full-width mobile Check Availability, shorter source-price disclosure, and compact mobile specification tiles.
- Do not change Vehicle Case business rules, pricing math, inspection workflow, localization data ownership, source adapter boundaries, QNAP/Hermes activation, payments, seller messaging, or production data behavior as part of this pass.

## 2026-08-27 - Active `/buy` aligned closer to Marketplace-style preview

Status: APPROVED AND IMPLEMENTED

Decision:
- Tighten the active customer Browse and Vehicle Detail mobile UI to better match the reviewed `/preview/marketplace-style` reference.
- Browse keeps real filters, save state, Paste Link, Ask NK AI, and customer-safe listings, but presents them with lighter controls, a `Vehicles for you` heading, image-first cards, and a simple price-verification pill.
- Vehicle Detail keeps the verified NK workflow and full desktop pricing disclosure, but mobile shows the shorter source-price explanation and brings Check Availability, Ask NK AI, and Request Inspection into the first action group.
- Hide bottom navigation only on mobile Vehicle Detail to avoid covering primary actions.
- No QNAP/Hermes activation, seller messaging, payment, purchase, publication, pricing math, or customer/internal data-boundary change is authorized by this visual alignment.

## 2026-08-27 - Mobile readability-first customer UI

Status: APPROVED AND IMPLEMENTED

Decision:
- Owner review on a real iPhone-sized browser showed the active customer UI still felt too small and dense.
- Prioritize readability over preserving a dense two-column marketplace grid on iPhone-sized screens.
- Browse now uses one-column vehicle cards on small phones, with larger photos, price/title/meta text, save controls, filters, and bottom navigation.
- Vehicle Detail and the main customer workflow surfaces inherit larger mobile typography and touch targets while preserving the approved NK workflow.
- This is a visual/readability change only. It does not change pricing math, source data, availability claims, Vehicle Case rules, inspection gates, QNAP/Hermes behavior, seller messaging, payment, purchase, or publication.

## 2026-08-28 - Facebook Marketplace-inspired Browse feed

Status: APPROVED AND IMPLEMENTED

Decision:
- Owner requested the Browse feed look closer to Facebook Marketplace.
- On small phones, Browse now uses a white, two-column feed with square photos, minimal card framing, price-first listing text, and compact location/mileage metadata.
- NK-specific controls remain where required: NK header, search/filter/sort, Save heart, customer-safe NK Selection state, Paste Link, Ask NK AI, and bottom navigation.
- This is an inspired layout treatment only, not a Facebook embed, proxy, login, scraping, or source-access change.
- No Vehicle Case workflow, pricing math, inspection behavior, QNAP/Hermes activation, seller messaging, payment, purchase, or publication behavior changes are authorized by this visual update.

## 2026-08-28 - Inspection and customer shipping-plan pricing rules

Status: APPROVED AND IMPLEMENTED

Decision:
- Inspection/travel pricing is now deterministic: Bangkok Metro starts at THB 5,000, and outside Bangkok Metro uses configured distance from Bangkok x THB 20 per km with THB 5,000 as the current minimum charge.
- Unknown vehicle locations remain Pending until NK configures or confirms the location. AI must not estimate inspection distance or fee.
- Customer Vehicle Case pricing now lets the customer choose destination country/port and shipment quantity from 1 to 3 cars.
- Destination country is required before calculation; if only shipment quantity is selected, the customer-facing Export / Shipping line prompts the customer to choose the country first.
- Customer screens may show public-source indicative ocean freight ranges as pre-booking estimates only. The customer-facing planning range keeps the public benchmark low end and adds a 15% planning buffer to the upper end so the possible booking movement is visible.
- Main export/ocean freight is still Pending for final quotation readiness until NK records an Owner-approved freight table, provider quote, or API result for the selected route. The customer-facing Export / Shipping line may show the selected route per-car planning range with an estimate label.
- Customer-facing shipping estimates are per-car: 1 car uses the full shipping estimate, 2 cars divide the shipping estimate by 2, and 3 cars divide the shipping estimate by 3.
- Customer-facing pricing uses the midpoint of the per-car planning range as the primary "about" number while keeping the low/high range visible in shipping details. The footer may show an estimated total with selected shipping, but other pending cost lines remain excluded and final quotation readiness is unchanged.
- Selecting 3 cars adds the approved THB 22,000 Rushing/loading/stuffing charge into the customer-facing Export / Shipping estimate, divides it by 3, and explains the approximate per-car share using the customer FX rate. The customer UI should make the shared-container logic visible before/while the quantity is selected, including a clear 3-car best-value label.
- Customer pricing should prompt the customer to fill the selected shipment with enough Vehicle Cases and provide direct Browse, Paste Link, and Ask NK AI paths. This prompt is a planning guide only and does not create a confirmed grouped shipment or final quote.
- This does not book shipping, send supplier/customer messages, confirm freight availability, accept payment, purchase a vehicle, or activate QNAP/Hermes behavior.

## 2026-08-28 - Owner-managed Hermes browser profiles

Status: APPROVED APPLICATION CONTROL; LIVE CONNECTOR ACTIVATION PENDING

Decision:
- Owner may manage multiple Hermes Facebook browser profiles from the authenticated Owner sourcing menu.
- The menu may list connector profiles, add a profile identifier/label, check session state, pause a profile, and ask the local connector to open a visible Facebook login browser window.
- NK Cars must not provide a web form for Facebook email, username, password, OTP, MFA code, cookies, or tokens.
- The account owner must enter Facebook credentials directly in the authorized browser/runtime screen. If that cannot be reached remotely, use an approved remote desktop/browser-screen channel rather than credential collection.
- Connector profile control remains fail-closed unless a server-side connector admin URL and token are configured. Secrets and browser sessions stay out of GitHub.
- This approval does not authorize publication, seller messaging, reservation, purchase, payment, CAPTCHA/MFA bypass, or rate-limit evasion.

## 2026-08-28 - Three-car Rushing/loading fee updated

Status: APPROVED AND IMPLEMENTED

Decision:
- The approved 3-car Rushing/loading/stuffing service charge is updated from THB 22,000 to THB 25,000.
- At the current customer preview FX of THB 35.00 = USD 1, the customer-facing estimate displays this as about USD 714 total, or about USD 238 per car when divided across 3 cars.
- The 1-car and 2-car shipping estimates do not include this Rushing/loading/stuffing service charge.

## 2026-08-28 - Shipment quote planner direction approved

Status: APPROVED AND IMPLEMENTED

Decision:
- Move the shipment quote planner preview direction into the active customer pricing UI.
- Customer pricing should show quote-size choices for 1, 2, and 3 cars with estimated per-car shipping amounts and a 3-car best-value cue.
- Selecting a quote size updates the planned shipment quantity and estimated total only. It does not issue a final quotation, book freight, accept payment, or create a confirmed grouped shipment without NK verification.

## 2026-08-28 - Fill-three-car shipment slots

Status: APPROVED AND IMPLEMENTED

Decision:
- Customer pricing should make the "fill the shipment" path concrete instead of showing only a numeric prompt.
- The Vehicle Case pricing UI now shows shipment slots for the selected 1/2/3-car target: existing Vehicle Cases, open add-car slots, and a current planned set total for the cases already in the plan.
- Empty slots link the customer back to Browse, Paste Link, or Ask NK AI so they can add more cars toward a three-car shipment.
- This slot planner remains customer planning UI only. It does not create a confirmed grouped shipment, issue a final quotation, book freight, take payment, send external messages, or purchase vehicles without NK verification.

## 2026-08-28 - Broader RHD-market destination coverage and transit disclosure

Status: APPROVED AND IMPLEMENTED

Decision:
- Expand customer shipping destination choices from a short route list into broader right-hand-drive / left-traffic target-market coverage.
- A listed destination is routing/planning coverage only. It does not guarantee legal import eligibility for the selected vehicle.
- If a destination is landlocked or normally requires transit, the customer UI must show the gateway/transit plan and explain that inland transit, border, clearing, and local delivery are separate until NK confirms an all-in route.
- If no reliable public freight benchmark is available, the country remains selectable but the freight estimate stays Pending / NK quote required rather than inventing a number.
- Strict-compliance markets such as Australia, New Zealand, Singapore, Japan, India, Malaysia, Hong Kong, Ireland, and the United Kingdom require import/compliance confirmation before final quotation.

## 2026-08-28 - Shipping estimates inherit approved benchmark groups

Status: APPROVED AND IMPLEMENTED

Decision:
- Supersede the prior Pending-only behavior for destinations without a route-specific public benchmark.
- Customer pricing may show a planning estimate for those destinations by inheriting the nearest approved benchmark group: Mombasa/East Africa gateway, Dar es Salaam/East Africa gateway, Southern Africa gateway, Asia RHD markets, Pacific/Indian Ocean RHD markets, or long-haul RHD markets.
- The UI must label the benchmark group and keep the source wording clear that this is a planning benchmark, not a live forwarder quote.
- Transit, border, clearing, local delivery, import approval, compliance, tax/duty, and registration costs remain separate until NK confirms the final route.

## 2026-08-28 - QNAP Hermes pilot reached safe zero-candidate result

Status: IMPLEMENTED OPERATIONS RUNBOOK; PILOT PROOF STILL INCOMPLETE

Decision:
- Keep the local QNAP Hermes pilot runbook in GitHub without secrets so the same reversible process can be rerun from the Owner PC.
- The runbook must prompt locally for QNAP SSH credentials, create a PostgreSQL backup first, use QNAP-stored tokens only at runtime, and tear down local connector/tunnel state after the run.
- The pilot run on 2026-08-28 successfully reached QNAP Data API and the authorized Facebook profile, then completed safely with `0` vehicles retained and `0` duplicates.
- Because no candidate vehicle ID was created, the activation request is not complete. Hermes must not be reported as proven for real sourcing until one qualifying Toyota Revo 2022 Phetchaburi candidate is retained as `NEEDS_REVIEW`.
- No publish, seller message, reservation, purchase, or payment command is authorized by this runbook or this result.
- Direct Owner-supplied Facebook URLs may be tested through the same backup-first, worker-token, audited-command boundary, but QNAP remains the final rule validator. The 2026-08-28 direct URL attempt was stopped safely because the supplied listing normalized as year `2024` with no confirmed Phetchaburi location, which does not satisfy the approved `Toyota Revo 2022 - Phetchaburi` pilot rule.

## 2026-08-28 - Hermes pilot rule widened to Bangkok Metro Revo 2020+

Status: OWNER APPROVED AND APPLIED ON QNAP

Decision:
- Replace the narrow `Toyota Revo 2022 - Phetchaburi` pilot with `Toyota Revo 2020+ - Bangkok Metro pilot`.
- The live QNAP rule now targets Toyota Revo pickup candidates from year 2020 through the current 2026 operating year.
- The approved search locations are Bangkok, Nonthaburi, Pathum Thani, Samut Prakan, Samut Sakhon, and Nakhon Pathom.
- Keep daily retained candidates capped at `1` for the pilot and keep all results in `NEEDS_REVIEW`.
- This widening does not authorize publication, seller messaging, reservation, purchase, payment, CAPTCHA/MFA bypass, or rate-limit evasion.
- QNAP rule `7412f2fb-fe79-4469-b36b-96d3c55daa3a` was updated from revision 1 to revision 2 after backup `/share/CACHEDEV6_DATA/nk-cars/backups/postgres/nk-cars-before-hermes-rule-update-20260828T102957Z.dump`.

## 2026-08-31 - Customer language and card price presentation

Status: OWNER APPROVED AND IMPLEMENTED

Decision:
- Customer-facing Buying Browser language selector now offers English and Thai only.
- Simplified Chinese is removed from the customer UI selector and stored customer UI language normalization falls back to English if an old Chinese value exists.
- English vehicle cards and detail pages prioritize USD estimate with THB as the secondary approximate source price.
- Thai vehicle cards and detail pages prioritize THB with USD as the secondary estimate.
- Customer Browse price filters follow the selected language: English inputs are USD and converted through configured FX; Thai inputs are THB.
- Short vehicle cards hide unknown compact specs such as unknown drive instead of showing text like `AT - Unknown`.

Boundaries:
- This changes customer presentation only. It does not change vehicle source records, pricing math, FX configuration, source evidence capture, QNAP/Hermes behavior, seller messaging, payments, or production data.
- Chinese text can still be preserved/detected as source evidence for audit or translation history, but it is not offered as a customer UI language.

## 2026-08-31 - Compact Browse card details

Status: OWNER APPROVED AND IMPLEMENTED

Decision:
- Customer Browse cards now show only the photo, NK status badge, Save heart, selected-language primary price, and vehicle year/make/model.
- Secondary converted price, compact transmission/drive specs, mileage, and location are removed from Browse cards to reduce visual density on mobile.
- Full vehicle facts remain available on Vehicle Detail and Vehicle Case screens.

Boundaries:
- This is a customer presentation change only. It does not remove underlying vehicle data, change search/filter logic, pricing math, Vehicle Case snapshots, QNAP/Hermes behavior, seller messaging, payments, or production data.

## 2026-09-01 - Jaklaen Candidate Intake V1 preview approved

Status: OWNER APPROVED FOR PREVIEW IMPLEMENTATION ONLY

Decision:
- Build Jaklaen Candidate Intake V1 on `codex/app` as a Preview workflow.
- Jaklaen may submit sourced vehicle candidates into NK Cars through an authenticated worker API.
- Every new candidate must enter `NEEDS_REVIEW` and must not publish automatically.
- Candidate payloads must preserve source URL, source platform, listing title, vehicle facts, source price, location, seller reference, description, image URLs, screenshot URLs, collected time, confidence, missing fields, and candidate status.
- Unknown data must be represented as `UNKNOWN` or `PENDING`; AI/worker output must not guess.
- Owner review must support field correction, comment/reason, Approve, Reject, and Need More Info.
- Every review change must be written to append-only audit records.
- Development may use TEST/MOCK fixtures when clearly labelled, but the final approval proof requires at least one real Toyota Hilux Revo candidate with full evidence.

Boundaries:
- No production deployment is authorized by this preview approval.
- No automatic publication, seller contact, payment, purchase, destructive migration, credential storage, or Facebook security bypass is authorized.

## 2026-09-01 - Jaklaen app-driven Search Queue V1 preview approved

Status: OWNER APPROVED FOR PREVIEW IMPLEMENTATION ONLY

Decision:
- Extend Jaklaen Candidate Intake V1 so Owner, Staff, or eligible Customer users can create `SEARCH_NOW` requests from the app.
- Extend the same workflow so Owner/Staff can create `STANDING_SEARCH` schedules with frequency, weekdays, active hours, source scope, priority, and vehicle criteria.
- App-created Search Requests must create or schedule Jaklaen queue jobs. Jaklaen receives jobs through a worker-token endpoint and returns candidates through the existing candidate intake boundary.
- Customer accounts may create `SEARCH_NOW` only for their own Case reference and may not edit company Standing Searches.
- Queue, review, and correction activity must be audited. Duplicate detection, rate limits, and candidate `NEEDS_REVIEW` defaults remain mandatory.

Boundaries:
- This approval is for Preview on `codex/app` only.
- No production deployment, automatic publish, seller contact, negotiation, reservation, purchase, payment, credential storage, CAPTCHA/MFA bypass, or account-risk workaround is authorized.
