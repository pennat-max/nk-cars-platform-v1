# Jaklaen Candidate Intake V1

Status: Preview implementation approved on 2026-09-01. Production deployment is not approved.

Jaklaen is the Vehicle Sourcing Agent. NK Cars receives candidates, stores internal evidence, and keeps every new candidate in Owner review. Jaklaen must not publish, contact sellers, reserve vehicles, buy vehicles, take payments, bypass login/MFA/CAPTCHA, or store credentials in GitHub.

## Existing System

- QNAP Data API already has worker endpoints under `/v1/worker/sourcing`.
- The existing candidate endpoint creates `inventory_vehicles` rows with `publication_status = 'NEEDS_REVIEW'` and `customer_record = NULL`.
- Source images are retained under the internal-only QNAP media root and are not served to customer routes.
- Owner/admin and worker traffic use separate bearer tokens.
- The customer DTO excludes source URL, seller/contact, source cost, and internal evidence.

## Preview Additions

- `/v1/worker/jaklaen/candidates` is an alias for the worker candidate intake contract.
- Payload validation now accepts listing screenshots, missing fields, confidence, and the Jaklaen candidate status boundary.
- Any worker-supplied status other than `NEEDS_REVIEW` is rejected.
- `/v1/admin/jaklaen/candidates` lists internal review candidates.
- `/v1/admin/jaklaen/candidates/:vehicleId/review` records Owner review decisions and field corrections without publishing.
- Review events are append-only in `jaklaen_candidate_review_events`.
- `/buy/owner-preview/jaklaen-candidates` is an anonymous-safe TEST/MOCK visual preview for Owner review.

## Authentication

Jaklaen calls worker endpoints with:

```http
Authorization: Bearer <NK_HERMES_WORKER_TOKEN>
x-nk-worker-id: jaklaen-hermes
content-type: application/json
```

The worker token is configured only on QNAP/runtime. It must be distinct from `NK_INTERNAL_API_TOKEN` and must never be committed.

Owner review endpoints use the existing admin bearer token plus Owner actor headers:

```http
Authorization: Bearer <NK_INTERNAL_API_TOKEN>
x-nk-actor-id: <owner id>
x-nk-actor-email: <owner email>
x-nk-actor-roles: OWNER
```

## Candidate Submit Contract

`POST /v1/worker/jaklaen/candidates`

```json
{
  "commandId": "775ba56b-c781-4c87-ae0c-a9c12164c6cf",
  "ruleId": "423fd244-cf3c-4a3d-a63e-e702b5ca52a2",
  "candidate": {
    "candidate_id": "cand_0123456789abcdef0123",
    "candidate_status": "NEEDS_REVIEW",
    "brand": "Toyota",
    "model": "Hilux Revo",
    "grade": "UNKNOWN",
    "year": 2022,
    "transmission": "AT",
    "engine": "PENDING",
    "drive_type": "2WD",
    "color": "Black",
    "mileage_km": 65000,
    "source_price_thb": 765000,
    "images": ["https://scontent.fbcdn.net/revo.jpg"],
    "screenshots": ["https://www.facebook.com/photo.php?fbid=987654321"],
    "confidence": 82,
    "missing_fields": ["grade", "engine"],
    "source": {
      "platform": "facebook_marketplace",
      "source_url": "https://www.facebook.com/marketplace/item/123456789/",
      "source_listing_id": "123456789",
      "title": "2022 Toyota Hilux Revo pickup",
      "listing_text": "Toyota Revo pickup Bangkok",
      "seller": "Marketplace seller reference",
      "location": "Bangkok, Thailand",
      "observed_at": "2026-09-01T08:00:00.000+07:00"
    }
  }
}
```

Allowed `source.platform` values:

- `facebook_marketplace`
- `facebook_group`
- `authorized_source`

Unknown values must be sent as `UNKNOWN` or `PENDING`. Do not guess.

Response:

```json
{
  "status": "retained",
  "vehicleId": "nk-auto-...",
  "idempotent": false,
  "media": {
    "stored": 2,
    "failed": 0,
    "failures": []
  }
}
```

Duplicate response:

```json
{
  "status": "duplicate",
  "vehicleId": "nk-auto-...",
  "idempotent": false,
  "media": {
    "stored": 0,
    "failed": 0
  }
}
```

## Owner Review Contract

`GET /v1/admin/jaklaen/candidates`

Returns internal candidates, internal-only media IDs, and review audit events. This endpoint is Owner/admin only and is not customer-safe.

`POST /v1/admin/jaklaen/candidates/:vehicleId/review`

```json
{
  "action": "APPROVED",
  "note": "Owner approved candidate for next internal workflow only."
}
```

Correction:

```json
{
  "action": "FIELD_EDITED",
  "note": "Corrected year from source text and screenshot evidence.",
  "fields": [
    { "field": "year", "value": "2021" },
    { "field": "engine", "value": "PENDING" }
  ]
}
```

Allowed review actions:

- `FIELD_EDITED`
- `APPROVED`
- `REJECTED`
- `NEED_MORE_INFO`

Review response always keeps publication closed:

```json
{
  "vehicleId": "nk-auto-...",
  "publicationStatus": "NEEDS_REVIEW",
  "candidateStatus": "APPROVED",
  "published": false
}
```

## Storage

- Listing images and screenshots are downloaded, validated, re-encoded, and stored under QNAP internal-only media.
- Image lifecycle is `Source`.
- Screenshot lifecycle is `Evidence`.
- Customer-visible media is not created by this intake.

## Final Proof Still Required

Before Owner approval for production, Jaklaen must submit one real Toyota Hilux Revo candidate with:

- Real Source URL
- Listing title
- Source price
- Vehicle facts
- Real images
- Screenshot
- Candidate ID
- `NEEDS_REVIEW` status
- QNAP database row and internal media storage location

No mock/demo/placeholder data can be used as final proof.

## App-Driven Search Queue V1 Preview

Owner-approved Preview scope adds an app-first workflow so Owner/Staff/eligible Customer users do not need to ask Codex to start every search.

Workflow:

```text
App
-> Search Request
-> Jaklaen Job Queue
-> Jaklaen claims job with worker token
-> Jaklaen searches only approved/authorized sources
-> Jaklaen sends Candidate back
-> Candidate enters NEEDS_REVIEW
-> Owner/Staff reviews before any publish workflow
```

Admin app endpoints:

- `GET /v1/admin/jaklaen/search-requests`
- `POST /v1/admin/jaklaen/search-requests`

Worker endpoints:

- `POST /v1/worker/jaklaen/jobs/claim`
- `POST /v1/worker/jaklaen/jobs/:jobId/heartbeat`
- `POST /v1/worker/jaklaen/jobs/:jobId/complete`
- `POST /v1/worker/jaklaen/candidates`

`SEARCH_NOW` request example:

```json
{
  "requestType": "SEARCH_NOW",
  "idempotencyKey": "case-001-search-now-20260901-0900",
  "priority": "high",
  "customerCaseReference": "CASE-001",
  "criteria": {
    "make": "Toyota",
    "model": "Hilux Revo",
    "grade": "UNKNOWN",
    "yearFrom": 2020,
    "yearTo": 2026,
    "transmission": "AT",
    "engineFuel": "Diesel",
    "driveType": "4WD",
    "color": "Any",
    "maxPriceThb": 850000,
    "maxMileageKm": 120000,
    "location": "Bangkok Metro",
    "radiusKm": 120,
    "quantityRequired": 3,
    "sources": ["facebook_marketplace", "facebook_group"]
  }
}
```

`STANDING_SEARCH` request example:

```json
{
  "requestType": "STANDING_SEARCH",
  "idempotencyKey": "company-revo-standing-20260901",
  "priority": "normal",
  "customerCaseReference": "Company shortlist",
  "criteria": {
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
  },
  "schedule": {
    "frequency": "daily",
    "timezone": "Asia/Bangkok",
    "weekdays": ["mon", "tue", "wed", "thu", "fri"],
    "startHour": 9,
    "endHour": 17
  }
}
```

Permissions:

- Owner can manage all Search Requests and Standing Searches.
- Staff can create Search Now and Standing Search only within granted internal scopes.
- Customer can create `SEARCH_NOW` only when `customerCaseReference` points to their own Case.
- Customer cannot create or edit company `STANDING_SEARCH`.

Operational controls:

- `SEARCH_NOW` creates a `jaklaen_search_jobs` row immediately.
- `STANDING_SEARCH` stores schedule criteria; a scheduler must create future jobs only during active hours.
- Worker claim/heartbeat/complete endpoints require `NK_HERMES_WORKER_TOKEN`, not the Owner admin token.
- App endpoints require authenticated app/Owner API token and actor headers.
- Search Request creation is idempotent and rate-limited by requester per Bangkok day.
- Audit events are append-only.
- Job completion can report `BLOCKED` with safe reasons: `LOGIN_REQUIRED`, `MFA_REQUIRED`, `CAPTCHA`, `CHECKPOINT`, `RATE_LIMIT`, or `ACCOUNT_RISK`.
- Candidates still use the existing candidate intake schema and must enter `NEEDS_REVIEW`.

Worker setup for Issue #1 uses the API origin without a trailing `/v1`:

```powershell
$env:NK_API_BASE_URL = "https://<preview-nk-data-api-base>"
$env:NK_WORKER_ID = "jaklaen-hermes"
$env:NK_HERMES_WORKER_TOKEN = "<paste token locally only>"
powershell -ExecutionPolicy Bypass -File .\scripts\run-jaklaen-preview-worker.ps1 -Once -ConnectivityOnly
```

Do not store `NK_HERMES_WORKER_TOKEN` in GitHub, logs, screenshots, or chat. The connectivity-only command proves API claim/heartbeat/complete wiring only; it is not the final real Marketplace readiness proof.

Preview UI:

- `/buy/owner-preview/jaklaen-candidates` now shows:
  - Search Now
  - Standing Searches
  - Candidate Review

The preview UI uses TEST/MOCK data only and is not final proof. Production activation still requires one real Toyota Hilux Revo candidate with real source URL, images, screenshot, Candidate ID, `NEEDS_REVIEW`, QNAP database row, and internal media storage references.
