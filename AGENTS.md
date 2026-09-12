# NK Cars — Codex Fast/Lean Working Agreement

Use this file as the default working instruction set for routine development.

## Default context

For normal tasks, read only:

1. `AGENTS.md`
2. `docs/CURRENT_V1.md`
3. files directly relevant to the task

Do **not** reread the full Master Specification on every task.

Read these larger product documents only when the task changes product scope, a requirement is unclear, or `CURRENT_V1.md` explicitly points to them:

- `docs/MASTER_SPECIFICATION.md`
- `docs/PRODUCT_DIRECTION_LIVE_BROKER.md`
- `docs/PRODUCT_PIVOT_BUYING_BROWSER.md`

When requirements conflict, the newest explicit Owner instruction wins. For current customer-facing V1 direction, `PRODUCT_PIVOT_BUYING_BROWSER.md` has priority over older stock-first assumptions.

## Current product direction

NK Cars is an **AI Vehicle Buying Browser / Buying Platform for Thailand**, not primarily a permanent stock-catalog website.

Core customer journey:

**Browse or paste vehicle link → Save Vehicle → Vehicle Case → NK AI translation/coordination → Check Availability → Request Inspection → Buy Through NK → downstream purchase/export workflow.**

The current implementation must be preserved as rollback/reference while the Buying Browser V1 is rebuilt.

## Fast/lean execution mode

- Do not ask routine implementation questions when intent is already clear.
- Make reasonable technical decisions autonomously.
- Prefer the simplest safe, maintainable implementation.
- Work in small verifiable milestones.
- Inspect only relevant files for each milestone.
- Run targeted tests first; run broader checks when the milestone is stable or the change can affect shared behavior.
- Do not narrate routine tool calls or repeat documented requirements.
- Keep progress updates brief: blocker, result, tests, commit SHA, remaining work.
- Prefer modifying sound existing components over unnecessary rewrites.
- Update `docs/CURRENT_V1.md` whenever the active milestone, blockers, assumptions, or current architecture materially change.
- Update `docs/CODEX_PROGRESS.md` only at meaningful milestone boundaries, not after every minor edit.
- Update `docs/GAP_ANALYSIS.md` only when product/implementation coverage materially changes.
- After each completed, tested milestone, commit and push stable work to GitHub.
- Never push obviously broken/untested work merely to show progress.

## Product / UX rules

- Mobile-first, with iPhone as the Owner's primary management device.
- Customer Browse should use a familiar marketplace-style grid/search/filter pattern while remaining clearly NK-branded.
- Customer search location defaults to Thailand / NK-configured Thai search areas, not the overseas customer's physical location.
- Customer account location and destination country are separate from vehicle search location.
- Support three customer entry paths: Browse Vehicles, Paste Vehicle Link, Ask NK AI to Find One.
- A saved/selected vehicle becomes a persistent `Vehicle Case`.
- AI translation and deep vehicle analysis should load progressively; do not block the whole page waiting for AI.
- Source adapters must remain separate from NK business logic so Facebook, LINE, dealer feeds, websites, auctions, and future sources can be added independently.
- Never fabricate a successful source import or external integration.
- Use working fallbacks when a source cannot be accessed.

## Commercial rules

Current intended customer pricing model:

**Actual Vehicle Purchase Price + NK Service Commission + Inspection/Travel + Domestic Transport + Repair/Modification + Export/Shipping + other explicitly agreed costs.**

Current intended NK Service Commission: **10% of actual vehicle purchase price**, configurable before production activation.

Important financial values must be deterministic and sourced from verified records/rate tables, not AI guesses.

## Data / AI rules

- Database records and confirmed documents are the source of truth.
- AI conversation memory is not authoritative for payment, price, availability, VIN, shipping, approvals, accounting, or fees.
- AI may extract, translate, summarize, match, rank, and converse.
- Deterministic systems control financial calculations, permissions, state transitions, approvals, ledgers, and payment confirmation.
- Unknown or conflicting vehicle facts must remain Unknown / Need Review / Conflict.
- Human-confirmed data overrides AI prediction.
- Never silently overwrite a human correction.

## Security / source-session rules

- Never commit secrets, passwords, tokens, cookies, browser profiles, or `.env` files.
- If a supported source needs authentication, prefer isolated authorized browser sessions; never store plaintext source passwords when avoidable.
- Customer A's source session/history must never be exposed to Customer B.
- Never bypass MFA, CAPTCHA, verification, rate limits, or platform security controls.
- Do not use multiple accounts/profiles to evade platform restrictions.

## Approval boundaries

Codex may autonomously:

- implement/refactor/fix bugs
- add normal development dependencies
- create development migrations
- run tests/builds
- remove temporary artifacts it created
- create preview builds
- commit/push stable milestone work

Owner approval is required before:

- production deployment
- overwriting/replacing the current public site
- destructive production database changes
- deleting important production data
- activating/purchasing paid services
- sending real customer/seller messages
- real deposits, purchases, refunds, transfers, or other financial actions
- irreversible external actions

Do not ask the Owner to approve the same unchanged decision twice.

## Completion behavior

For each milestone:

**inspect relevant code → implement → targeted tests → broader checks if needed → fix → update CURRENT_V1 → commit/push → concise report.**

Do not stop for non-blocking uncertainty. Make the best reasonable assumption, record it briefly in `docs/CURRENT_V1.md`, and continue.
