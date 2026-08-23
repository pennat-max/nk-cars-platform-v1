# Codex Implementation Plan

This plan rebuilds NK Cars V1 for production without redesigning it. Keep the current private prototype available as a parity oracle until the final cutover.

## Working method

For every milestone:

1. Read the relevant handoff section and current prototype source.
2. Write/adjust acceptance tests before changing behavior.
3. Implement the smallest vertical slice behind a feature flag or isolated route.
4. Verify Owner/Staff/Customer and mobile behavior.
5. Compare to the current private UI.
6. Record migrations, environment changes, risks, and rollback.
7. Request Owner review for any visible change.

## Milestone 0 — decisions and repository baseline

Deliverables:

- Confirm production hosting, Supabase region/projects, durable job/workflow provider, and error monitoring.
- Confirm Facebook connector compliance/authorized-session approach.
- Confirm Auth invitation flow, public/customer auth posture, retention, availability freshness threshold, publication-required fields, and AI budget/model policy.
- Create GitHub repo/branch protection, environment matrix, CI skeleton, `.env.example`, and secret ownership.
- Capture baseline mobile screenshots of every current screen and important state.
- Turn `ACCEPTANCE_TESTS.md` into executable test IDs/fixtures.

Exit gate: no unresolved decision blocks Milestones 1–3; private prototype unchanged.

## Milestone 1 — Next.js shell and visual parity

Deliverables:

- Standard strict-TypeScript Next.js App Router scaffold.
- Internal/public route groups and layouts from `PRODUCTION_ARCHITECTURE.md`.
- Port current design tokens/CSS, header, cards, badges, bottom navigation, and responsive breakpoints.
- Port all screens using the current demo fixture service only.
- Add screenshot/mobile parity tests.

Do not connect production data yet. The goal is route-level parity without visual redesign.

Exit gate: current screens/flows render from real URLs and visual parity is Owner-reviewed.

## Milestone 2 — Auth, tenancy, database, and Storage foundation

Deliverables:

- Supabase Auth SSR session integration using a pinned/current package API.
- Organizations and membership roles.
- Reviewed migrations for the schema in `DATA_MODEL.md`.
- RLS, explicit grants, helper functions, and pgTAP role/cross-tenant tests.
- Private originals/evidence and public derivative Storage boundaries/policies.
- Repository layer and typed internal/public DTOs.
- Demo tenant fixtures and protected Reset Demo isolation.

Exit gate: Owner/Staff/public isolation, cross-tenant denial, and Storage access tests pass.

## Milestone 3 — durable vehicle operations

Deliverables:

- Inventory, Vehicle Detail, Waiting Review, Vehicle 360, and source management backed by PostgreSQL.
- Blank New and record-isolated Edit behavior.
- Manual source and listing-text intake.
- Selling price, GP, markup, source verification, cheapest verified default source.
- Server-authorized state transitions and immutable activity events.
- Safe public marketplace projection and optimized published images.

Exit gate: manual Add → Waiting Review → Owner publish → public Marketplace works without AI/connector and leaks no internal fields.

## Milestone 4 — production multi-photo intake

Deliverables:

- Create/recover intake drafts.
- Mobile multi-select of at least 30 images plus additional batches.
- Direct private Storage uploads, progress/retry, validation.
- Thumbnail derivatives, reorder, cover, delete.
- Image provenance/checksums/perceptual hash preparation.
- Persisted photo state across reload/device session.

Exit gate: physical iPhone and Android checklist passes.

## Milestone 5 — AI vehicle extraction

Deliverables:

- Versioned whole-evidence extraction schema/service.
- OpenAI multimodal structured output and safe errors.
- Field confidence/status/evidence/alternatives.
- OCR/screenshot support.
- Evidence priority and conflict logic.
- Blank-only merge, user correction locks, feedback records.
- Durable rate limits, cost caps, metrics, provider kill switch.

Exit gate: AI fixtures for exact, unknown, low-confidence, conflict, and non-overwrite pass.

## Milestone 6 — Facebook Marketplace connector and jobs

Deliverables:

- `MarketplaceConnector` interface and authorized Browserless adapter or approved replacement.
- URL normalization/validation/SSRF controls.
- Durable import job state machine, worker, progress polling/realtime, idempotency/retry.
- Bounded listing metadata/evidence/image capture into owned Storage.
- `connector_required`, `login_required`, unavailable/blocked, partial, and retry states.
- Immediate fallback that preserves URL and continues through screenshot/photo/text extraction.
- Connector health UI for Owner without exposing secrets/provider internals.

Exit gate: successful fixture, partial fixture, blocked fallback, job restart, and duplicate-tap tests pass. No fake import success.

## Milestone 7 — duplicate detection and attention queue

Deliverables:

- Exact source/VIN/listing/image fingerprint signals.
- Possible Duplicate scoring/reasons/version.
- Owner resolution/merge service with history preservation.
- Source price change and unavailable monitoring hooks.
- Dashboard Need Your Attention items and deep links.
- Wanted/vehicle hot match groundwork.

Exit gate: exact merge, possible duplicate, default source, price-change, and unavailable tests pass.

## Milestone 8 — CRM, Wanted, sourcing rules, and dashboard

Deliverables:

- Customer, Inquiry, Lead, Wanted, and Sourcing Rule persistence.
- Lead/Wanted stages and activity.
- Six dashboard KPI aggregates.
- Hot match records/attention.
- Meta integration-ready state only.

Exit gate: all current operational screens use real data and stage/status changes persist securely.

## Milestone 9 — NK AI Sales

Deliverables:

- Vehicle-aware customer assistant using public-safe tools/DTOs.
- Requirement capture, Inquiry/New Lead creation, Wanted fallback.
- Guardrails for price, shipping, discount, availability, and sensitive data.
- Conversation/cost/rate limit/PII retention controls.
- Prompt-injection and public-data leakage tests.

Exit gate: customer question → Inquiry/Lead → dashboard flow passes with all prohibited behaviors tested.

## Milestone 10 — full parity, operational hardening, and private handoff

Deliverables:

- Execute the complete `ACCEPTANCE_TESTS.md` matrix.
- Performance/load/cost tests for 30-image import and Marketplace.
- Accessibility/mobile/browser test pass.
- Observability dashboards/alerts, runbooks, kill switches.
- Backup/restore and incident/rollback rehearsal.
- Data migration plan if any prototype/demo-derived records need promotion.
- Security review of RLS, Storage, SSRF, secrets, public projection, logs, and webhooks.
- Updated architecture/data/AI/runbook docs.

Exit gate: private production preview demonstrates the Definition of Done. Do not make it public until the Owner explicitly approves.

## Recommended issue breakdown

Each milestone can be split into bounded issues with these labels:

- `parity-ui`
- `domain`
- `database-migration`
- `rls-security`
- `storage-images`
- `marketplace-connector`
- `ai-extraction`
- `ai-sales`
- `jobs-observability`
- `mobile-e2e`
- `owner-decision`

Every issue should state:

- User-visible behavior preserved/added.
- Roles affected.
- Domain transition/invariant.
- Data migration/RLS impact.
- Error/fallback behavior.
- Tests and demo impact.
- Rollback/feature flag.

## Risks to track

| Risk | Impact | Required mitigation |
|---|---|---|
| Facebook changes UI/access behavior | Link import fails intermittently | Connector abstraction, fixtures, health status, immediate screenshot/text fallback |
| Authorized profile expires | Import login-required | Owner-only reconnect runbook; never automate login credentials |
| 30 high-resolution mobile photos | Memory/upload/latency | Direct uploads, concurrency limits, derivatives, progress/retry |
| AI hallucinates or conflicts | Incorrect inventory facts | Evidence/status schema, Unknown/Conflict, user locks, Owner review |
| Client or public query leaks internal data | Commercial/privacy harm | Safe projection, RLS/grants, response inspection tests |
| Staff bypasses Owner approval | Unauthorized publication | Server transition + Owner role + database policy/transaction |
| Demo data contaminates production | Operational mistakes | Dedicated demo tenant/fixtures and protected reset |
| Long synchronous imports time out | Poor mobile reliability | Durable jobs and polling/realtime |
| Duplicate listings create duplicate vehicles | Operational/customer confusion | Idempotency, exact merge, possible duplicate queue |
| Vendor/package APIs change | Build/auth failures | Pin versions, check official changelogs/docs per milestone |

## Explicitly deferred work

Do not expand the milestone scope into Payment, Purchase Fund, Auto-Buy, banking, purchase/repair/shipping execution, dealer portal, employee KPI, fraud detection, full ERP, or a full pricing engine. Add interfaces/placeholders only when required to keep future integration boundaries clean.

