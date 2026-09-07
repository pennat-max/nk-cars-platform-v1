# TAISHUAI AUTO Handoff

Last updated: 2026-09-07

## Production

- Customer domain: `https://taishuaiauto.com`
- Production deployment target: Vercel project `nkautotrade/nk-cars-platform-v1`
- Current branch: `codex/hispeed`
- Current production commit: `9cc1585b7b17524cf948ad0aed3761c6745e9b68`
- GitHub repository: `pennat-max/nk-cars-platform-v1`

## Purpose

TAISHUAI AUTO is a separate customer-facing storefront brand built on the existing NK Cars platform. It shares the same approved inventory, Vehicle Case, pricing, shipping, quotation, and PI foundations, but uses a distinct customer presentation.

The current implementation is additive. It does not duplicate vehicle records, create a new vehicle database, create a new QNAP stack, create a new Hermes runtime, or change NK Cars `/buy` pricing.

## Customer-Facing Routes

- `https://taishuaiauto.com`
- `https://taishuaiauto.com/vehicles/[id]`
- `https://taishuaiauto.com/saved`
- `https://taishuaiauto.com/shipments`
- `https://taishuaiauto.com/cases`
- `https://taishuaiauto.com/account`

The app still uses the internal route namespace `/hispeed` behind the TAISHUAI AUTO domain. Do not rename this route in a quick production patch; it is tied to existing routing, tests, and channel reporting.

## Brand Cleanup Status

Customer-visible TAISHUAI AUTO pages should no longer show legacy NK Cars or HiSpeed wording as brand labels.

Cleaned customer-facing areas:

- Account intro now describes a TAISHUAI AUTO secure vehicle/order workspace.
- Account label now shows `Brand: TAISHUAI AUTO` instead of a raw channel.
- TAISHUAI source status is masked as TAISHUAI/verified vehicle inventory.
- TAISHUAI Open Graph and Twitter metadata use TAISHUAI AUTO.
- TAISHUAI vehicle summaries replace `NK verification` language with `TAISHUAI AUTO verification`.
- TAISHUAI case display numbers show `TS-CASE...` while preserving the real underlying case ID.
- TAISHUAI PI links stay under the TAISHUAI route namespace.

Expected internal identifiers that still remain:

- `/hispeed`
- `channel: "hispeed"`
- `HiSpeedApp`, `HiSpeedRoute`, and related code/module names
- `data-hispeed-*` test hooks
- underlying shared inventory IDs such as `nk-market-...`
- underlying source references such as `NK-MKT-...` in backend/source data
- underlying case IDs such as `NK-CASE-...` in domain records

These are contract/data identifiers, not customer brand copy. Removing them requires a separate migration plan because it can affect routing, reporting, saved/case records, and shared vehicle identity.

## Commercial Model

TAISHUAI AUTO supports two customer purchase plans in the TAISHUAI presentation layer:

- Standard Plan: lower total vehicle price, customer pays 30% deposit, then top-up before container closing so paid total reaches 80%, then 20% at container closing.
- Flex Plan: higher total vehicle price, customer pays 50% initial, 20% before shipment, and 30% at an approved destination/gateway milestone before controlled release. Flex is subject to approval and must never auto-approve credit.

The pricing basis remains THB. Customer presentation currency follows the selected language:

- English: USD
- Simplified Chinese: CNY
- Thai: THB

Do not expose source cost or internal margin as customer-facing profit language.

## Shared Logic Reused

- Customer-safe listing DTOs and source adapters
- Multi-brand visibility flags: `visibleOnNk` / `visibleOnHispeed`
- Vehicle Case domain logic
- Saved vehicles and shortlist behavior
- Availability workflow
- Inspection workflow and inspection wallet/credit presentation
- Existing shipping planner and configured freight estimate rules
- Quotation and PI components/domain
- Customer workspace and compatible account contracts

## Key Files

- `app/hispeed/HiSpeedRoute.tsx`: TAISHUAI route/provider wrapper, channel, source-status aliasing, TAISHUAI-safe listing mapping.
- `app/hispeed/HiSpeedApp.tsx`: TAISHUAI storefront UI, browse/detail/saved/shipping/cases/account screens.
- `app/hispeed/hispeed-commercial.mjs`: TAISHUAI purchase plan and currency presentation helpers.
- `app/hispeed/layout.tsx`: TAISHUAI metadata and route styles.
- `app/hispeed/hispeed.css`: TAISHUAI visual system.
- `app/buying-browser/components/ProformaInvoicePanel.tsx`: Shared PI panel with `basePath` support so TAISHUAI PI links do not point to `/buy`.
- `tests/buying-browser.test.mjs`: Shared NK Cars and TAISHUAI route, pricing, quote, and leakage checks.
- `docs/DECISION_LOG.md`: Architecture and commercial-policy decisions.

## Verification Commands

Run before deploying:

```powershell
npx tsc --noEmit
npx eslint app/hispeed/HiSpeedRoute.tsx app/hispeed/HiSpeedApp.tsx app/hispeed/layout.tsx app/buying-browser/components/ProformaInvoicePanel.tsx tests/buying-browser.test.mjs
npx vinext build
node --test tests/rendered-html.test.mjs tests/buying-browser.test.mjs
```

Last verified result:

- TypeScript passed.
- ESLint passed.
- `vinext build` passed.
- Node tests passed: 53/53.

## Live Smoke Checks

After deploy, verify:

```powershell
curl.exe -s -I -L --max-time 30 https://taishuaiauto.com
curl.exe -s -I -L --max-time 30 https://nkautotrade.com/buy
curl.exe -s -L --max-time 30 https://taishuaiauto.com/account -o $env:TEMP\taishuai-account.html
curl.exe -s -L --max-time 30 https://taishuaiauto.com/vehicles/nk-market-2026-0825-01 -o $env:TEMP\taishuai-vehicle.html
```

Expected:

- `https://taishuaiauto.com` matches `/hispeed`.
- `https://nkautotrade.com/buy` matches `/buy`.
- TAISHUAI account page does not show visible `Channel`, `NK QNAP inventory`, `车辆与 NK Cars`, or `客户来源会标记为 hispeed`.
- TAISHUAI vehicle detail summaries do not show `requires NK verification`; they should show TAISHUAI verification language.

## Deployment

Production deploy command used:

```powershell
vercel deploy --prod --yes
```

Most recent production deployment:

- Deployment ID: `dpl_Bf2LCbukRaXLvyhHNVTs1LSF2okb`
- Deployment URL: `https://nk-cars-platform-v1-1sxkdobxj-nkautotrade.vercel.app`
- Aliased domain: `https://nkautotrade.com`
- TAISHUAI domain route verified: `https://taishuaiauto.com`

## Safety Boundaries

Do not change without explicit Owner approval:

- QNAP infrastructure configuration
- Hermes runtime
- Facebook automation
- real payment movement
- real seller messaging
- destructive production data
- PostgreSQL schema destructively
- NK Cars `/buy` pricing rules
- internal `/hispeed` route or channel identifiers without a migration plan

## Follow-Up Items

- Decide whether TAISHUAI should eventually migrate from the internal `/hispeed` route namespace to `/taishuai` or root-only routing. This needs a planned redirect/data/reporting migration.
- Decide whether raw source IDs such as `nk-market-*` should receive separate public aliases for TAISHUAI URLs. Current URLs still preserve shared inventory identity.
- Configure final Owner/Finance-approved TAISHUAI bank instruction copy before using payment-request screens operationally.
- Keep Flex approval manual. Do not auto-grant Flex credit or release vehicle/documents without approved payment milestones.
