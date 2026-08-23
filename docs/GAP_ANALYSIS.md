# NK Cars Gap Analysis

Status: current implementation compared against `docs/MASTER_SPECIFICATION.md`  
Date: 2026-08-23  
Branch: `codex/production-rebuild`

## Source Of Truth

This analysis uses `docs/MASTER_SPECIFICATION.md` as the authoritative product specification, per Owner instruction. Chat messages that contained truncated Master Specification text are ignored for this analysis.

Current authoritative scope in the repository:

- Sections 0-25 are preserved in `MASTER_SPECIFICATION.md` as accepted binding requirements by index/summary, pending full text consolidation.
- Sections 26-46 are present in detail.
- Sections 47 and later are not currently present in `MASTER_SPECIFICATION.md`; they are not used as requirements in this gap analysis until merged into the repository document by Owner-approved source-of-truth update.

## Current Implementation Snapshot

Implemented:

- Mobile-first prototype shell preserved.
- Internal/public route groups and route-level parity for the existing demo UI.
- Demo fixture driven screens for dashboard, vehicles, review, marketplace, leads, wanted, sourcing rules, and more.
- Basic client-side domain helpers for profit, markup, default source, and text extraction.
- Prototype Marketplace import API abstraction with safe fallback responses.
- Prototype AI extraction API using an evidence-first structured response contract when `OPENAI_API_KEY` is configured.
- Basic rendered HTML tests for root and route entry points.

Not implemented:

- Production Auth, tenant membership, RBAC, database migrations, RLS, Storage policies, repository layer, durable jobs, production persistence, production audit, or production customer/dealer/employee portals.

## V1 Remaining Work

V1 target from the current Master Specification:

Sourcing Rules -> vehicle import -> AI extraction -> duplicate detection -> Waiting Review -> Owner approval -> Publish -> Marketplace -> customer inquiry / AI sales -> Lead / Wanted Request -> Owner Dashboard.

Remaining V1 foundation:

- Supabase Auth SSR integration with pinned/current package API.
- Organization and membership model.
- Owner/Internal Staff authorization.
- PostgreSQL schema migrations for organizations, vehicles, images, sources, drafts, import jobs, AI extraction provenance, duplicate candidates, customers, inquiries, leads, wanted requests, sourcing rules, and activity events.
- RLS, explicit grants, helper functions, and cross-tenant denial tests.
- Storage buckets and policies for private originals/evidence and public approved derivatives.
- Repository layer with typed internal DTOs and public-safe DTOs.
- Demo tenant fixtures and protected Reset Demo isolation.

Remaining V1 vehicle operations:

- Durable vehicle records instead of demo fixtures.
- Durable intake drafts.
- Manual source/listing-text intake.
- Waiting Review backed by database state.
- Owner-only Approve & Publish / Reject transitions.
- Vehicle source management and cheapest verified default-source selection.
- Source verification status and Last Verified tracking.
- Internal pricing calculations for source cost, selling price, gross profit, and markup.
- Server-side state transition invariants and activity events.

Remaining V1 import and AI:

- Persistent import job state machine.
- Marketplace connector idempotency, retry, progress status, and safe failure states.
- Screenshot/photo fallback persisted into draft evidence.
- Multi-photo mobile intake for at least 30 images, including upload progress, reorder, delete, choose cover, and add more later.
- Whole-vehicle AI extraction from images plus listing text/URL evidence.
- Field confidence, status, evidence, alternatives, and conflicts.
- Human correction locks and correction history so AI cannot overwrite confirmed values.
- Rate limits, cost caps, metrics, and AI/provider kill switch.

Remaining V1 duplicate and availability:

- Exact source URL/listing/VIN/image hash duplicate checks.
- Possible Duplicate scoring with reasons and Owner resolution.
- Merge service that preserves source/image/evidence history.
- Availability watch statuses: Verified, Price Changed, Possibly Unavailable, Verification Required.
- Review triggers for abnormal price changes.

Remaining V1 customer-facing flow:

- Safe Marketplace projection that never exposes source cost, seller identity, source URL, internal margin, full VIN/registration, or internal notes.
- Customer inquiry form persistence.
- NK AI Assistant public-safe tool/data layer.
- AI requirement capture into Inquiry, Lead, or Wanted Request.
- Guardrails preventing invented availability, shipping price, discounts, or financial changes.
- Owner Dashboard KPIs and Need Your Attention items backed by real data.

## V2 Remaining Work

- Dealer Portal account and verification preparation.
- Dealer vehicle submission, photo upload, price/availability updates, own-vehicle view, and sales history.
- Dealer availability confirmations.
- Sanitized Wanted Request distribution to eligible dealers.
- Dealer offers, AI matching/ranking, and Owner shortlist approval.
- Seller/Dealer Trust Score with internal raw score, simplified dealer-visible level, improvement suggestions, suspension/blacklist workflow, audit evidence, and High Risk Opportunity override.
- Automated availability monitoring and controlled seller communication.

## V3 Remaining Work

- Quote and Proforma Invoice workflow with USD sales currency and stored FX rate.
- Negotiation approval workflow with approved floors/counteroffers and material-change invalidation.
- Payment Reported vs Finance Confirmed payment controls.
- Order balance/payment status.
- Purchase Fund architecture, ledger separation, reserves, release/refund behavior, and legal gate before real activation.
- Auto-Buy Rules with customer-authorized limits.
- Seller hold/deposit controls and Finance-confirmed refund recovery.
- Customer Trust Score and Priority Buyer benefits.
- Customer referral system and future dealer referral system.
- Multi-vehicle Purchase Approval screen with unresolved-warning exclusion.

## V4 Remaining Work

- Procurement routing and Manager-confirmed AI assignment recommendations.
- Route optimization for multi-stop pickup work.
- Mobile Pre-Purchase Check with evidence capture and mismatch stop points.
- Purchase payment control separating Owner approval, employee check, Finance payment, seller receipt, and handover.
- Vehicle Secured requirements and customer notification.
- One-trip procurement with remote pre-verification and exact approval reuse.
- Vehicle inspection checklist and evidence.
- Repair/Modification Jobs for internal and outsourced work.
- Owner approval for outsourced commitment/payment and cost overruns.
- Major unexpected issue stop workflow.
- Repair completion evidence and customer-safe work visibility.
- Ready For Export notification.
- Export/Shipping Job with provider, ports, costs, booking, vessel, container, ETD/ETA, documents, and status.
- Customer shipping tracking with Pending for unknown data.
- Delivery completion lifecycle through Customer Received Vehicle, Completed, and After-sales.
- After-sales feedback, case creation, and explicit marketing permission.

## V5 Remaining Work

Based on the roadmap already preserved in Sections 0-25:

- Business operating system modules: Vehicle 360, Customer 360, Dealer 360, Order 360.
- Employee workflow and role-specific operations.
- KPI reporting.
- Fraud/anomaly detection.
- Immutable audit expansion beyond V1 activity events.
- Reporting and forecasts.
- Owner AI Command Center.
- Daily Brief, Evening Summary, Weekly Review, and Monthly Management P&L.

## Technical Blockers

- Supabase project details, region, environment variables, and secret ownership are not configured in the repo.
- Database migrations are not written; `db/schema.ts` is intentionally empty.
- `.openai/hosting.json` points to the existing Sites project and must be preserved.
- Production deploy is blocked by Owner approval requirement.
- Auth package/API versions must be checked immediately before implementation.
- Storage bucket names, retention rules, derivative image pipeline, and backup strategy need implementation decisions.
- Marketplace/Facebook import depends on compliant authorized integration/session/fallback design; hidden brittle scraping is not acceptable.
- Durable job provider/queue approach is not implemented.
- AI model, API key ownership, cost caps, retention policy, and kill switch need configuration.
- Acceptance tests are currently shallow rendered HTML tests; DB/RLS/storage/mobile/API/security tests are missing.

## Legal / Business / Integration Blockers

- Purchase Fund and real customer-held balances require Thai legal/banking/payment-regulatory review before activation.
- Real customer/seller messaging requires consent, channel policy, and Owner approval before sending.
- Seller deposit/hold payments need Finance controls and recovery process before real money use.
- Facebook/Meta integration must respect platform rules and authentication boundaries.
- Shipping/carrier integration requires approved provider/API access before automation.
- Marketing testimonial/media use requires explicit customer permission.

## Smallest Next V1 Milestone

Recommended next milestone: Milestone 2A - Auth, Tenant, And Schema Foundation.

Scope:

- Add Supabase dependencies only after confirming package versions.
- Create `.env.example` entries for Supabase URL/keys and storage buckets without real secrets.
- Implement initial Drizzle/PostgreSQL schema for organizations, organization_members, vehicles, vehicle_images, vehicle_sources, vehicle_drafts, import_jobs, vehicle_ai_extractions, duplicate_candidates, customers, inquiries, leads, wanted_requests, sourcing_rules, and activity_events.
- Add migration generation/check workflow.
- Add repository interfaces and DTO boundaries without replacing the demo UI yet.
- Add focused tests for schema/domain invariants that can run locally without production credentials.

Exit gate:

- Schema compiles.
- Migration generation works.
- Tests pass.
- No UI redesign.
- No production deployment.
- Existing ChatGPT Site project and `.openai/hosting.json` remain unchanged.

Owner approval requested before coding this milestone.
