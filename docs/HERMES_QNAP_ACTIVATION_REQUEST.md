# Hermes QNAP Activation Request

Date: 2026-08-27
Owner request: enable Hermes to find vehicles and retain candidates for Owner Review.

This is a handoff for the QNAP/infrastructure technician. Do not put real passwords, tokens, cookies, browser profiles, or production secrets in GitHub, chat, screenshots, or logs.

## Goal

Activate the existing repository implementation so Hermes can:

1. receive Owner sourcing commands,
2. use a separately authorized worker credential,
3. submit sourced vehicle candidates to QNAP PostgreSQL,
4. store permitted source images only under internal-only QNAP media,
5. create only `NEEDS_REVIEW` inventory records,
6. never publish to customers or message sellers automatically.

First proof target:

`Toyota Revo 2022, Phetchaburi, 1 retained candidate -> Owner Review / NEEDS_REVIEW`

## Repository Source

Use GitHub:

```text
pennat-max/nk-cars-platform-v1
branch: codex/app
```

The current source already includes:

- `deploy/qnap/docker-compose.full.yml`
- `deploy/qnap/deploy-full.sh`
- `deploy/qnap/postgres/init/020_sourcing_automation.sql`
- `deploy/qnap/postgres/init/030_candidate_ingestion.sql`
- `deploy/qnap/data-service/server.mjs`
- `deploy/qnap/data-service/sourcing-repository.mjs`
- `marketplace-connector/qnap-worker.mjs`
- Owner UI/API under `/buy/owner/sourcing`

Do not build a duplicate Hermes/QNAP ingestion path.

## Required QNAP Secrets

Provision these only in the QNAP-only env file with permission `600`.

Required:

```text
NK_CARS_DB_ADMIN_PASSWORD=<qnap-only random secret>
NK_CARS_APP_DB_PASSWORD=<qnap-only random secret>
NK_INTERNAL_API_TOKEN=<qnap-only random token, at least 32 chars>
NK_HERMES_WORKER_TOKEN=<different qnap-only random token, at least 32 chars>
```

Rules:

- `NK_HERMES_WORKER_TOKEN` must not equal `NK_INTERNAL_API_TOKEN`.
- Do not use the QNAP admin password as any database/API token.
- Do not commit `.env`, token values, browser cookies, or Facebook session data.
- If `NK_HERMES_WORKER_TOKEN` is blank, worker endpoints must stay fail-closed with `worker_not_configured`.

Optional for AI normalization:

```text
OPENAI_API_KEY=<server-only key, if approved>
```

If no approved AI key/provider is configured, Hermes may still retain candidate source facts, but uncertain fields must remain `Unknown` / `Need Review`.

## Deployment Tasks

1. SSH/admin into QNAP using Owner-approved access.
2. Pull the latest `codex/app` source from GitHub.
3. Deploy the full QNAP data stack from the repository release:

```bash
sh deploy/qnap/deploy-full.sh <git-commit-sha>
```

4. Confirm the deploy ran or re-ran these migrations idempotently:

```text
020_sourcing_automation.sql
030_candidate_ingestion.sql
```

5. Confirm the Data API starts with:

```text
NK_INTERNAL_API_TOKEN set
NK_HERMES_WORKER_TOKEN set and distinct
customer-visible media root mounted separately
internal-only media root mounted separately
PostgreSQL not exposed to LAN/Internet
worker endpoints not exposed through public ingress
```

## Required Endpoints

Admin endpoints, exposed only through authenticated app/server path:

```text
GET  /v1/admin/sourcing
POST /v1/admin/sourcing/rules
PUT  /v1/admin/sourcing/rules/:ruleId
POST /v1/admin/sourcing/commands
```

Worker endpoints, private network only:

```text
POST /v1/worker/sourcing/commands/claim
POST /v1/worker/sourcing/commands/:commandId/heartbeat
POST /v1/worker/sourcing/commands/:commandId/complete
POST /v1/worker/sourcing/candidates
```

Security requirements:

- Admin endpoints require `Authorization: Bearer <NK_INTERNAL_API_TOKEN>`.
- Worker endpoints require `Authorization: Bearer <NK_HERMES_WORKER_TOKEN>`.
- Worker requests must include bounded `X-NK-Worker-Id`.
- Public ingress must not expose `/v1/worker/*`.
- PostgreSQL and raw Data API ports must not be exposed publicly.

## Facebook Browser Profile

Prepare an authorized browser profile for Hermes sourcing.

Rules:

- Owner must log in to Facebook directly.
- Do not collect or store the Owner's Facebook password.
- Do not bypass MFA, CAPTCHA, security checkpoint, or account verification.
- If the profile is logged out, checkpointed, rate-limited, or restricted, Hermes must stop and report `login_required` or a safe error.
- Do not message sellers, click LINE, call phone numbers, reserve vehicles, pay, or agree to buy.

First manual profile test:

1. Open Facebook Marketplace in the profile.
2. Search: `Revo 2022 เพชรบุรี`
3. Confirm the profile can open one listing page without login/checkpoint.
4. Do not contact the seller.

## First Contract Test

Create or use an active Owner rule:

```json
{
  "name": "Toyota Revo 2022 - Phetchaburi pilot",
  "active": true,
  "brand": "Toyota",
  "model": "Revo",
  "bodyType": "pickup",
  "yearFrom": 2022,
  "yearTo": 2022,
  "maxSourcePriceThb": null,
  "dailyLimit": 1,
  "priority": "normal",
  "locations": ["Phetchaburi"],
  "requiredKeywords": ["revo"],
  "excludedKeywords": [],
  "sourceAdapter": "facebook_marketplace",
  "schedule": {
    "timezone": "Asia/Bangkok",
    "weekdays": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    "startHour": 8,
    "endHour": 20
  }
}
```

If the current app validation only allows Bangkok Metro locations, do not force this rule through production. Record the blocker and either:

- add an Owner-approved non-Bangkok test rule extension in application code, or
- run the first automated test against an allowed Bangkok Metro rule, then wait for Owner approval before expanding to Phetchaburi.

## Candidate Acceptance Criteria

A successful pilot candidate must create:

- one `inventory_vehicles` row,
- `publication_status = 'NEEDS_REVIEW'`,
- `customer_record = NULL`,
- `source_adapter = 'facebook_marketplace_worker'`,
- internal source URL/reference retained,
- internal listing text/evidence retained where permitted,
- internal-only media stored if permitted image URLs were available,
- no customer-visible media unless Owner later approves,
- one `sourcing_candidate_ingestions` row with outcome `RETAINED`,
- append-only sourcing command/runtime events.

Duplicate behavior:

- Same canonical source reference must not create another vehicle.
- Duplicate must be recorded as duplicate/idempotent evidence, not silently ignored.

## Stop Conditions

Hermes must stop immediately and report a safe state if any of these occur:

- Facebook login required,
- MFA required,
- CAPTCHA,
- security checkpoint,
- source rate limiting,
- account restriction/account risk,
- repeated adapter errors,
- missing worker token,
- missing browser profile,
- Data API unavailable,
- daily retained candidate limit reached.

## Verification Commands

Use safe checks only. Do not print secrets.

Check containers:

```bash
/share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker ps --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}'
```

Check Data API health through the private route/container network according to the deployed compose.

Check public customer Browse:

```bash
curl -I -m 10 -s http://192.168.0.132:4332/buy
```

Check sourcing admin snapshot through the authenticated app/server path. The response should show real safe state, not a simulated success:

```text
connected: true
hermesState: ready | running | paused | login_required | error
browserProfileState: ready | paused | login_required | error
```

Check PostgreSQL counts after the pilot:

```sql
select publication_status, count(*) from inventory_vehicles group by publication_status;
select outcome, count(*) from sourcing_candidate_ingestions group by outcome;
```

Expected pilot result:

```text
At least one new NEEDS_REVIEW candidate, or an explicit safe blocker such as login_required.
No APPROVED/PUBLISHED customer listing created by Hermes.
No seller message sent.
No payment/purchase action.
```

## Report Back

After the technician finishes, report:

- deployed git commit SHA,
- QNAP release directory,
- container names and health,
- whether `NK_HERMES_WORKER_TOKEN` is configured without printing it,
- whether authorized Facebook profile opens Marketplace,
- pilot command result,
- retained candidate vehicle ID or blocker,
- evidence/media storage result,
- confirmation that no customer publication/seller contact/payment occurred.

