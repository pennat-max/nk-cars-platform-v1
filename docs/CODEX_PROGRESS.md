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

### Hybrid Marketplace Import

- Implemented the chosen V1-safe import path: Facebook public metadata first, then screenshot/photo fallback, with Cloud Browser remaining optional.
- `/api/marketplace-import` now resolves Facebook share links to canonical Marketplace item URLs when public metadata is available.
- The importer extracts OpenGraph/Twitter metadata: title, description, cover image, canonical URL, and available price metadata.
- The importer returns `draft_fields` from deterministic text extraction so a draft can show brand/model/year/spec hints even if NK AI is not configured.
- The Add Vehicle UI now accepts `draft_fields` and keeps a metadata-based Review screen available if the AI extraction endpoint fails or is not configured.
- Missing fields from public metadata are surfaced as review issues, prompting screenshot/photo evidence for gallery, seller/contact, location, source price, and current availability.
- Fixed the hosted import request to use Facebook's public mobile content path with an iPhone-compatible request profile that identifies NK Cars. The previous crawler-style user agent was denied by Facebook from the Sites runtime.
- Fixed multi-line OpenGraph attribute parsing. Facebook places the Marketplace description across multiple lines, which previously caused the importer to drop mileage, body type, drive, and description evidence.
- Public metadata now prefers the canonical `og:url`, reads Thai price labels when present, recognizes Thai mileage text, and excludes placeholder `Unknown` / `Need Review` values from prefill so NK AI can still fill them.
- Added an API regression test covering mobile Facebook metadata, a multi-line Thai description, canonical URL, cover image, Thai price and mileage, 4WD, and Double Cab extraction.
- Verified against sample Facebook share URL `https://www.facebook.com/share/1DF6CzLM1A/?mibextid=wwXIfr` through a local endpoint call:
  - Status: `partial`.
  - Provider: `Facebook public metadata`.
  - Canonical URL: `https://www.facebook.com/marketplace/item/1716607786274590/`.
  - Title: `2025 Toyota HILUX REVO 2.8 4WD GR SPORT WIDE`.
  - Draft fields: Toyota, Hilux Revo, 2025, 4WD, Double Cab, 24,000 km.
  - Cover images: 1.
  - Missing evidence: full photo gallery, seller/contact, location, source price, current availability.
