# Jaklaen Vehicle Sourcing Center V1

Status: Owner-approved plan for Preview implementation on `codex/app`.

Production deployment is not approved until the Owner reviews the Preview and explicitly approves promotion.

## Goal

Owner should control Jaklaen vehicle sourcing directly from the NK Cars Admin App without asking Codex or the web engineer to start each search.

The app should expose a Vehicle Sourcing Center that creates Search Requests, queues Search Jobs for Jaklaen, receives real vehicle Candidates, and keeps every Candidate in `NEEDS_REVIEW` until Owner/Staff review rules allow the next workflow step.

## Sourcing Work Types

### 1. SCHEDULED SEARCH

Purpose:
- Recurring search controlled by Owner/Staff from Admin App.
- Jaklaen searches on a configured schedule.

Owner/Staff controls:
- Active on/off.
- Start time and stop time.
- Frequency.
- Vehicle model/year/price/location criteria.
- Result quantity target.
- Priority.
- Pause/Resume/Run Now.

Default gate:
- Jobs can be queued automatically when the schedule is active and within active hours.

### 2. OWNER SEARCH

Purpose:
- Owner manually presses "สั่งจั๊กแล่นค้นหา" from Admin App.
- Job goes to the Search Job Queue immediately.

Owner controls:
- Criteria.
- Quantity required.
- Priority.
- Sources.
- Case/customer reference if relevant.

Default gate:
- Immediate queue after Owner submits.

### 3. CUSTOMER SEARCH

Purpose:
- Customer submits a sourcing request from the public/customer website for their own Vehicle Case.
- The request becomes visible in Admin App.

Owner control:
- Owner can choose per configuration:
  - `QUEUE_IMMEDIATELY`: send to Jaklaen immediately.
  - `OWNER_APPROVAL_REQUIRED`: wait for Owner approval before queueing.

V1 default:
- `OWNER_APPROVAL_REQUIRED`

Reason:
- Prevent spam.
- Prevent too many worker jobs.
- Preserve Owner control over source risk, daily volume, and customer expectations.

## Admin App Pages

Vehicle Sourcing Center should contain:

1. Dashboard งานค้นหา
2. New Search button
3. Scheduled Searches
4. Customer Requests
5. Search Job Queue
6. Candidate Review
7. Pause / Resume / Run Now controls
8. Search History and Audit Log

## Data Schema

### `jaklaen_search_requests`

Represents the business request created from app, schedule, Owner, Staff, or Customer.

Fields:
- `id`: uuid primary key.
- `request_id`: customer/operator-facing stable ID, for example `JSR-2026-000001`.
- `request_source`: `SCHEDULE`, `OWNER`, or `CUSTOMER`.
- `request_type`: `SCHEDULED_SEARCH`, `OWNER_SEARCH`, or `CUSTOMER_SEARCH`.
- `approval_status`: `NOT_REQUIRED`, `PENDING_OWNER_APPROVAL`, `APPROVED`, `REJECTED`.
- `status`: `DRAFT`, `QUEUED`, `RUNNING`, `COMPLETED`, `PAUSED`, `BLOCKED`, `FAILED`.
- `criteria_json`: normalized search criteria.
- `priority`: `normal`, `high`, or `urgent`.
- `schedule_json`: nullable schedule configuration.
- `quantity_required`: integer.
- `candidate_count`: integer default `0`.
- `requested_by_json`: actor role/id/email or customer-safe reference.
- `customer_case_reference`: nullable case ID/reference.
- `customer_request_policy`: `QUEUE_IMMEDIATELY` or `OWNER_APPROVAL_REQUIRED`.
- `created_at`: timestamptz.
- `last_run_at`: timestamptz nullable.
- `next_run_at`: timestamptz nullable.
- `error_code`: nullable safe blocker/error code.
- `blocker_message`: nullable safe message.
- `active`: boolean.
- `updated_at`: timestamptz.

### `jaklaen_search_jobs`

Represents the executable unit Jaklaen claims.

Fields:
- `id`: uuid primary key.
- `job_id`: worker-facing stable ID, for example `JSJ-2026-000001`.
- `request_id`: foreign key to `jaklaen_search_requests.id`.
- `request_source`: `SCHEDULE`, `OWNER`, or `CUSTOMER`.
- `status`: `DRAFT`, `QUEUED`, `RUNNING`, `COMPLETED`, `PAUSED`, `BLOCKED`, `FAILED`.
- `priority`: `normal`, `high`, or `urgent`.
- `request_snapshot_json`: immutable copy of criteria, source, schedule, quantity, and permissions when the job was queued.
- `worker_id`: nullable.
- `candidate_count`: integer default `0`.
- `created_at`: timestamptz.
- `claimed_at`: timestamptz nullable.
- `last_run_at`: timestamptz nullable.
- `next_run_at`: timestamptz nullable.
- `completed_at`: timestamptz nullable.
- `error_code`: nullable safe blocker/error code.
- `blocker_message`: nullable safe message.

### `jaklaen_candidates`

Candidate records may reuse the existing inventory/candidate intake storage if it already preserves the fields below. A separate table is optional only if needed for normalized review indexing.

Minimum fields:
- Source URL.
- Source platform.
- Listing title.
- Make.
- Model.
- Grade.
- Year.
- Transmission.
- Engine/Fuel.
- Drive type.
- Color.
- Mileage.
- Source price.
- Location.
- Seller reference.
- Description.
- Images.
- Screenshot.
- Collected time.
- Confidence.
- Missing fields.
- Candidate status.

Required default:
- `candidate_status = NEEDS_REVIEW`

Unknown rule:
- Unknown factual values must be `UNKNOWN` or `PENDING`.
- Jaklaen must not guess.

### `jaklaen_sourcing_audit_events`

Append-only audit log for requests, jobs, candidate intake, and review actions.

Fields:
- `id`: uuid primary key.
- `request_id`: nullable.
- `job_id`: nullable.
- `candidate_id`: nullable.
- `actor_type`: `OWNER`, `STAFF`, `CUSTOMER`, `WORKER`, or `SYSTEM`.
- `actor_reference`: safe ID/email/worker ID.
- `action`: controlled audit action.
- `old_value_json`: nullable.
- `new_value_json`: nullable.
- `safe_detail_json`: customer-safe/internal-safe detail without secrets.
- `created_at`: timestamptz.

Audit actions:
- `REQUEST_DRAFTED`
- `CUSTOMER_REQUEST_SUBMITTED`
- `OWNER_APPROVED_CUSTOMER_REQUEST`
- `OWNER_REJECTED_CUSTOMER_REQUEST`
- `JOB_QUEUED`
- `JOB_CLAIMED`
- `JOB_RUNNING`
- `JOB_COMPLETED`
- `JOB_PAUSED`
- `JOB_RESUMED`
- `JOB_BLOCKED`
- `JOB_FAILED`
- `CANDIDATE_RETURNED`
- `CANDIDATE_FIELD_EDITED`
- `CANDIDATE_APPROVED`
- `CANDIDATE_REJECTED`
- `CANDIDATE_NEED_MORE_INFO`

## Search Criteria Contract

All work types use one criteria shape:

```json
{
  "make": "Toyota",
  "model": "Hilux Revo",
  "grade": "UNKNOWN",
  "yearFrom": 2020,
  "yearTo": 2026,
  "transmission": "AT",
  "engineFuel": "Diesel",
  "driveType": "UNKNOWN",
  "color": "Any",
  "maxPriceThb": 850000,
  "maxMileageKm": 120000,
  "location": "Bangkok Metro",
  "radiusKm": 120,
  "quantityRequired": 3,
  "sources": ["facebook_marketplace", "facebook_group"]
}
```

## Schedule Contract

Used only by `SCHEDULED_SEARCH`.

```json
{
  "frequency": "daily",
  "timezone": "Asia/Bangkok",
  "weekdays": ["mon", "tue", "wed", "thu", "fri"],
  "startHour": 9,
  "endHour": 17
}
```

Rules:
- `startHour` must be lower than `endHour`.
- Scheduler must only queue work during active hours.
- Owner/Staff can pause or resume.
- Run Now on a scheduled search creates an immediate job without changing the recurring schedule.

## API Contract

### Admin App

`GET /v1/admin/jaklaen/sourcing-center`

Returns dashboard summary:
- Active scheduled searches.
- Pending customer requests.
- Queue depth.
- Running jobs.
- Blocked jobs.
- Candidate count awaiting review.
- Recent audit events.

`POST /v1/admin/jaklaen/search-requests`

Creates a request from Owner/Staff/Admin App.

`POST /v1/customer/search-requests`

Creates a Customer Search Request for the signed-in customer's own Case.

V1 default:
- Creates `CUSTOMER_SEARCH` with `approval_status = PENDING_OWNER_APPROVAL`.
- Does not queue a job until Owner approval.

`POST /v1/admin/jaklaen/search-requests/:requestId/approve`

Owner approves a Customer Search Request and queues a Search Job.

`POST /v1/admin/jaklaen/search-requests/:requestId/reject`

Owner rejects a Customer Search Request with a note.

`POST /v1/admin/jaklaen/search-requests/:requestId/run-now`

Queues an immediate job for an approved scheduled or Owner request.

`POST /v1/admin/jaklaen/search-requests/:requestId/pause`

Pauses future queueing.

`POST /v1/admin/jaklaen/search-requests/:requestId/resume`

Resumes future queueing if criteria and schedule remain valid.

### Worker API

`POST /v1/worker/jaklaen/jobs/claim`

Jaklaen claims one queued job using `NK_HERMES_WORKER_TOKEN`.

Response:

```json
{
  "job": {
    "jobId": "JSJ-2026-000001",
    "requestId": "JSR-2026-000001",
    "requestSource": "OWNER",
    "status": "RUNNING",
    "priority": "high",
    "criteria": {},
    "schedule": null,
    "quantityRequired": 3
  }
}
```

`POST /v1/worker/jaklaen/jobs/:jobId/complete`

Jaklaen reports safe completion, blocker, or failure.

```json
{
  "status": "COMPLETED",
  "candidateCount": 1,
  "listingsInspected": 12,
  "message": "One candidate returned for review."
}
```

Blocked example:

```json
{
  "status": "BLOCKED",
  "errorCode": "CAPTCHA",
  "message": "CAPTCHA encountered. Worker stopped without bypass attempt."
}
```

`POST /v1/worker/jaklaen/candidates`

Jaklaen submits found Candidate evidence through the existing Candidate Intake contract. The Candidate must remain `NEEDS_REVIEW`.

## Permission Rules

Owner:
- Create, edit, pause, resume, run, approve, reject all sourcing work.
- Review Candidates.
- Approve internal Candidate progression.
- Cannot bypass publish gates from this workflow.

Staff:
- Create Owner Search and Scheduled Search only if granted by organization policy.
- Review and correct Candidates if granted.
- Cannot publish unless a separate approved publication policy allows it.
- Cannot change company-wide permissions.

Customer:
- Create Customer Search only for their own Case.
- Cannot create/edit Scheduled Searches.
- Cannot see Job Queue internals, source URL, seller reference, screenshots, audit evidence, private media, or internal notes.
- Cannot force immediate queue in V1.

Jaklaen worker:
- Claim queued jobs with worker token.
- Return real Candidate data and evidence.
- Report safe blocked states.
- Cannot create customer-facing records.
- Cannot publish, message sellers, negotiate, reserve, buy, transfer money, or confirm availability.

System scheduler:
- Queues jobs from active Scheduled Searches inside configured active hours.
- Writes audit events.
- Must respect rate limits and pause state.

## Search Job Lifecycle

Allowed statuses:
- `DRAFT`
- `QUEUED`
- `RUNNING`
- `COMPLETED`
- `PAUSED`
- `BLOCKED`
- `FAILED`

Lifecycle examples:

Owner Search:

```text
DRAFT -> QUEUED -> RUNNING -> COMPLETED -> Candidate Review NEEDS_REVIEW
```

Customer Search V1 default:

```text
DRAFT -> PENDING_OWNER_APPROVAL -> QUEUED -> RUNNING -> COMPLETED -> Candidate Review NEEDS_REVIEW
```

Scheduled Search:

```text
ACTIVE SCHEDULE -> QUEUED JOB -> RUNNING -> COMPLETED -> next_run_at recalculated
```

Blocked worker:

```text
QUEUED -> RUNNING -> BLOCKED
```

Allowed blocker codes:
- `LOGIN_REQUIRED`
- `MFA_REQUIRED`
- `CAPTCHA`
- `CHECKPOINT`
- `RATE_LIMIT`
- `ACCOUNT_RISK`

Jaklaen must stop and report these blockers. It must not attempt bypass.

## Owner Approval Gates

Customer Search:
- V1 default is `OWNER_APPROVAL_REQUIRED`.
- Owner approves before a job is queued.
- Owner can reject with a note.

Candidate Intake:
- Every Candidate enters `NEEDS_REVIEW`.
- Approval in Candidate Review does not publish automatically.
- Publish requires the existing Owner publication workflow and customer-safe DTO boundary.

External action gates:
- Seller contact is not allowed by Jaklaen V1.
- Availability confirmation is not allowed by Jaklaen V1.
- Negotiation, booking, purchase, and payment are not allowed.
- Any future real external message must require explicit Owner-approved messaging policy and audit.

## Rate Limit And Duplicate Rules

Minimum V1 controls:
- Per-customer Customer Search limit per Bangkok day.
- Per-Owner/Staff Search Now limit per Bangkok day.
- Per-scheduled-search daily run cap.
- Queue depth cap.
- Duplicate detection by Source URL, source listing ID, registration/VIN when available, and fuzzy vehicle facts.

Duplicate handling:
- Strong exact duplicate links to existing internal record or returns duplicate result.
- Uncertain duplicate remains Candidate Review and must be labeled for Owner review.

## Preview Requirements

The Preview UI must show:
- Dashboard งานค้นหา.
- New Search.
- Scheduled Searches.
- Customer Requests.
- Search Job Queue.
- Candidate Review.
- Pause/Resume/Run Now.
- Search History and Audit Log.

The existing preview route may be expanded or a new route may be created, but Production must not be deployed until Owner approval.

## Final Proof Required Before Production

Before Production activation, Jaklaen must complete at least one real vehicle proof:

- Real Toyota Hilux Revo listing.
- Real Source URL.
- Listing title.
- Source price.
- Vehicle details.
- Real images.
- Screenshot.
- Candidate ID.
- Candidate status `NEEDS_REVIEW`.
- QNAP database row.
- Internal media storage location.
- Audit evidence of request, job claim, candidate return, and review state.

Mock, demo, or placeholder data cannot be used as final proof.
