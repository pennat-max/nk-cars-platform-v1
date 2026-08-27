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
