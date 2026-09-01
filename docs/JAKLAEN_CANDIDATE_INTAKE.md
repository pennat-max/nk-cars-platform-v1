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
