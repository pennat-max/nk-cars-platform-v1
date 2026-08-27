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

## Reviewed publication batch - 2026-08-27

- The application fallback contains 20 Owner-reviewed customer records and 135 customer-visible images.
- QNAP currently requires an infrastructure-owned import/update for the second ten publication states and their reviewed customer media mapping.
- The QNAP public endpoint must not report synchronization complete until all 20 records are returned with the same unresolved facts, publication states, cover ordering, and customer/internal visibility boundaries.
- Owner approval for Browse does not confirm current availability, price, condition, or unresolved specifications.

## Identity gateway

The public Vercel application must not trust client-supplied `oai-authenticated-*` headers. ChatGPT Site headers remain supported only in the ChatGPT runtime. QNAP production identity uses an opaque customer session owned by an approved identity gateway.

Application configuration after the gateway is operational:

- `NK_IDENTITY_PROVIDER=qnap`
- `NK_IDENTITY_SIGN_IN_URL=https://<approved-auth-host>/...`
- `NK_IDENTITY_SIGN_OUT_URL=https://<approved-auth-host>/...` (optional until sign-out is enabled)
- `NK_IDENTITY_SOCIAL_PROVIDERS=google,apple` (enable only providers whose credentials and callbacks have passed verification)
- `NK_IDENTITY_SESSION_COOKIE=nk_session` (or another approved cookie name)
- `NK_WORKSPACE_BACKEND=qnap`
- existing `NK_QNAP_DATA_API_URL` and `NK_INTERNAL_API_TOKEN`

Required server-to-server endpoint:

`GET /v1/auth/session`

Request requirements:

- `Authorization: Bearer <NK_INTERNAL_API_TOKEN>`
- `X-NK-Session-Token: <opaque session cookie value>`
- Never accept the actor identity from a public browser header without validating the opaque session.
- Never log or return the session token.

Successful response:

```json
{
  "authenticated": true,
  "user": {
    "id": "stable-provider-user-id",
    "email": "customer@example.com",
    "displayName": "Customer name",
    "fullName": "Optional full name",
    "roles": ["CUSTOMER"]
  }
}
```

Allowed roles are `CUSTOMER`, `STAFF`, and `OWNER`. The session cookie must be `HttpOnly`, `Secure`, bounded in lifetime, protected against fixation, and use an appropriate `SameSite` policy. MFA and recovery remain identity-provider responsibilities; NK never collects a Facebook or identity-provider password in its own form.
At least one allowed role is required; an authenticated account with no NK role fails closed.

The application defaults to `disabled` identity on Vercel until these settings exist, so spoofed ChatGPT headers cannot activate a customer or Owner session.

### Google and Apple social sign-in

The customer Account screen can present provider-specific Google and Apple actions. The application sends only an allowlisted `provider=google|apple` and a protected absolute `return_to` URL to the identity gateway. The gateway owns OAuth/OIDC authorization, callback handling, account linking, recovery, and the opaque NK session.

Required gateway behavior:

- Prefer a same-origin gateway under `https://nkautotrade.com/auth/...` through the approved reverse proxy so the final `nk_session` can remain a host-only cookie. If a separate auth host is used, document and security-review the cookie/domain boundary before activation.
- Google: use an Owner-controlled OAuth web client, exact HTTPS redirect URI, Authorization Code flow, and server-side ID-token validation including issuer, audience, expiry, `state`, and `nonce`.
- Apple: use an Owner-controlled Apple Developer App ID/Services ID, Team ID, Key ID, and private key; validate authorization response and identity token server-side. The private key is a secret and must never enter GitHub or the browser bundle.
- Use PKCE where supported, single-use short-lived authorization state, exact redirect allowlists, and no open redirects.
- Key identities by the verified `(provider, subject)` pair. Do not merge accounts solely from an email address, particularly Apple private relay addresses; linking providers requires an authenticated, explicit account-link action.
- Assign new customer identities only the `CUSTOMER` role. `STAFF` and `OWNER` roles require a separate audited administrative assignment and must never derive from email-domain matching alone.
- Rotate the opaque NK session after successful authentication and logout; set `HttpOnly`, `Secure`, `SameSite=Lax` or a stricter reviewed policy, `Path=/`, bounded expiry, and server-side revocation.
- Do not log authorization codes, access/ID tokens, provider secrets, Apple private keys, or the opaque NK session.

Expected sign-in gateway request:

`GET <NK_IDENTITY_SIGN_IN_URL>?provider=google|apple&return_to=https%3A%2F%2Fnkautotrade.com%2Fbuy%2Faccount`

Activation order:

1. Implement and test Google in a non-production environment.
2. Implement Apple after the Owner Apple Developer identifiers/key are available.
3. Run callback, session persistence, logout, account isolation, role escalation, and mobile tests.
4. Only then set `NK_IDENTITY_PROVIDER=qnap`, `NK_IDENTITY_SOCIAL_PROVIDERS`, and the gateway URLs in Vercel Production.

## Durable workspace API

All endpoints require the internal bearer token. `X-NK-Actor-Id`, `X-NK-Actor-Email`, and `X-NK-Actor-Roles` are trusted only after that token is verified. QNAP must independently enforce actor role, ownership, validation, revision, audit, and transaction rules.

Customer endpoints:

- `GET /v1/workspaces/:userId`
- `PUT /v1/workspaces/:userId`
- `POST /v1/workspaces/:userId/cases/:caseId/quotation-acceptance`

Owner endpoints:

- `GET /v1/admin/cases`
- `POST /v1/admin/cases/:workspaceUserId/:caseId/verification`
- `POST /v1/admin/cases/:workspaceUserId/:caseId/quotation`
- `POST /v1/admin/cases/:workspaceUserId/:caseId/pi`

Customer workspace response:

```json
{
  "state": null,
  "revision": 0,
  "updatedAt": null
}
```

`PUT` request:

```json
{
  "state": { "version": 1 },
  "expectedRevision": 0,
  "profile": {
    "email": "customer@example.com",
    "displayName": "Customer name"
  }
}
```

On revision conflict return HTTP 409 with `{ "error": "workspace_revision_conflict", "current": <current workspace response> }`. The update and append-only workspace event must commit atomically. Customer writes must never create or overwrite Owner-confirmed availability, actual purchase price, NK fee rates, material costs, quotation, PI, payment, or Owner audit records.

`GET /v1/admin/cases` returns `{ "cases": [<OwnerCaseQueueItem>] }`. Each Owner mutation returns `{ "case": <OwnerCaseQueueItem> }`. QNAP document numbering, quotation/PI snapshots, case updates, workspace revision, event, and audit evidence must commit in one database transaction. Operational users cannot delete audit history.

The application revalidates all returned workspace and Owner Case data, recomputes quotation readiness, rejects oversized/malformed responses, and fails closed when the API is unavailable. The existing D1 adapter remains rollback support for the ChatGPT Site only.

## Owner sourcing automation and Hermes control

The application provides an Owner-only mobile menu at `/buy/owner/sourcing`. QNAP/Hermes remains disabled until these endpoints are implemented behind the existing internal bearer-token boundary.

Required endpoints:

- `GET /v1/admin/sourcing`
- `POST /v1/admin/sourcing/rules`
- `PUT /v1/admin/sourcing/rules/:ruleId`
- `POST /v1/admin/sourcing/commands`

Every endpoint must verify `NK_INTERNAL_API_TOKEN`, then independently require the trusted actor to have the `OWNER` role. Browser-supplied actor headers are never trusted directly.

Snapshot response:

```json
{
  "connected": true,
  "hermesState": "ready | running | paused | login_required | error",
  "browserProfileState": "ready | paused | login_required | error",
  "queueDepth": 0,
  "processedToday": 0,
  "lastRunAt": null,
  "lastHeartbeatAt": "ISO-8601 timestamp",
  "message": "Customer-safe operational status",
  "rules": []
}
```

Rule fields:

- stable `id`, `revision`, `createdAt`, `updatedAt`
- `name`, `active`, `priority`
- `brand`, optional `model`, `bodyType=pickup`
- `yearFrom`, `yearTo`, optional `maxSourcePriceThb`
- `dailyLimit` from 1 to 50 qualified retained candidates per Bangkok calendar day
- Bangkok Metro `locations`
- `requiredKeywords`, `excludedKeywords`
- `sourceAdapter=facebook_marketplace`
- schedule using `Asia/Bangkok`, selected weekdays, `startHour`, and exclusive `endHour`

Create/update request uses `{ "rule": <validated rule>, "expectedRevision": 0 }`. Updates require the current revision; stale writes return HTTP 409. Rule update and append-only audit event commit atomically. Do not physically delete rule/audit history.

Command request:

```json
{
  "action": "run_now | pause | resume",
  "ruleId": "optional rule ID",
  "idempotencyKey": "UUID"
}
```

Hermes execution rules:

- Queue concurrency is one per authorized browser profile with conservative source-specific rate controls.
- `run_now` schedules active rules only and never bypasses the per-rule daily cap.
- Count only retained candidates that passed rule filters and duplicate pre-check; unrelated search results do not consume the configured target.
- Stop and set `login_required` on logout, checkpoint, MFA, CAPTCHA, or source verification. Never bypass these controls.
- Stop/pause safely on source rate limiting, account risk, missing permission, or repeated adapter errors.
- Capture only permitted evidence; normalize, translate, and deduplicate before creating `Needs Review` records.
- Never auto-publish, confirm availability, send seller messages, reserve a vehicle, or make a financial commitment from this scheduler.
- `pause` prevents new jobs and allows the current atomic capture step to finish safely. `resume` re-enables scheduling but does not bypass `login_required`.
- Persist run/rule/profile status, counts, safe error codes, actor, timestamps, and audit events without tokens, cookies, seller PII, or raw stack traces.
