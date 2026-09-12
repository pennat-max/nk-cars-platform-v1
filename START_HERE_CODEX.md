# START HERE FOR CODEX

This is the first file a new Codex session should read when continuing NK Cars work from GitHub.

Repo: `pennat-max/nk-cars-platform-v1`
Working branch: `codex/app`
Owner-facing production domain: `https://nkautotrade.com`

## 1. First Commands

```powershell
git clone https://github.com/pennat-max/nk-cars-platform-v1.git
cd nk-cars-platform-v1
git checkout codex/app
git pull --ff-only origin codex/app
```

If the repo is already cloned:

```powershell
git checkout codex/app
git pull --ff-only origin codex/app
git status --short
```

Do not overwrite unrelated local changes. If the tree is dirty, inspect it first.

## 2. Required Reading Before Changes

Read these in order:

1. `AGENTS.md`
2. `docs/CURRENT_V1.md`
3. recent entries in `docs/DECISION_LOG.md`

For product-code changes, also follow `AGENTS.md` and read:

1. `docs/CODEX_HANDOFF.md`
2. `docs/AI_MARKETPLACE_IMPORT.md`
3. `docs/DATA_MODEL.md`
4. `docs/PRODUCTION_ARCHITECTURE.md`
5. `docs/ACCEPTANCE_TESTS.md`
6. `docs/IMPLEMENTATION_PLAN.md`

The short rule: GitHub is the source of truth. Do not rely on chat memory when it conflicts with GitHub.

## 3. Current Hosting And Data Map

Current customer web production:

- Vercel project: `nk-cars-platform-v1`
- Domain: `https://nkautotrade.com`
- Customer entry: `https://nkautotrade.com/buy`

Current V1 runtime data target:

- Vehicle inventory: QNAP PostgreSQL
- Vehicle media/evidence: QNAP storage
- Application reads QNAP through authenticated Data API only

GitHub contains code and documentation, not production secrets or the live vehicle/customer database.

Cloudflare quick tunnels may appear in old notes or screenshots. They are temporary Preview links only, not the production webserver and not the database.

## 4. What Must Never Go Into GitHub

Never commit:

- `.env` files
- API tokens
- passwords
- cookies
- Facebook sessions
- browser profiles
- raw Facebook Marketplace output
- seller private data
- customer private data
- QNAP private identifiers that are not already intentionally documented
- local logs or screenshots unless explicitly reviewed as safe documentation artifacts

The repo `.gitignore` already blocks common local Preview artifacts, but still inspect `git diff --cached` before every commit.

## 5. Current Safe Working Pattern

For a normal task:

1. Pull latest `codex/app`.
2. Read the required docs.
3. Inspect existing implementation before building anything new.
4. Make the smallest scoped change.
5. Run targeted tests.
6. Update `docs/CURRENT_V1.md` if current system behavior changed.
7. Update `docs/DECISION_LOG.md` only for Owner-approved material decisions.
8. Commit and push to `codex/app` unless the Owner requested another branch.
9. Report commit SHA, tests, and blockers.

Do not deploy Production unless the Owner explicitly approves Production deployment in the current work context.

## 6. Current Important Preview Routes

- `/buy` - customer Buying Browser
- `/preview/marketplace-style` - isolated marketplace-style visual preview
- `/preview/shipment-quote-planner` - isolated shipment quote planner visual preview
- `/buy/owner-preview/sourcing` - public-safe Owner sourcing menu preview
- `/buy/owner-preview/jaklaen-candidates` - Candidate Review preview
- `/buy/owner-preview/jaklaen-search` - Jaklaen live-search Owner Preview handoff route

The Jaklaen live-search route is documented here:

- `docs/jaklaen-live-search-preview-handoff.md`

Important: `/buy/owner-preview/jaklaen-search` is Preview-only and currently not the durable production queue implementation.

## 7. Jaklaen / Hermes Boundaries

Jaklaen is the Vehicle Sourcing Agent. NK web app owns:

- Search Request UI
- Search Job Queue API contract
- Candidate Intake API contract
- Candidate Review UI
- audit trail and safe data boundaries

Jaklaen owns:

- searching permitted sources
- returning real candidates
- stopping on login/MFA/CAPTCHA/checkpoint/rate limit/account-risk states

Jaklaen must not:

- publish vehicles
- contact sellers
- negotiate
- reserve
- buy
- transfer money
- confirm availability
- bypass Facebook security

Candidate output must start as `NEEDS_REVIEW`.

## 8. Useful Local Commands

Typecheck:

```powershell
npx tsc --noEmit
```

Run Next dev Preview when Node route handlers are needed:

```powershell
npx next dev -H 0.0.0.0 -p 5221
```

Run default Vite/Vinext dev server:

```powershell
npm run dev
```

Build on this Windows machine may fail if `bash` is not available in PATH because the repo build script uses Linux shell helpers. Record that clearly instead of pretending build passed.

## 9. Current Known Blockers

- Production identity/workspace activation still waits for Owner-controlled QNAP identity/runtime setup.
- Real Jaklaen readiness is not complete until a durable queue-backed end-to-end proof creates a real `NEEDS_REVIEW` Candidate in Candidate Review with evidence.
- The local Facebook connector can be intermittent due to Chrome profile/session contention.
- Production payment, seller messaging, purchase, booking, and availability confirmation remain disabled unless Owner explicitly approves and required systems are configured.

## 10. Handoff Rule

When handing off to another Codex or engineer, leave the next person with:

- current branch
- commit SHA
- files changed
- exact route or feature touched
- tests run and failures
- Preview URL if still live
- what is safe to ignore
- what must not be committed
- next concrete task

Prefer updating GitHub docs or GitHub Issue comments over relying on chat history.
