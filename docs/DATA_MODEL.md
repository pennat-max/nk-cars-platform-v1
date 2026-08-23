# Production Data Model and Authorization

Target: PostgreSQL hosted by Supabase, Supabase Auth, and Supabase Storage. This is a logical schema for implementation; generate reviewed SQL migrations and database tests rather than copying ad hoc statements into production.

## 1. Conventions

- Primary keys: UUID, generated server-side.
- Every business record carries `organization_id` unless it is truly global.
- Money: integer THB (`bigint`) to avoid floating point rounding.
- Timestamps: `timestamptz` in UTC.
- Human stock/reference numbers are unique within an organization, not global primary keys.
- Mutable rows include `created_at`, `updated_at`, and optionally `version` for optimistic concurrency.
- Soft deletion is allowed only where audit/history requires it; public queries explicitly exclude archived records.
- External payloads and AI outputs use bounded `jsonb`, but core searchable/filterable fields are typed columns.
- Full VIN/chassis, seller contacts, source URLs, cost, margin, and internal notes are sensitive internal data.

## 2. Enums

Recommended database enums or constrained text values:

- `organization_role`: `owner`, `internal_staff`
- `vehicle_status`: `draft`, `waiting_review`, `published`, `reserved`, `sold`, `rejected`
- `public_availability`: `available`, `reserved`, `sold`
- `source_status`: `verified`, `needs_verification`, `unavailable`
- `source_platform`: `facebook_marketplace`, `manual`, `other`
- `ai_field_status`: `extracted`, `need_review`, `conflict`, `unknown`
- `import_status`: `queued`, `fetching_listing`, `downloading_images`, `analyzing`, `review_ready`, `needs_user_evidence`, `login_required`, `retryable_failure`, `failed`, `cancelled`
- `lead_stage`: `new`, `qualified`, `vehicle_selected`, `availability_check`, `closed`
- `wanted_status`: `searching`, `matched`, `customer_reviewing`, `closed`
- `rule_priority`: `normal`, `high`, `urgent`
- `duplicate_status`: `possible`, `confirmed_same`, `confirmed_different`, `deferred`
- `inquiry_channel`: `marketplace_form`, `nk_ai`, `wanted_form`, `staff`, `whatsapp`, `other`
- `actor_type`: `user`, `customer`, `ai`, `system`, `integration`

Keep UI labels exactly as the prototype, translating normalized database values in the presentation layer.

## 3. Identity and tenancy

### `organizations`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Tenant boundary |
| `name` | text | `NK Cars` initially |
| `slug` | citext/text unique | Stable tenant handle |
| `is_demo` | boolean | Explicit demo isolation |
| `settings` | jsonb | Bounded tenant configuration |
| `created_at`, `updated_at` | timestamptz | Audit |

### `organization_members`

| Column | Type | Notes |
|---|---|---|
| `organization_id` | uuid FK | Composite PK part |
| `user_id` | uuid FK to `auth.users` | Composite PK part |
| `role` | organization_role | Owner or Staff |
| `active` | boolean | Revocation switch |
| `display_name` | text nullable | Internal display only |
| `created_at`, `updated_at` | timestamptz | Audit |

Constraints/indexes:

- PK `(organization_id, user_id)`.
- Index `(user_id, active)`.
- Ensure at least one Owner through an administrative workflow; do not attempt a fragile single-row constraint.

Authorization uses this table or trusted app metadata. Never use user-editable profile/user metadata as the source of role truth.

## 4. Vehicle aggregate

### `vehicles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Internal identity |
| `organization_id` | uuid FK | Required tenant scope |
| `stock_no` | text | Unique per organization |
| `status` | vehicle_status | Lifecycle |
| `brand`, `model` | text nullable | Normalized display facts |
| `year` | smallint nullable | Vehicle/model year |
| `grade` | text nullable | Trim/grade |
| `engine` | text nullable | Engine description/code |
| `engine_capacity_cc` | integer nullable | Typed capacity |
| `transmission` | text nullable | AT/MT or normalized value |
| `drive_type` | text nullable | 2WD/4WD/unknown |
| `body_type`, `cab_type` | text nullable | Public specs |
| `mileage_km` | integer nullable | Non-negative |
| `color` | text nullable | Public spec |
| `vin_chassis` | text nullable | Sensitive internal field |
| `registration_year` | smallint nullable | Separate from model year |
| `registration_plate` | text nullable | Sensitive internal field |
| `selling_price_thb` | bigint nullable | Manual V1 price |
| `last_sold_price_thb` | bigint nullable | Public for sold record |
| `sold_at` | timestamptz nullable | Render month/year |
| `export_destination_country` | text nullable | Sold display |
| `cover_image_id` | uuid nullable | Deferred FK to image |
| `default_source_id` | uuid nullable | Deferred FK to source |
| `availability_verified_at` | timestamptz nullable | Sales guardrail |
| `published_at`, `rejected_at` | timestamptz nullable | Lifecycle timestamps |
| `rejection_reason` | text nullable | Internal |
| `ai_summary` | text nullable | Internal, derived |
| `created_by`, `updated_by` | uuid nullable | Auth user IDs |
| `version` | integer | Optimistic concurrency |
| `created_at`, `updated_at`, `archived_at` | timestamptz | Audit |

Constraints/indexes:

- Unique `(organization_id, stock_no)`.
- Checks for valid years, non-negative mileage/prices, and sold metadata consistency.
- Index `(organization_id, status, updated_at desc)`.
- Index `(organization_id, brand, model, year)`.
- Search index over normalized brand/model/grade/body; add trigram/full-text only after measuring.
- Do not expose this table directly to anonymous clients.

Gross profit and markup are derived from the selected source cost and selling price. Prefer a server query/view or generated calculation; do not let a client-written profit value become authoritative.

### `vehicle_images`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Image identity |
| `organization_id`, `vehicle_id` | uuid FK | Scope/parent |
| `source_id` | uuid nullable | Listing-source relation |
| `storage_bucket`, `storage_path` | text | Private/original object |
| `public_storage_path` | text nullable | Published derivative if used |
| `origin` | text | upload/listing/screenshot/document |
| `position` | integer | Reorder |
| `is_cover` | boolean | Exactly one preferred cover per vehicle |
| `mime_type` | text | Validated |
| `byte_size`, `width`, `height` | integer | Validation/processing |
| `sha256` | text | Exact duplicate signal |
| `perceptual_hash` | text nullable | Visual duplicate signal |
| `ocr_text` | text nullable | Sensitive, internal evidence |
| `created_by`, `created_at`, `deleted_at` | uuid/timestamps | Audit |

Indexes/constraints:

- Unique `(vehicle_id, position)` among active images.
- Partial unique index ensuring one active cover per vehicle, or enforce in a transaction.
- Index on `sha256`; similarity-specific index if using a perceptual-hash extension.

### `vehicle_sources`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Source identity |
| `organization_id`, `vehicle_id` | uuid FK | Scope/parent |
| `platform` | source_platform | Facebook/manual/other |
| `source_name` | text nullable | Dealer/listing source, internal |
| `source_url` | text nullable | Sensitive/internal |
| `external_listing_id` | text nullable | Dedup/idempotency |
| `source_listing_text` | text nullable | Imported/pasted evidence |
| `source_seller` | text nullable | Sensitive/internal |
| `source_price_thb` | bigint nullable | Internal cost |
| `location` | text nullable | Listing location |
| `status` | source_status | Verification state |
| `is_default` | boolean | Transactionally consistent |
| `imported_at`, `last_verified_at` | timestamptz nullable | Source freshness |
| `last_price_changed_at` | timestamptz nullable | Attention trigger |
| `raw_evidence_ref` | text nullable | Protected object/path |
| `created_by`, `created_at`, `updated_at` | uuid/timestamps | Audit |

Indexes/constraints:

- Unique partial `(organization_id, platform, external_listing_id)` when listing ID is known.
- Unique normalized source URL when safe/practical.
- Index `(vehicle_id, status, source_price_thb)` for cheapest verified selection.
- Non-negative price check.

Default-source selection is a domain service/transaction: select the lowest-price verified source; if none exists, select the lowest-price usable source and keep a verification warning.

## 5. Drafts, imports, and AI provenance

### `vehicle_drafts`

Durable intake workspace before submission.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Draft identity |
| `organization_id` | uuid FK | Scope |
| `vehicle_id` | uuid nullable FK | Present when editing/exact duplicate |
| `created_by` | uuid FK | Owner/Staff |
| `source_url`, `source_platform` | text/enum nullable | Preserved even on failure |
| `active_values` | jsonb | Bounded draft field snapshot |
| `field_locks` | jsonb | Manual correction lock map |
| `cover_image_id` | uuid nullable | Intake cover |
| `submitted_at`, `expires_at` | timestamptz nullable | Lifecycle |
| `version`, `created_at`, `updated_at` | int/timestamps | Concurrency/audit |

Core vehicle facts are copied into typed `vehicles` columns on submission. Draft JSON is not the production query model.

### `import_jobs`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Job/correlation ID |
| `organization_id`, `vehicle_draft_id` | uuid FK | Scope/context |
| `requested_by` | uuid FK | Actor |
| `platform` | source_platform | Connector |
| `source_url`, `normalized_source_url` | text | Original + idempotency |
| `external_listing_id` | text nullable | Stable external ID |
| `status` | import_status | State machine |
| `safe_reason_code` | text nullable | Client-safe result |
| `retryable` | boolean | Worker policy |
| `attempt_count` | integer | Bounded retries |
| `connector_name`, `connector_version` | text nullable | Provenance |
| `raw_evidence_ref` | text nullable | Private bounded artifact |
| `idempotency_key` | text | Unique per operation scope |
| `started_at`, `completed_at`, `next_retry_at` | timestamptz nullable | Orchestration |
| `created_at`, `updated_at` | timestamptz | Audit |

Indexes:

- Unique `(organization_id, idempotency_key)`.
- Index `(status, next_retry_at)` for workers.
- Index `(organization_id, normalized_source_url, created_at desc)`.

### `vehicle_ai_extractions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Extraction run |
| `organization_id`, `vehicle_draft_id` | uuid FK | Scope/context |
| `vehicle_id`, `import_job_id` | uuid nullable FK | Links |
| `requested_by` | uuid nullable | User or system |
| `provider`, `model` | text | Provenance |
| `prompt_version`, `schema_version` | text | Reproducibility |
| `status` | text | queued/running/succeeded/failed |
| `input_evidence_ids` | uuid[]/jsonb | Bounded references |
| `result` | jsonb | Strict schema output |
| `safe_error_code` | text nullable | No raw provider leak |
| `input_tokens`, `output_tokens`, `image_count` | integer nullable | Cost/quality |
| `latency_ms`, `estimated_cost` | numeric nullable | Observability |
| `started_at`, `completed_at`, `created_at` | timestamptz | Audit |

### `vehicle_field_evidence`

Optional normalized layer for review UI and analytics.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Field observation |
| `organization_id`, `extraction_id` | uuid FK | Scope/run |
| `vehicle_draft_id`, `vehicle_id` | uuid nullable FK | Context |
| `field_name` | text | Whitelisted field |
| `proposed_value` | jsonb | Typed by app schema |
| `confidence` | smallint | 0–100 |
| `status` | ai_field_status | Review contract |
| `evidence_refs`, `alternatives` | jsonb | Bounded arrays |
| `is_active` | boolean | Latest applied proposal |
| `created_at` | timestamptz | Audit |

### `vehicle_corrections`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Feedback event |
| `organization_id`, `vehicle_id` | uuid FK | Scope/record |
| `vehicle_draft_id`, `extraction_id` | uuid nullable FK | Context |
| `field_name` | text | Whitelisted |
| `old_value`, `new_value` | jsonb | Before/after |
| `corrected_by` | uuid FK | Owner/Staff |
| `reason` | text nullable | Optional |
| `evidence_refs` | jsonb | Related evidence |
| `created_at` | timestamptz | Immutable |

## 6. Duplicate detection

### `duplicate_candidates`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Candidate pair |
| `organization_id` | uuid FK | Scope |
| `vehicle_id`, `candidate_vehicle_id` | uuid FK | Ordered/canonicalized pair |
| `score` | numeric | Versioned score |
| `reasons` | jsonb | VIN/image/spec/source signals |
| `detector_version` | text | Reproducibility |
| `status` | duplicate_status | Owner decision |
| `resolved_by`, `resolved_at` | uuid/timestamptz nullable | Audit |
| `resolution_note` | text nullable | Owner note |
| `created_at`, `updated_at` | timestamptz | Audit |

Unique canonical vehicle pair. Confirming same vehicle calls a reviewed merge service that reassigns sources/images/evidence and preserves activity; never delete history blindly.

## 7. Customers, inquiries, leads, and wanted requests

### `customers`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Customer identity |
| `organization_id` | uuid FK | Scope |
| `name`, `company` | text nullable | CRM basics |
| `email`, `phone`, `whatsapp` | text nullable | Sensitive PII |
| `country`, `default_port` | text nullable | Requirement context |
| `created_at`, `updated_at` | timestamptz | Audit |

Add normalized contact indexes or hashed lookup as needed; do not expose the table publicly.

### `inquiries`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Inquiry identity |
| `organization_id`, `customer_id` | uuid FK | Scope/customer |
| `vehicle_id`, `wanted_request_id` | uuid nullable FK | At least one context or free requirement |
| `channel` | inquiry_channel | Source |
| `country`, `port` | text nullable | Captured requirement |
| `quantity` | integer | Default 1, positive |
| `budget_thb` | bigint nullable | Clarify currency if not THB |
| `requirement_text` | text nullable | Sanitized customer request |
| `availability_requires_verification` | boolean | AI guardrail |
| `conversation_ref` | text nullable | Protected external/thread ID |
| `created_at` | timestamptz | Audit |

### `leads`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Pipeline item |
| `organization_id`, `customer_id` | uuid FK | Scope/customer |
| `primary_inquiry_id` | uuid nullable FK | Origin |
| `vehicle_id`, `wanted_request_id` | uuid nullable FK | Interest |
| `stage` | lead_stage | Pipeline |
| `assigned_user_id` | uuid nullable FK | Organization member only |
| `country`, `port`, `quantity`, `budget_thb` | typed | Fast list/query fields |
| `last_activity_at` | timestamptz | Sort |
| `closed_reason` | text nullable | Internal |
| `created_at`, `updated_at` | timestamptz | Audit |

Indexes `(organization_id, stage, last_activity_at desc)` and `(assigned_user_id, stage)`.

### `wanted_requests`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Requirement identity |
| `organization_id`, `customer_id` | uuid FK | Scope/requester |
| `status` | wanted_status | Searching lifecycle |
| `model`, `year_from`, `year_to` | typed | Requirement |
| `transmission`, `drive_type`, `body_type` | text nullable | Requirement |
| `max_mileage_km` | integer nullable | Requirement |
| `color` | text nullable | Requirement |
| `quantity` | integer | Positive |
| `budget_thb` | bigint nullable | Requirement |
| `country`, `port` | text | Destination |
| `created_by_user_id` | uuid nullable | Internal creator when present |
| `created_at`, `updated_at`, `closed_at` | timestamptz | Audit |

Optional `wanted_vehicle_matches` table stores scored vehicle matches, hot flag, review state, and versioned reasons.

## 8. Sourcing rules

### `sourcing_rules`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Rule identity |
| `organization_id` | uuid FK | Scope |
| `brand`, `model` | text nullable | Target |
| `year_from`, `year_to` | smallint nullable | Range |
| `maximum_source_price_thb` | bigint nullable | Ceiling |
| `transmission` | text nullable | AT/MT |
| `drive_type` | text nullable | 2WD/4WD |
| `body_type` | text nullable | Target |
| `maximum_mileage_km` | integer nullable | Ceiling |
| `color`, `province_area` | text nullable | Target |
| `required_keywords`, `excluded_keywords` | text[] | Matching terms |
| `priority` | rule_priority | Normal/High/Urgent |
| `active` | boolean | On/off |
| `created_by`, `updated_by` | uuid | Audit |
| `created_at`, `updated_at` | timestamptz | Audit |

Owner controls mutation. Meta ingestion remains an adapter/placeholder in V1.

## 9. Activity log

### `activity_events`

Append-only event/audit timeline.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Event identity |
| `organization_id` | uuid FK | Scope |
| `entity_type`, `entity_id` | text/uuid | Vehicle, lead, wanted, import, etc. |
| `actor_type` | actor_type | User/customer/AI/system/integration |
| `actor_user_id`, `customer_id` | uuid nullable | Actor link |
| `action` | text | Versioned action code |
| `summary` | text | Safe timeline text |
| `metadata` | jsonb | Bounded safe delta/context |
| `correlation_id` | uuid/text nullable | Job/request trace |
| `created_at` | timestamptz | Immutable |

Indexes `(organization_id, entity_type, entity_id, created_at desc)` and `(organization_id, created_at desc)`. Prevent normal users from updating/deleting events.

## 10. Safe public projection

Create a deliberately restricted `public_marketplace_vehicles` view/materialized projection or server-only query DTO with only:

- public ID/slug/stock number
- public status/availability
- brand, model, year, grade when approved
- engine, capacity, transmission, drive, body/cab, mileage, color
- NK selling price
- sold price/month/year/destination when sold
- published public image URLs/order/cover
- masked VIN/chassis and registration only when explicitly approved for display
- public summary

It must not contain joins/columns for sources, source price, seller, source URL, cost, profit, full VIN/plate, AI raw evidence, internal notes, or activity metadata.

PostgreSQL views can run with definer behavior depending on configuration. Use a security-invoker view where appropriate or expose the projection only through trusted server code/RPC with tested policies. Do not assume a view automatically enforces the underlying caller's policies.

## 11. RLS and privileges

RLS design principles:

- Enable RLS on every table in an exposed schema.
- Revoke broad default privileges and grant only required operations.
- `authenticated` means signed in, not authorized. Every policy checks active organization membership and role where required.
- Owner-only operations check `organization_members.role = 'owner'` in a trusted helper/function or policy.
- Staff insert/update is organization-scoped and excludes Owner-only lifecycle transitions. Prefer stored procedures/domain functions for critical transitions.
- Update operations need appropriate `SELECT`, `USING`, and `WITH CHECK` coverage.
- Anonymous users cannot read internal tables. Public marketplace/inquiry endpoints use safe server routes/projections with strict validation.
- Service-role use is limited to trusted server jobs and bypasses RLS; never place it in browser/mobile code.
- `activity_events` is insert-through-trusted-service and select organization-scoped; normal users cannot mutate history.
- Cross-organization foreign keys are prevented by application transactions and, where feasible, composite FK/constraints.

Test policies with pgTAP or equivalent for Owner, Staff, unrelated authenticated user, anonymous, customer/public, and service worker. Include data-leak assertions, not only expected successes.

## 12. Storage layout and policy

Recommended buckets/boundaries:

- `vehicle-originals-private` — uploaded/imported originals, screenshots, documents, OCR evidence; signed internal access only.
- `vehicle-public` — approved derivatives for published/reserved/sold marketplace display.
- `import-evidence-private` — bounded raw connector evidence and diagnostics.

Object paths start with organization and aggregate IDs, for example:

`{organization_id}/{vehicle_or_draft_id}/{image_id}/original.jpg`

Storage policies validate active membership against the path/metadata. Upsert semantics require the necessary select/insert/update policies; do not assume one insert policy is enough. Use `owner_id` rather than deprecated ownership columns for ownership-aware policies.

Database backups do not include Storage objects. Define separate object versioning/backup/retention and verify restore procedures.

## 13. Server-side domain functions

Critical mutations should be explicit application services/transactions, for example:

- `submitVehicleDraft(draftId, actor)`
- `approveAndPublishVehicle(vehicleId, expectedVersion, owner)`
- `rejectVehicle(vehicleId, reason, owner)`
- `setVehicleAvailability(vehicleId, status, actor)`
- `markVehicleSold(vehicleId, soldData, owner)`
- `selectDefaultSource(vehicleId)`
- `mergeVehicleSource(existingVehicleId, sourceId, owner)`
- `resolveDuplicate(candidateId, decision, owner)`
- `applyVehicleCorrection(vehicleId, field, value, actor)`
- `createInquiryAndLead(input)`
- `changeLeadStage(leadId, stage, actor)`

Each validates authorization, invariants, optimistic version, and writes activity in one transaction.

## 14. Official implementation references

- [Supabase server-side authentication for Next.js](https://supabase.com/docs/guides/auth/server-side)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Choosing a Supabase Auth server package](https://supabase.com/docs/guides/auth/choosing-a-server-package)

At implementation time, re-check the current Supabase changelog and package APIs. The `@supabase/ssr` package has been documented as beta/unstable, so pin a tested version and avoid copying outdated helper signatures.

