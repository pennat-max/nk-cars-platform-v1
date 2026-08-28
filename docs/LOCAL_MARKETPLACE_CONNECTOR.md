# NK Cars Local Marketplace Connector

Status: V1-LB1 development connector  
Production deployment: not configured or approved

## Purpose

This connector provides the free, Owner-controlled browser option for the Live AI Broker sourcing model.

```text
NK Cars application
  -> authenticated HTTPS connector boundary in production
  -> local NK Marketplace Connector on an Owner-controlled PC
  -> Playwright controlling a dedicated Chrome profile
  -> authorized Facebook Marketplace session
```

The connector uses the existing Chrome browser runtime through `playwright-core`. It does not build a browser engine and does not use the Owner's normal Chrome profile.

## Current V1-LB1 Capabilities

- Dedicated persistent browser profile with manual Facebook login/re-login.
- Profile states: `Ready`, `Login Required`, `Paused`, and `Error`.
- Multiple legitimate browser profiles can be configured for Owner-controlled sourcing resilience. V1 defaults to `fb-buyer-01`; additional profiles may be supplied with `NK_CONNECTOR_PROFILE_IDS=fb-buyer-01,fb-buyer-02` or added while the connector is running through the authenticated profile API.
- The authenticated Owner sourcing menu can proxy profile control when the app runtime has a server-side `NK_CONNECTOR_ADMIN_URL` and `NK_CONNECTOR_ADMIN_TOKEN`.
- FIFO search queue with concurrency one, conservative start spacing, bounded rate, timeout, cancellation, and safe telemetry.
- Structured search request and source-first candidate contracts.
- Facebook search card discovery plus listing/gallery traversal.
- Backward-compatible `POST /v1/facebook/import` endpoint for the current Add Vehicle flow.
- `POST /v1/search-runs` plus polling for Live Broker searches.
- Loopback-only HTTP server and Bearer-token authentication.
- Facebook URL/image allowlists and bounded request/response/image counts.
- Immediate `Login Required` stop when the profile is missing or Facebook presents login/verification.

The connector does not automatically turn search candidates into permanent Vehicles or public Marketplace listings.

## Security Boundaries

- The server binds to `127.0.0.1` only.
- A connector token of at least 32 characters is mandatory.
- The token, Facebook cookies, passwords, and browser profile are never committed to Git.
- Facebook login is performed manually in a dedicated visible Chrome window.
- NK Cars never reads or stores the Facebook password.
- NK Cars web forms must never accept Facebook email, username, password, OTP, MFA code, cookie, or token values. Owner remote access must present the real browser/runtime screen instead of collecting credentials.
- Chrome stores the dedicated session in the operating-system user profile directory. On Windows, Chrome protects supported cookie secrets using the signed-in Windows account.
- Do not point Playwright at the normal Chrome `User Data` directory.
- No automated password entry, CAPTCHA solving, MFA/checkpoint bypass, stealth, fingerprint spoofing, proxy rotation, or rate-limit evasion.
- Multiple profiles may be added later only for legitimate operational resilience, never to evade platform restrictions.

Default Windows profile directory:

`%LOCALAPPDATA%\NKCars\MarketplaceConnector\chrome-profile`

## Local Setup

Requirements:

- Node.js 22.13 or later.
- Google Chrome installed.
- The repository dependencies installed with `npm.cmd ci` or `npm.cmd install`.

Generate a random connector token:

```powershell
npm.cmd run connector:token
```

Set the token only in the current shell or a private local secret manager. Do not put it in a committed file:

```powershell
$env:NK_CONNECTOR_TOKEN = "generated-token"
```

Open the dedicated profile for manual Facebook login:

```powershell
npm.cmd run connector:login
```

Complete any password, MFA, checkpoint, or verification directly in Facebook. The window closes after the authenticated session cookies are detected.

Start the local connector:

```powershell
npm.cmd run connector:start
```

Default local URL:

`http://127.0.0.1:4317`

## Local Application Connection

For local development only, configure the NK Cars app process with:

```text
MARKETPLACE_CONNECTOR_URL=http://127.0.0.1:4317/v1/facebook/import
MARKETPLACE_CONNECTOR_TOKEN=<same private token>
MARKETPLACE_CONNECTOR_ALLOW_HTTP_LOCALHOST=true
```

Plain HTTP is accepted only for explicit loopback development. Any remote/private preview or production connection must use an approved HTTPS endpoint.

Do not add these values to `.openai/hosting.json` or commit them.

## API Summary

Unauthenticated liveness only:

- `GET /health`

Bearer token required:

- `GET /v1/profiles`
- `POST /v1/profiles`
- `POST /v1/profiles/{profileId}/check`
- `POST /v1/profiles/{profileId}/login`
- `POST /v1/profiles/{profileId}/state`
- `POST /v1/search-runs`
- `GET /v1/search-runs/{runId}`
- `DELETE /v1/search-runs/{runId}`
- `POST /v1/facebook/import`

Example structured search body:

```json
{
  "profile_id": "fb-buyer-01",
  "request": {
    "query": "Toyota Hilux Revo",
    "year_from": 2020,
    "year_to": 2022,
    "transmission": "AT",
    "drive_type": "4WD",
    "maximum_source_price_thb": 800000,
    "province_area": "Bangkok",
    "max_results": 5
  }
}
```

The initial response is `202 Accepted`. Poll the returned run ID. A search result remains `found_unverified` until NK performs current availability and price verification.

## Verification

Run deterministic service/queue/security tests:

```powershell
node --test tests\marketplace-connector.test.mjs
```

Run a real Chrome fixture that verifies search-card extraction and complete gallery traversal:

```powershell
npm.cmd run test:connector-browser
```

The fixture does not contact Facebook or use an account.

An authorized live smoke test requires the Owner to complete the manual profile login. It must stop rather than bypass any Facebook verification request.

## QNAP Hermes Pilot Runbook

From the Owner PC, the QNAP pilot helper can run one review-only command:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-hermes-qnap-pilot.ps1
```

The script prompts for the QNAP SSH credential locally, backs up PostgreSQL first, opens a loopback-only tunnel to the QNAP Data API container, starts the local connector with a temporary token, runs one worker command, writes a sanitized result to `%TEMP%\nk-hermes-qnap-pilot-result.json`, and then stops local connector/tunnel resources.

Latest live result on 2026-08-28:

- Backup: `/share/CACHEDEV6_DATA/nk-cars/backups/postgres/nk-cars-before-hermes-profile-pilot-20260828T100000Z.dump`
- Browser profile: `ready`
- Hermes state: `ready`
- Worker command: `41a8edb0-b823-4a0a-b34f-0ad0c326e1c9`
- Retained for review: `0`
- Duplicates skipped: `0`

The path is working, but the required pilot proof remains incomplete because no new vehicle reached `NEEDS_REVIEW`.

For an Owner-supplied direct Facebook URL, use:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-hermes-qnap-url-pilot.ps1 -SourceUrl "<facebook-url>"
```

This path still creates a QNAP backup first, opens the listing with the authorized browser profile, normalizes one candidate, submits it through the worker candidate endpoint, and completes the audited worker command. It must not bypass the active Owner rule. A 2026-08-28 direct URL attempt opened the supplied listing and found 18 image URLs, but QNAP rejected retention because the normalized candidate was year `2024` with no confirmed Phetchaburi location while the active pilot rule requires `Toyota Revo 2022` in `Phetchaburi`.

## Production Gate

The hosted ChatGPT Site cannot call `127.0.0.1` on the Owner PC. A later production connection requires:

- an Owner-approved private HTTPS tunnel or approved connector host;
- server-only connector URL/token configuration in the existing Site project;
- access controls, tunnel/service monitoring, rotation/revocation, and recovery runbook;
- confirmation that the PC/service availability is acceptable; and
- explicit Owner approval before changing production secrets or deploying the Site.

No tunnel, production secret, Site overwrite, public publish, or production deployment is part of V1-LB1.
