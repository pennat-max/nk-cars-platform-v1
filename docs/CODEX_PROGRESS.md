# Codex Progress

## 2026-08-23

Branch: `codex/production-rebuild`

### Master Specification Intake

- Owner instructed Codex to treat `docs/MASTER_SPECIFICATION.md` in the repository as the authoritative NK Cars product specification and ignore truncated Master Specification chat messages.
- Current repository source of truth contains detailed Sections 26-46 and preserves Sections 0-25 by accepted binding index/summary pending full text consolidation.
- Received Master Specification Part 1, sections 0-25, from the Owner. Requirements remain binding and must not be removed or reinterpreted.
- Received Master Specification Part 2, sections 26-46, from the Owner.
- Created `docs/MASTER_SPECIFICATION.md` and merged Part 2 into it.
- Preserved the existing accepted requirements by referencing sections 0-25 as binding until the full Part 1 text is consolidated.
- Created `docs/GAP_ANALYSIS.md` from the repository Master Specification only.
- Classified remaining work into V1-V5 and proposed the smallest next V1 milestone: Milestone 2A - Auth, Tenant, And Schema Foundation.
- Per Owner instruction: no production deployment, no public publish, no existing ChatGPT Site overwrite, and no next milestone coding without approval.

### Context Read

- Read `AGENTS.md`.
- Read all files in `docs`: `CODEX_HANDOFF.md`, `AI_MARKETPLACE_IMPORT.md`, `DATA_MODEL.md`, `PRODUCTION_ARCHITECTURE.md`, `ACCEPTANCE_TESTS.md`, `IMPLEMENTATION_PLAN.md`, and `CLOUD_BROWSER_SETUP.md`.
- Reviewed current source and tests under `app`, `db`, `worker`, `scripts`, and `tests`.

### Milestone

Started Milestone 1: Next.js shell and visual parity.

### Changes

- Added route-level entry points for the existing shell without redesigning UI or changing demo fixtures.
- Added internal route group pages for dashboard, vehicles, new/edit/review/360 vehicle views, leads, wanted, sourcing rules, and more.
- Added public route group pages for marketplace, vehicle detail, wanted create entry, and inquiry.
- Kept the prototype shell as the parity source and wired routes to initial shell state only.

### Constraints

- No public publish performed.
- No new repository created.
- No UI redesign, CSS token change, or demo seed change.

### Verification

- Installed dependencies with `npm ci`.
- Ran `npm.cmd test` with Git Bash added to the process PATH because the package build script invokes `bash`.
- Result: pass. The command ran `npm run build` and `node --test tests/rendered-html.test.mjs`.
- Verified rendered shell metadata and route entry points for `/`, internal routes, and public routes.
- Pre-commit audit ran on 2026-08-23:
  - `git diff --check`: pass.
  - `npm.cmd test`: pass.
  - `npm.cmd run build`: pass.
  - `npm.cmd exec tsc -- --noEmit --incremental false`: pass after adding local Cloudflare worker type declarations.
  - `npm.cmd run lint`: pass with existing `<img>` warnings in prototype components.
  - Local preview served at `http://127.0.0.1:4173/` and returned HTTP 200.
  - Chrome headless mobile screenshot was used for a 390px home-page check; a compact mobile action-button CSS adjustment was added to avoid narrow viewport overflow without changing flow or demo data.

### Notes

- The existing `npm` PowerShell shim is blocked by local execution policy, so tests were run through `npm.cmd`.
- The build emits Vinext route classification warnings for some routes as expected from static analysis; the build still completed successfully.
- `.openai/hosting.json` remains unchanged and still points to Sites project `appgprj_6a89acb712e481919bac8101abd6bf7e`.
- No commit, push, new Sites project, URL change, or public publish was performed.

### Gap Analysis Summary

- V1 remaining work is primarily production foundation plus durable sourcing/import/review/publish/marketplace/lead flow.
- V2 remaining work centers on Dealer Portal, Wanted reverse marketplace, dealer offers, seller availability, and Seller/Dealer Trust Score.
- V3 remaining work centers on quote/PI, negotiation approvals, payment control, Purchase Fund, Auto-Buy, deposits/refunds, Customer Trust Score, referral, and multi-vehicle purchase approvals.
- V4 remaining work centers on procurement, pre-purchase checks, purchase payment controls, Vehicle Secured, inspection, repair/modification, export/shipping, delivery, and after-sales.
- V5 remaining work centers on 360 pages, employee workflow/KPI, fraud/risk, immutable audit expansion, reporting/forecasting, Owner AI Command Center, and management briefs/reviews.
- Blocking dependencies include Supabase project/env confirmation, migrations/RLS/storage, durable job provider, compliant Facebook/Marketplace connector approach, AI key/model/cost policy, legal review for Purchase Fund, and Owner approval before production deployment.
