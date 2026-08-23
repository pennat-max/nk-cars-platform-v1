# Codex V1 Implementation Plan

> Current direction: `docs/PRODUCT_PIVOT_BUYING_BROWSER.md` and `docs/BUYING_BROWSER_REBUILD_PLAN.md` supersede conflicting customer-facing milestone order in this earlier Live Broker plan. The adapter/profile/queue, authorization, verification, and downstream controls below remain valid implementation requirements.

This plan rebuilds NK Cars V1 without redesigning the approved mobile UI. It incorporates `docs/PRODUCT_DIRECTION_LIVE_BROKER.md`, which supersedes conflicting permanent-catalog sourcing assumptions in the Master Specification.

## Authoritative V1 Direction

The primary V1 product is a Live AI Broker:

Customer request -> structured requirements -> controlled authorized source search -> normalized candidates -> ranked customer-safe choices -> availability/price verification -> Lead/Wanted/Deal.

Published NK inventory, manual vehicle intake, photo/screenshot fallback, Waiting Review, and Marketplace remain valid. They are secondary operational paths rather than a requirement to permanently copy every live source result.

## Working Method

For every milestone:

1. Read the authoritative product direction, relevant Master Specification sections, and current source.
2. Add or update acceptance tests before changing behavior.
3. Implement the smallest vertical slice behind an isolated interface/route or feature flag.
4. Keep source adapters separate from NK business logic.
5. Verify Owner/Staff/Customer redaction and mobile behavior.
6. Record environment, data, migration, risk, and rollback impact.
7. Run relevant tests, typecheck, lint, build, and mobile/browser checks before commit/push.
8. Do not configure production secrets, deploy, overwrite the existing Site, or public-publish without explicit Owner approval.

## Milestone 0 - Decisions And Repository Baseline

Deliverables:

- Confirm production hosting, Supabase region/project, durable queue/worker, and error monitoring.
- Confirm authorized Facebook session/compliance approach and accountable profile owner.
- Confirm browser profile encryption/key ownership, reconnect process, and approved network/tunnel boundary.
- Confirm search-rate policy, sourcing areas, snapshot/media retention, availability freshness, AI model/budget, and permitted source-image handling.
- Confirm Auth invitations, customer auth posture, and production secret ownership.
- Keep branch protection, CI, environment matrix, and executable acceptance IDs current.

Exit gate: no unresolved decision blocks private implementation; existing Site remains untouched.

## Milestone 1 - Next.js Shell And Visual Parity

Status: initial route-level slice implemented.

Deliverables:

- Strict TypeScript App Router shell and internal/public route groups.
- Existing design tokens, header, cards, badges, bottom navigation, responsive breakpoints, demo fixtures, and mobile flows.
- Screenshot/mobile parity tests.

Exit gate: approved screens render from real routes with no redesign or demo-data change.

## Milestone 2 - V1-LB1 Authorized Source Search Foundation

Status: smallest next V1 milestone.

Deliverables:

- Versioned interfaces for `SourceAdapter`, `BrowserProfileManager`, `SearchQueue`, `SearchRequest`, `SearchRun`, and source-first `CandidateResult`.
- Profile registry architecture supporting one V1 profile without hard-coding a permanent single-profile limit.
- Profile states: `Ready`, `Login Required`, `Paused`, and `Error`.
- FIFO queue with concurrency one, conservative rate limits, timeout/cancellation, stop-on-verification, and safe run telemetry.
- Local Playwright/Chrome adapter using a dedicated persistent profile and manual human login/re-login.
- No automated password entry, MFA/CAPTCHA bypass, stealth, fingerprint spoofing, proxy rotation, or limit evasion.
- Facebook search/listing/gallery fixture adapter and optional Owner-authorized live smoke test.
- Existing `MARKETPLACE_CONNECTOR_URL` server boundary retained for later private HTTPS connectivity.
- Normalized internal candidate output without automatically creating a permanent Vehicle/public listing or copying all media.

Exit gate:

- A structured fixture request runs through the queue and produces multiple normalized candidate records.
- Login/checkpoint fixture stops safely as `Login Required`.
- Concurrency, rate, timeout, cancellation, URL policy, authentication, and redaction tests pass.
- Browser fixture, existing app tests, typecheck, lint, and build pass.
- No production environment/configuration or deployment changes.

## Milestone 3 - V1-LB2 Customer Search To Candidate Preview

Deliverables:

- Mobile natural-language and structured search request using the existing visual system.
- Deterministic requirement schema for brand/model, year, transmission, drive, body/cab, mileage, budget, area/radius, and keyword rules.
- Hard-requirement preservation and explicit Unknown/Conflict handling.
- Search progress backed by the controlled queue.
- Candidate normalization and concise customer-safe English translation.
- Ranking that considers hard fit, freshness, source reliability, price, profitability, and operational convenience.
- Customer result view showing approximately 3-5 useful choices when available.
- `Interest` and `Check Availability` actions, without claiming verified stock.
- Seller/source/contact/source-cost/margin/internal-note redaction tests.

Exit gate: private mobile flow completes request -> queued search -> ranked candidates -> interest/availability request using deterministic fixtures or an explicitly authorized session.

## Milestone 4 - Auth, Tenancy, Durable Broker Data, And Storage

Deliverables:

- Supabase Auth SSR integration using a pinned/current package API.
- Organizations, individual members, Owner/Staff roles, and least-privilege authorization.
- Reviewed migrations for sourcing rules, browser-profile metadata, search requests/runs, candidates/sources/matches, snapshot policy, vehicles, images, imports, AI provenance, customers, inquiries, leads, wanted requests, and activity events.
- Profile metadata only in the database; browser passwords/cookies never stored in ordinary business rows.
- RLS, explicit grants, cross-tenant tests, repository layer, internal/customer-safe DTOs, and demo isolation.
- Private snapshot/evidence media and approved public derivative Storage boundaries.
- Durable queue state, idempotency, retries, and run recovery.

Exit gate: Owner/Staff/public and cross-tenant access tests pass; a search run and candidates survive worker/app restart without duplicate records.

## Milestone 5 - Candidate Intelligence, Deduplication, And Snapshot Policy

Deliverables:

- Whole-listing text/image extraction with confidence, provenance, evidence, alternatives, and conflicts.
- English normalization that presents facts rather than copying source text wholesale.
- Manual correction locks and correction history.
- Duplicate matching across source listing ID/URL, VIN/registration when available, image similarity, model/year/color, mileage, seller, text, and location.
- Confident multi-source candidate merge; uncertain duplicate review.
- Policy-driven snapshot triggers for qualified interest, verification, quote/deal, reservation, purchase, or audit need.
- Multi-photo/screenshot fallback preserved and persisted for operational snapshots.

Exit gate: exact/possible duplicate, unknown/conflict, non-overwrite, snapshot-trigger, and source-disappearance fixtures pass.

## Milestone 6 - Location Cost And Verification Workflow

Deliverables:

- Configurable deterministic base/nearby/distant province and transport/travel/inspection rate tables.
- Internal acquisition-cost calculation separated from public/customer price.
- Candidate states: Found/Unverified, Availability Check Requested, Verified Available, Price Changed, Possibly Unavailable, Reserved, and Sold.
- Seller inquiry preparation with human review/send in the initial version.
- Current price/availability evidence, timestamp, actor, and method.
- No AI-invented costs, availability, ETA, discounts, or commercial commitments.

Exit gate: location-cost fixtures and availability/price change workflows produce correct internal economics and customer-safe states.

## Milestone 7 - Owner Control, Waiting Review, Marketplace, CRM, And Rules

Deliverables:

- Mobile Sourcing Rules including rule name, platform, keywords, area/radius, priority, active state, and assigned profile.
- Owner attention for Login Required, restrictions, candidate exceptions, duplicates, stale verification, and price changes.
- Candidate-to-Waiting Review transition when an opportunity becomes operationally important.
- Owner-only approve/publish/reject and safe public projection.
- Marketplace as a mix of NK-approved opportunities, recently verified vehicles, sold/history examples, and appropriate customer-specific matches.
- Inquiry, Lead, Wanted Request, stages, dashboard KPIs, and immutable activity events.

Exit gate: candidate interest -> verification -> Lead/Wanted -> Owner review -> approved Marketplace opportunity works without internal-data leakage.

## Milestone 8 - NK AI Sales

Deliverables:

- One customer-facing NK AI Assistant using only authorized customer-safe data.
- Search/compare candidate tools, current-order context, Inquiry/Lead creation, and Wanted fallback.
- Guardrails for price, shipping, discount, availability, seller identity, and internal financial data.
- Rate/cost/PII retention controls and prompt-injection/data-leak tests.

Exit gate: customer conversation creates the correct search/interest/Lead/Wanted records and never invents commercial facts.

## Milestone 9 - Operational Reliability And Secondary Inventory

Deliverables:

- Search scheduling for active rules within conservative authorized limits.
- Profile reconnect runbook and queue pause/resume controls.
- Source freshness monitoring and snapshot/media lifecycle.
- Published/reserved/sold inventory parity, sold-history display, and source-change attention.
- Metrics for search success, candidates, rejection reasons, login-required events, duplicates, verification conversion, and lead conversion.

Exit gate: source outage/session expiry does not corrupt candidates, create false availability, or block manual screenshot/text fallback.

## Milestone 10 - Full V1 Hardening And Private Handoff

Deliverables:

- Complete executable acceptance matrix for Live Broker and preserved manual/public flows.
- Physical iPhone/Android, accessibility, browser, performance, cost, and queue/load tests.
- RLS/Storage/SSRF/secrets/public-projection/log security review.
- Observability, alerts, kill switches, backup/restore, incident, migration, and rollback rehearsal.
- Current architecture/data/AI/profile/reconnect/deployment runbooks.

Exit gate: private production-like preview proves the full sourcing loop. Production deployment and Site overwrite still require explicit Owner approval.

## V2-V5 Boundary

- V2: Dealer network/reverse marketplace, dealer trust, scheduled intelligent sourcing, legitimate profile-pool resilience, and controlled seller automation.
- V3: Quotes/PI, negotiation approval, payment controls, Purchase Fund legal gate, Auto-Buy, deposits/refunds, trust/referral, and purchase approval.
- V4: Procurement, payment/handover, inspection, repair/modification, export/shipping, delivery, and after-sales.
- V5: 360 views, event-driven employee operations/KPI, Owner command center, audit/risk, documents/search, reporting, P&L, and forecasts.

Do not build V2-V5 merely because their interfaces must remain possible.

## Required Issue Fields

Every implementation issue states:

- User-visible behavior.
- Roles and redaction boundary.
- Domain state/invariant.
- Source adapter/profile/queue impact where relevant.
- Data migration/RLS/Storage impact.
- Error/fallback behavior.
- Tests and demo impact.
- Rollback/feature flag.

## Primary Risks

| Risk | Impact | Required mitigation |
|---|---|---|
| Facebook UI/access changes | Search/import becomes intermittent | Adapter isolation, fixtures, profile health, queue pause, screenshot/text fallback |
| Session expires or is challenged | Search jobs cannot continue | `Login Required`, manual reconnect, no automated credential/checkpoint bypass |
| Too many searches on one profile | Restrictions or account risk | Concurrency one, conservative rate limits, scheduling, stop/alert behavior |
| Source listing changes/disappears | Customer choice or deal evidence is lost | Freshness labels and policy-triggered NK snapshot |
| Ordinary results become permanent inventory | Storage/legal/operational burden | Separate Candidate and Vehicle models; explicit snapshot/publish transitions |
| AI misreads or translates facts | Incorrect customer information | Evidence/confidence/conflict, deterministic hard rules, correction locks, verification |
| Location costs are guessed | Incorrect pricing/profit | Verified deterministic zone/rate tables only |
| Customer sees seller/source/cost | Commercial/privacy harm | Customer-safe DTOs, RLS, response inspection, prompt-injection tests |
| Staff bypasses Owner/material approval | Unauthorized commitment | Server transitions, deterministic approval policy, immutable activity |
| Long synchronous browsing times out | Poor mobile reliability | Durable controlled queue and progress polling/realtime |
