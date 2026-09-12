# Jaklaen Live Search Preview Handoff

Status: Preview-only handoff for GitHub Issue #1
Date: 2026-09-02 Bangkok time
Branch: `codex/app`

## Summary

Owner requested a mobile Preview page where NK Cars can run a Toyota Hilux Revo search and show real Facebook Marketplace vehicle results directly under the search button.

Implemented Preview route:

- `/buy/owner-preview/jaklaen-search`

The page is intentionally Preview-only. It must not be deployed to Production as a live sourcing feature until the durable Search Job Queue, worker token setup, QNAP candidate persistence, and real end-to-end Candidate Review proof are complete.

## Files Added

- `app/buy/owner-preview/jaklaen-search/page.tsx`
- `app/buying-browser/JaklaenOwnerSearchLivePreview.module.css`
- `app/api/buying-browser/owner/jaklaen-live-search/route.ts`
- `scripts/jaklaen-live-search-preview.mjs`
- `docs/jaklaen-live-search-preview-handoff.md`

## What Works In Preview

- The Owner Preview page renders on mobile.
- The search form defaults to `Toyota Hilux Revo`.
- The result area appears directly below the search button.
- A verified local Facebook Marketplace search run found 20 Toyota Hilux Revo listings and rendered 3 sanitized vehicle cards in the Preview page.
- The visible cards include only customer/Owner-safe review information:
  - vehicle image
  - THB source price
  - year / make / model
  - transmission
  - drive
  - mileage when available, otherwise `PENDING`
  - location when available, otherwise `PENDING`
  - found time
  - `NEEDS REVIEW` badge
  - source listing link for Owner preview

## Important Data Boundary

Do not commit raw Facebook output.

The local file `jaklaen-live-search-result.json` was used only as a local Preview cache after a real Facebook search. It can contain internal evidence fields and must remain ignored by Git. The Preview route maps it to a sanitized response before rendering.

The Git ignore rules now exclude local Preview logs, screenshots, and `jaklaen-live-search-result.json`.

## Current Runtime Behavior

The route handler first attempts to run `scripts/jaklaen-live-search-preview.mjs`.

If the live browser runner fails or times out in local Preview, the route falls back to the most recent local real-search cache file and returns a sanitized DTO. This fallback is only for this Preview proof and must not become the production architecture.

Production direction remains:

App Search Request -> Search Job Queue -> Jaklaen worker claim -> real source search -> Candidate Intake -> `NEEDS_REVIEW` -> Owner Review

## How To Run The Preview Locally

From the repo root:

```powershell
npx next dev -H 0.0.0.0 -p 5221
```

Open:

```text
http://127.0.0.1:5221/buy/owner-preview/jaklaen-search
```

For a temporary mobile link from outside the local network, start a quick Cloudflare tunnel:

```powershell
npx cloudflared tunnel --url http://127.0.0.1:5221
```

Then open:

```text
https://<quick-tunnel-host>/buy/owner-preview/jaklaen-search
```

The temporary tunnel used for the proof was:

```text
https://lately-powerpoint-brisbane-treasures.trycloudflare.com/buy/owner-preview/jaklaen-search
```

This quick tunnel is ephemeral and should not be treated as a stable URL.

## How To Run The Local Search Runner

The runner requires an authorized local Chrome profile for the marketplace connector. It must not receive or store Facebook passwords, cookies, tokens, MFA codes, or sessions in GitHub.

```powershell
@'
{"query":"Toyota Hilux Revo","maxResults":3}
'@ | node scripts\jaklaen-live-search-preview.mjs
```

Required local assumptions:

- `NK_CONNECTOR_PROFILE_ID` defaults to `jaklaen-facebook`.
- `NK_CONNECTOR_HEADLESS` defaults to `true`.
- `NK_CONNECTOR_PROFILE_IDS` must not be set for this proof because that creates sub-profile directories and may miss the existing authorized session.

## Test Results

Passed:

- `npx tsc --noEmit`
- Direct API smoke test returned HTTP 200 with 3 sanitized candidates from a real search cache.
- Playwright mobile test opened the Cloudflare Preview URL, clicked the search button, and confirmed 3 result cards rendered.
- Mobile screenshot was captured locally as `nk-jaklaen-live-facebook-results-cloudflare-mobile.png`.

Observed during testing:

- One real local Facebook Marketplace run succeeded and found 20 listings.
- Later direct runner attempts intermittently timed out or hit `browser_launch_failed` after Chrome profile/process contention. This is why the durable queue/worker approach remains required before declaring Jaklaen READY.
- The current proof does not persist candidates into QNAP Candidate Review and does not complete the official end-to-end readiness gate.

## Security And Safety Notes

- No seller was contacted.
- No vehicle was published.
- No payment, purchase, booking, or availability confirmation was created.
- No token, password, cookie, session, or Facebook credential was committed.
- Raw Facebook output and logs remain local-only and ignored.
- Public/customer pages must never expose source URL, seller identity/contact, raw evidence, internal notes, source cost, or private storage identifiers.

## Work Still Needed

1. Replace the local cache fallback with the durable Search Job Queue.
2. Persist real results through the existing Candidate Intake API as `NEEDS_REVIEW`.
3. Store source images and screenshots in the approved private evidence boundary.
4. Show the same Candidate ID in Candidate Review.
5. Add worker heartbeat/readiness telemetry for the real run.
6. Resolve browser profile locking/timeouts so the runner can complete reliably without manual cleanup.
7. Run the official end-to-end proof:
   Search Request -> Jaklaen accepts job -> real Facebook listing found -> Candidate created -> Candidate Review shows `NEEDS_REVIEW`.

## Production Boundary

This Preview does not authorize Production deployment.

Do not promote this route or runner as a live customer/production feature until Owner approves the final Preview and the official real-car Candidate Review proof is complete.
