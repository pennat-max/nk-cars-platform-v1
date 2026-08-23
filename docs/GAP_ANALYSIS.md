# NK Cars Gap Analysis

Status: current implementation compared with the authoritative Buying Browser direction
Date: 2026-08-23
Branch: `codex/buying-browser-rebuild`

## Source Of Truth

Conflict priority for current V1 work:

1. Explicit current Owner instruction.
2. `docs/PRODUCT_PIVOT_BUYING_BROWSER.md` for the customer-facing V1 Buying Browser.
3. `docs/PRODUCT_DIRECTION_LIVE_BROKER.md` for authorized live sourcing, adapters, profiles, queueing, and candidate controls.
4. `docs/MASTER_SPECIFICATION.md` for non-conflicting rules and downstream V2-V5 operations.
5. Existing acceptance, architecture, handoff, and implementation documents.

The pivot changes V1 from a stock-first dealership experience to an AI-assisted vehicle buying browser. Existing inventory/review/lead and downstream operational modules remain rollback/reference and future building blocks; they are not deleted.

## Approved V1 Journey

Browse supported Thai sources, paste a vehicle link, or ask NK AI to find a vehicle -> inspect a customer-safe source result -> Save Vehicle -> create an NK Vehicle Case -> translate/normalize facts -> request current availability/price -> show deterministic service pricing -> request inspection -> retain case conversation/history -> continue toward a controlled Buy Through NK workflow.

Important states must remain factual: `Live Market Result`, `Found in Thailand`, `Availability Not Yet Confirmed`, `Verified Available`, and `NK Secured` are not interchangeable.

## Current Implementation

Reusable and working:

- Existing responsive Next.js/Vinext shell, route-level stock/review/lead/wanted demo flows, extraction, photo review, and customer redaction.
- Hybrid link import: public metadata first, optional connector, then screenshot/photo/text fallback.
- Customer-safe English vehicle descriptions based only on available evidence.
- Local Playwright connector foundation with a versioned source-adapter contract, dedicated persistent browser profiles, manual login, safe login/checkpoint stop states, concurrency-one FIFO queue, limits/timeouts/cancellation, and deterministic browser fixtures.
- Existing `MARKETPLACE_CONNECTOR_URL` server boundary and safe provider-error handling.
- Rollback/reference commit `61d4bc8` on `codex/production-rebuild`.

Not yet complete at this analysis point:

- Additive Buying Browser customer routes and account shell.
- Browse/search/filter/location and saved-vehicle experience.
- Vehicle Case persistence and customer/internal DTO separation.
- Paste Link integrated into the new case workflow.
- Case-linked Ask NK AI, availability request, messages/history, deterministic pricing, and inspection quote/request.
- Owner/internal source/case view.
- Production Auth, tenancy, database, RLS, Storage, durable queue, source-session isolation, and real external integrations.

## V1 Remaining Work

### Customer Buying Browser

- NK customer account shell and mobile navigation.
- Marketplace-style Browse with text search, year, price, mileage, location, transmission, drive, body/cab filters, pagination/infinite-loading boundary, and saved results.
- Customer-safe detail with normalized English facts and no misleading NK-owned/verified claims.
- Paste Vehicle Link through a source adapter plus open-source/share/screenshot fallback.
- Ask NK AI to Find One with hard-requirement preservation and grounded results.

### Vehicle Case And Assisted Workflow

- Persistent case identifiers and deduplicated Save behavior.
- Customer-safe case DTO separate from seller/source/internal DTO.
- Availability-check request, prepared translation, verification state, case timeline, and messages/history.
- Deterministic price structure: vehicle price, configurable commission, inspection/travel, domestic transport, repair, export/shipping, and other agreed costs.
- Deterministic inspection/travel quote and request state distinct from accepted/completed state.
- Owner/internal case source view and attention states.

### Source And Production Foundation

- Complete customer-specific source-profile isolation before real multi-user access.
- Source adapters beyond Facebook and a policy-compliant production connector network path.
- Live result normalization, ranking, freshness, duplicate matching, and operational snapshot policy.
- Supabase Auth, individual accounts, tenant membership, least-privilege RBAC, RLS, durable schema, Storage visibility, idempotency, and immutable material-action audit.
- Durable jobs, observability, retries, alerts, kill switches, backup, and restore.
- Production AI provider/model, structured extraction/translation, cost policy, retention, and grounded-response evaluation.

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
- Real customer-specific source sessions require an approved encrypted session-storage design and manual user authentication.
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

## Current Milestone

**BB-V1A - Additive Buying Browser Foundation** is the smallest safe rebuild milestone.

Scope:

- Add `/buy` customer shell without changing the production root.
- Implement customer-safe Browse/search/filters/location, saved state, detail, and Save -> Vehicle Case.
- Add source-adapter web contracts and labeled realistic fixtures.
- Separate customer DTOs from internal seller/source facts.
- Keep legacy routes, data, `.openai/hosting.json`, and existing Site association unchanged.

Exit gate:

- Browse-to-case works at iPhone viewport and persists across reloads.
- Search/filter and duplicate-save behavior pass tests.
- Customer rendered data passes source/seller/contact/cost/margin redaction checks.
- Existing regression tests, Buying Browser tests, typecheck, lint, build, and `git diff --check` pass.
- No production deployment, Site overwrite, secret change, paid service, or real message occurs.

After BB-V1A, continue with BB-V1B (Paste/AI/availability/pricing/inspection/history) and BB-V1C (owner view, privacy/accessibility, mobile preview hardening) as defined in `docs/BUYING_BROWSER_REBUILD_PLAN.md`.
