# QNAP Application Requirements

Owner: `codex/app` defines this application contract. `codex/qnap-infrastructure` implements and operates it.

Status: required for production activation; do not expose PostgreSQL directly.

## Customer Inventory

- Authenticated server-to-server `GET /v1/public/listings` over stable HTTPS.
- Return only Owner-approved customer records and customer-visible media paths.
- Preserve the existing response envelope: `source`, `observedAt`, and `listings`.
- Media references must be first-party `/vehicle-marketplace/...` paths or an approved signed-media equivalent.
- Do not include source URL, seller identity/contact, exact location, internal notes, cost/margin, Drive IDs, or internal media paths.

Runtime secrets:

- `NK_QNAP_DATA_API_URL`
- `NK_INTERNAL_API_TOKEN`

Secrets remain in the approved runtime secret store and never in GitHub or customer responses.

## Owner Inventory

Required endpoint: authenticated server-to-server `GET /v1/admin/inventory-records`.

Requirements:

- Return approved, needs-review, rejected, and archived inventory according to Owner permissions.
- Include internal source/seller/evidence fields only for the authenticated Owner application path.
- Keep customer and Owner DTOs separate; never expand `/v1/public/listings` to satisfy Owner UI.
- Include publication/review status, evidence/media visibility, observed/verified timestamps, and stable vehicle/source IDs.
- Record access/audit metadata according to the infrastructure policy.

Response envelope:

```json
{
  "source": "qnap-postgres",
  "observedAt": "ISO-8601 timestamp",
  "records": [
    {
      "vehicleId": "stable vehicle ID",
      "sourceReference": "stable source reference",
      "publicationStatus": "APPROVED | NEEDS_REVIEW | REJECTED | ARCHIVED",
      "customerRecord": "customer DTO or null",
      "internalRecord": "Owner-only internal record",
      "sourceAdapter": "source adapter ID",
      "observedAt": "ISO-8601 timestamp",
      "media": [
        { "mediaId": "stable media ID", "visibility": "CUSTOMER_VISIBLE | INTERNAL_ONLY" }
      ]
    }
  ]
}
```

The application rebuilds every item into a strict Owner DTO. Unknown database fields and legacy storage IDs are discarded. An approved record must include a valid customer DTO and `CUSTOMER_VISIBLE` internal visibility. `Conflict` values from the migration source remain Owner-review evidence and normalize to existing UI-safe `Unknown` / `Need Review` states rather than being presented as confirmed facts.

## Media Boundary

- Customer-visible and internal-only roots remain separate.
- Public web containers must not mount internal-only media.
- Internal files require an authenticated Owner media endpoint or short-lived signed access.
- Validate MIME type, file size, path traversal, visibility, and vehicle/media identity before serving.
- For app runtimes that do not mount QNAP storage, provide authenticated server-to-server `GET /v1/public/media/:vehicleId/:mediaId`. The application exposes it to customers only through `/api/buying-browser/qnap-media/:vehicleId/:mediaId` after MIME/size validation.
- Listing records may use `/api/buying-browser/qnap-media/<vehicleId>/<mediaId>` as their customer-safe media reference. Never return a QNAP filesystem path.
- Provide authenticated server-to-server `GET /v1/admin/media/:vehicleId/:mediaId` for Owner evidence. It must verify the media belongs to the requested vehicle and may return both `CUSTOMER_VISIBLE` and `INTERNAL_ONLY` media.
- The application exposes Owner evidence only through `/api/buying-browser/owner/media/:vehicleId/:mediaId`, after ChatGPT Owner allowlist authorization plus MIME and size validation. Responses are private and `no-store`.

## Reliability

- Stable domain or named tunnel with TLS and access policy.
- Health endpoint and monitoring for Data API, PostgreSQL, media roots, and backup jobs.
- Daily backup with checksum and tested restore.
- Bounded request timeout and safe 5xx responses without stack traces or secrets.
- Rollback keeps the existing Site/repository snapshot available until production cutover is approved.

## Current Application Fallback

If QNAP is missing or unavailable, Browse uses the verified repository snapshot and reports non-live/fallback status. Google migration fallback runs only when `NK_ENABLE_GOOGLE_STAGING_FALLBACK=true` is explicitly configured.
