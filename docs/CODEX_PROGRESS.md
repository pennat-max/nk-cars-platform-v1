# Codex Progress

## 2026-08-23

Branch: `codex/production-rebuild`

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
