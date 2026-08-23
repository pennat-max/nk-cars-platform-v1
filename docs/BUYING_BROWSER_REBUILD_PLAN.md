# NK Cars Buying Browser Rebuild Plan

Status: Buying Browser V1 preview implementation complete; awaiting Owner review
Date: 2026-08-24
Branch: `codex/buying-browser-rebuild`

This plan implements `docs/PRODUCT_PIVOT_BUYING_BROWSER.md`. It is additive: the existing stock-first application remains available as rollback/reference until the Owner approves a production replacement.

## Target Experience And Routes

- `/buy`: mobile-first customer home and marketplace-style vehicle browsing.
- `/buy/paste`: paste a supported vehicle URL, import what is accessible, and continue through a safe fallback when the source cannot be read.
- `/buy/vehicle/[sourceId]`: customer-safe normalized source-vehicle detail.
- `/buy/cases`: saved Vehicle Cases and their current verified workflow state.
- `/buy/cases/[caseId]`: case detail, price structure, timeline, and customer/NK AI conversation.
- `/buy/inspections`: inspection requests and deterministic quote state.
- `/buy/messages`: case-linked customer/NK AI history.
- `/buy/account`: NK customer account shell and source-session status.
- `/buy/owner`: internal demo view of source URL, seller/source facts, verification, and adapter state. This route is not a production authorization boundary.

The customer home prioritizes Browse Vehicles, Paste Vehicle Link, and Ask NK AI to Find One. Mobile navigation prioritizes Browse, Saved, My Cases, Inspections, and Messages.

## Reuse

- Existing Next.js/Vinext application, build scripts, Sites configuration, responsive tokens, and route-test approach.
- Existing hybrid Marketplace import API and screenshot/photo fallback.
- Existing local Playwright connector, `SourceAdapter`, browser-profile manager, queue, and safe login/checkpoint behavior.
- Existing extraction, customer-copy sanitization, review, Vehicle 360, lead, wanted, and downstream demo modules where they remain relevant.
- Existing `.openai/hosting.json` and current Sites project association without modification.

## Replace Or Reframe

- The stock-first home is not deleted. The new customer preview is added under `/buy`; changing the production root is a later Owner-approved release decision.
- Browse results are source vehicles or demo source fixtures, not represented as NK-owned stock.
- Saving a result creates a customer Vehicle Case instead of immediately creating a public Vehicle.
- Customer-visible pricing becomes a deterministic transparent cost structure rather than an unexplained listing markup.
- Customer availability actions create a request/history event; they do not pretend a seller was contacted.

## Source Sessions And Fallback

- Source access is implemented behind versioned adapters, not Facebook-specific business logic.
- Real source authentication is customer- or Owner-initiated in a dedicated isolated browser profile. NK never asks for or stores a source password in an NK form.
- Profiles stop at MFA, CAPTCHA, login, checkpoint, or verification and expose only safe state.
- V1 connector execution is serialized with conservative limits. Data structures remain compatible with future per-customer profile isolation.
- If an adapter cannot access a listing, preserve the URL and offer Open Source App/Browser, Share/Copy Link, and screenshot/photo upload fallback.
- Demo adapters are explicitly marked and never presented as live integration success.

## Vehicle Case Model

A case uses a persistent identifier such as `NK-CASE-2026-001245` and stores:

- customer and source-listing references;
- customer-safe normalized specification and translation;
- internally observed asking price and timestamp;
- current availability/verification state;
- deterministic pricing inputs and output;
- availability, AI conversation, and inspection history;
- inspection quote/request state;
- audit-friendly timeline events.

Seller identity/contact, source URL, source cost context, and internal notes are kept in internal DTOs and must not enter customer DTOs.

## AI Boundary

- V1 preview responses are deterministic, source-grounded assistance over available case facts and are clearly bounded when data is unknown.
- Future model-backed translation/extraction must return structured output with provenance/confidence and must not overwrite confirmed data.
- AI may prepare a Thai seller inquiry and English customer summary. It cannot claim that a message was sent, availability was confirmed, a fee was accepted, or a financial commitment was made without the authorized workflow.
- Real customer/seller sends remain blocked pending Owner approval and an approved channel.

## Inspection Boundary

- V1 calculates a configurable quote from an explicit base fee and location/travel zone.
- Requesting inspection creates a request; it does not claim an inspector has accepted or completed a job.
- Future providers (NK staff, freelancer, partner garage, inspection company) implement the same job/checklist contract.
- Unknown location or special-service inputs remain Pending instead of being guessed.

## Transparent Pricing

Deterministic total:

`vehicle purchase price + NK service commission + inspection/travel + domestic transport + repair/modification + export/shipping + other agreed costs`

- Default preview commission rate is configurable at 10% of the actual vehicle purchase price only.
- The 10% preview setting is not activated as a production commercial promise until Owner/legal approval.
- Unknown pass-through charges display Pending and are excluded from the known subtotal.
- AI never performs or modifies material calculations.

## Migration And Rollback

- `codex/production-rebuild` at `61d4bc8` remains the rollback reference.
- Work proceeds on `codex/buying-browser-rebuild`.
- New routes, DTOs, local state, and tests are additive. Existing demo data and stock-first routes remain intact.
- Browser state uses a separate local-storage namespace during preview.
- Future production database migration will be additive and requires reviewed Auth/RLS/tenant design before customer data is stored.
- No root-route switch, destructive migration, Site overwrite, or production deployment occurs without Owner approval.

## Security And Privacy

- Customer and owner/source DTOs are separate by construction.
- Customer views never expose seller contact, source URL, internal notes, source-cost context, or margin.
- Source credentials are never collected by NK forms or committed to Git.
- Source sessions must be isolated per customer before real multi-user use.
- Preview account/session and fixture data are visibly marked Demo; they are not production authentication or live inventory.
- Real authorization requires server-enforced RBAC and tenant isolation, not a client role switch.

## Milestones

### BB-V1A - Additive Buying Browser Foundation

- Customer shell, Browse, search/filter/location, two-column mobile grid, saved state, customer-safe detail, Vehicle Case creation, source-adapter contracts, and realistic labeled fixtures.
- Exit: core browse/save/case flow works on iPhone viewport; customer output passes redaction tests; old app remains unchanged.
- Status: Complete on 2026-08-24.

### BB-V1B - Assisted Buying Workflow

- Paste Link, Ask NK AI, Check Availability, pricing breakdown, Request Inspection, My Cases, Messages/history, and safe fallback behavior.
- Exit: all actions persist locally, accurately describe pending work, and never fake a real source/message/provider action.
- Status: Complete on 2026-08-24.

### BB-V1C - Internal View And Preview Hardening

- Owner/internal case-source view, adapter/profile status, responsive/accessibility fixes, regression tests, preview verification, and final documentation.
- Exit: tests/typecheck/lint/build pass and a mobile-accessible preview is ready for Owner review.
- Status: Complete on 2026-08-24.

## Acceptance Tests

- Browse renders realistic source fixtures explicitly marked Demo and never claims NK ownership or verified availability.
- Search and filters cover make/model text, year, price, mileage, location, transmission, drive, and body type.
- Save creates one persistent case and repeated Save does not duplicate it.
- Customer vehicle/case pages contain no seller contact, source URL, internal note, source-cost label, or margin.
- Paste Link uses the real import boundary where available and provides a working screenshot/photo/open-source fallback where unavailable.
- Check Availability records a pending request and prepared inquiry without claiming a real send.
- Pricing applies the configured commission only to vehicle purchase price and displays unknown cost lines as Pending.
- Inspection quote is deterministic; request state is distinct from accepted/completed state.
- My Cases and Messages retain case-linked history across reloads in preview storage.
- Owner view can inspect internal source facts without those facts appearing in customer DTOs.
- Main flows have no horizontal overflow at 390 x 844 and remain usable at desktop width.
- Existing tests plus Buying Browser domain/render/interaction checks, typecheck, lint, build, and `git diff --check` pass.
- `.openai/hosting.json` is unchanged and no production deployment, Site overwrite, production secret change, or real message occurs.

## Smallest Safe Next Milestone

After Owner review, the smallest next V1 production milestone is **BB-V1D - Production Identity And Durable Cases**: connect approved Auth and organization membership, add tenant-scoped durable Vehicle Case storage with RLS and audit, and preserve the current adapter/UI contracts. It requires the approved production project/configuration and does not include deployment, real source login, real messages, or a root-route switch.
