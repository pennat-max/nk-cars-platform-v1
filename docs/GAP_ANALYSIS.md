# NK Cars Gap Analysis

Status: Buying Browser V1 preview complete; production and external integration gaps remain
Date: 2026-08-24
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

Buying Browser V1 preview completed on 2026-08-24:

- Additive customer routes and account shell under `/buy`; the existing root remains unchanged.
- Browse, Saved, detail, search, sort, Thai location, year, price, mileage, transmission, drive, and body filtering.
- Customer-safe normalized English facts, eight labeled realistic demo source results, and source/customer DTO separation.
- Paste Link through the existing import boundary plus open-source, up-to-30-photo, listing-text, and manual-review fallback.
- Deduplicated Vehicle Cases, availability requests, case timeline, My Cases, messages/history, grounded NK AI preview responses, deterministic pricing, and deterministic inspection/travel requests.
- Separate Owner/internal demo view and customer redaction tests.
- Manual browser verification at 390 x 844 and 1280 x 900 with no horizontal overflow or console errors.

## V1 Production Activation Remaining

The approved Buying Browser V1 preview acceptance criteria are complete. The following are production gaps and external integrations, not simulated preview features:

### Identity, Persistence, And Operations

- Supabase Auth or an approved equivalent, individual customer accounts, organization membership, least-privilege RBAC, and tenant isolation.
- Durable Vehicle Case, saved-vehicle, conversation, timeline, pricing, inspection, and source-reference storage with RLS, idempotency, audit, backup, and restore.
- Private media storage, file visibility, signed access, retention, deletion, and evidence policy.
- Durable jobs, observability, retries, alerts, kill switches, production rate limits, and operational support controls.

### Live Sources And AI

- Complete customer-specific source-profile isolation before real multi-user access.
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

## Milestone Status And Next Step

- `BB-V1A - Additive Buying Browser Foundation`: Complete.
- `BB-V1B - Assisted Buying Workflow`: Complete.
- `BB-V1C - Internal View And Preview Hardening`: Complete.

The smallest next V1 production milestone is **BB-V1D - Production Identity And Durable Cases**:

- connect the approved Auth/database project without changing the production root;
- add organization membership and customer identity;
- persist saved vehicles, Vehicle Cases, timeline, and conversations under tenant-scoped RLS;
- add material-action audit and private media/storage boundaries;
- retain the current source adapter, customer DTO, pricing, and inspection contracts.

BB-V1D is blocked on approved production project/configuration and must not deploy, replace the existing ChatGPT Site, enable real messages, or activate commercial pricing without the corresponding Owner approvals.
