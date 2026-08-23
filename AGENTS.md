# NK Cars V1 — Codex Working Agreement

This repository is the current private prototype and the visual/behavioral reference for the production rebuild.

Before changing product code, read these files in order:

1. `docs/CODEX_HANDOFF.md`
2. `docs/AI_MARKETPLACE_IMPORT.md`
3. `docs/DATA_MODEL.md`
4. `docs/PRODUCTION_ARCHITECTURE.md`
5. `docs/ACCEPTANCE_TESTS.md`
6. `docs/IMPLEMENTATION_PLAN.md`

## Non-negotiable product constraints

- Preserve the current mobile-first UI, information hierarchy, screens, touch targets, labels, navigation, demo behavior, and workflows. Do not redesign unless a technical limitation makes the existing behavior impossible. Record and obtain approval for any unavoidable change.
- The production path is: Facebook Marketplace URL → fetch reachable listing data and images → analyze all evidence as one AI job → Vehicle Draft → Waiting Review → Owner Approve → Publish.
- Never fabricate a successful import. If Facebook cannot be reached, preserve the URL and immediately offer multi-photo/screenshot and listing-text fallback.
- AI must not silently guess, overwrite a user's correction, resolve conflicts without disclosure, confirm unverified availability, invent shipping, invent a price, or grant a discount.
- New-vehicle intake starts blank. Demo records must never populate or be reused by the create form.
- Owner approval is required before publication. Staff may create and edit but may not approve, reject, or publish.
- Public/customer responses must never include source cost, internal margin, source/dealer identity, seller contact information, source URL, full VIN/chassis, or full registration plate.
- Important state changes and sensitive actions must be authorized on the server, committed transactionally, and written to the activity log. Client-side hidden controls are not authorization.
- Keep the private preview private until the Owner explicitly approves public publication.

## Source-of-truth order

When requirements appear to conflict, use this order:

1. Explicit new instruction from the Owner.
2. This working agreement and the handoff documents.
3. Acceptance tests and state/permission matrices.
4. Current UI behavior and styling in `app/components`, `app/globals.css`, and `app/data/demo.ts`.
5. Existing prototype implementation details.

Preserve observable behavior while replacing prototype-only implementation details such as local storage, a single client-side view switcher, and in-memory rate limiting.

## Engineering boundaries

- Target standard Next.js App Router with strict TypeScript.
- Use Server Components for authenticated reads where practical, Server Actions for first-party UI mutations, and Route Handlers for external integrations, AI, webhooks, and public APIs.
- Put business rules in domain/application services. UI components may invoke rules but must not own the only implementation of them.
- Use Supabase/PostgreSQL/Auth/Storage for durable data. Scope every business record to an organization even while V1 has one organization.
- Enable RLS and explicit table privileges on every exposed table. Derive roles from a dedicated organization-membership table or trusted app metadata, never editable user metadata.
- Keep service-role, OpenAI, Browserless, Meta, WhatsApp, and shipping credentials server-only.
- Expose public marketplace data through a deliberately restricted DTO/view. Do not query the full internal vehicle row from public pages.
- Make imports, AI extractions, and external callbacks idempotent and observable. Store prompt/model/version/evidence metadata without logging secrets or sensitive full identifiers.
- Keep original/private images separate from published/public assets or serve them using signed URLs. Validate MIME type, size, and host allowlists.

## Change discipline

- Work in small, reviewable milestones following `docs/IMPLEMENTATION_PLAN.md`.
- Do not delete the current prototype until the parity suite passes against the replacement.
- Add migrations rather than editing production data manually.
- Update the handoff docs and acceptance tests when an approved product decision changes behavior.
- Never commit secrets, tokens, cookies, Browserless profiles, or `.env` files.

## Required verification before handoff

- Type checking, linting, unit tests, database/RLS tests, integration tests, and the mobile end-to-end flows in `docs/ACCEPTANCE_TESTS.md` pass.
- Owner, Staff, Customer, anonymous, cross-organization, and service-role access paths are tested separately.
- Link import, blocked-import fallback, 30-photo upload, AI conflict handling, manual correction locking, Waiting Review, Owner approval, publish, inquiry creation, and lead visibility are verified end to end.
- Public responses are checked for internal-data leakage.
- A migration/rollback note, environment-variable inventory, and deployment runbook are current.

