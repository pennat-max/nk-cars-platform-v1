# Production Next.js Architecture

## 1. Target stack

- GitHub repository with protected main branch and preview environments.
- Standard Next.js App Router, strict TypeScript, React Server Components by default.
- Supabase PostgreSQL, Auth, and Storage.
- OpenAI API for structured multimodal extraction and NK AI Sales.
- A server-side Facebook Marketplace connector adapter; Browserless is the current proof-of-concept implementation.
- Durable background jobs/workflows for imports, image processing, AI extraction, and future integrations.
- WhatsApp Business, Meta, and shipping providers remain future adapters, not embedded business logic.

The current Vinext/Cloudflare Sites preview remains the parity reference during migration. Do not replace it until production-route parity and acceptance tests pass.

## 2. Application layers

```text
app/ routes and layouts
  → presentation components / view models
  → Server Actions and Route Handlers
  → application use cases
  → domain policies and state transitions
  → repositories / connector interfaces
  → PostgreSQL, Storage, OpenAI, Browser connector
```

Rules:

- Presentation components render state and collect intent; they do not contain the only copy of pricing, permission, publication, duplicate, or merge rules.
- Domain/application services are framework-light and unit-testable.
- Repository/adapters translate database and provider details into domain types.
- External provider payloads never flow directly to public/client DTOs.
- Reads and writes use separate explicit DTOs, especially for public marketplace data.

## 3. Route map

Recommended App Router structure while preserving visible navigation:

```text
app/
  (internal)/
    layout.tsx                       authenticated NK Cars shell
    dashboard/page.tsx               Owner Dashboard / Home
    vehicles/page.tsx                internal inventory
    vehicles/new/page.tsx            link-first Add Vehicle
    vehicles/[vehicleId]/edit/page.tsx
    vehicles/[vehicleId]/review/page.tsx
    vehicles/[vehicleId]/360/page.tsx
    leads/page.tsx
    wanted/page.tsx
    sourcing-rules/page.tsx
    more/page.tsx
  (public)/
    marketplace/page.tsx
    marketplace/[vehicleSlug]/page.tsx
    wanted/new/page.tsx
    inquiry/page.tsx
  api/
    imports/facebook/route.ts         create import job
    imports/[jobId]/route.ts          safe status/result
    ai/vehicle-extract/route.ts       internal extraction boundary
    ai/sales/route.ts                 customer assistant boundary
    inquiries/route.ts                public validated creation
    uploads/route.ts                  signed upload preparation if needed
    webhooks/...                      authenticated provider callbacks
```

The internal bottom navigation continues to label routes `Home | Vehicles | Leads | Wanted | More`; the customer shell continues `Home | Vehicles | Wanted | Ask NK AI | More`.

## 4. Rendering and mutation choices

- Use Server Components for initial dashboard, inventory, review, lead, wanted, and marketplace reads.
- Use Client Components only where interaction requires them: role-independent mobile shell controls, photo picker/grid/reorder, progressive import state, AI review editing, assistant chat, and optimistic status selectors.
- Use Server Actions for first-party authenticated UI mutations such as save correction, submit draft, approve/publish, reject, lead stage, wanted status, and sourcing rule changes.
- Use Route Handlers for external/public boundaries: Marketplace import jobs, OpenAI calls if separated, AI Sales streaming, upload signatures, inquiries, and webhooks.
- Use Node runtime for OpenAI, browser connector orchestration, image metadata/processing, and jobs. Do not force Edge runtime without a measured need and verified dependency support.
- Use `next/image` or an equivalent optimized image component with explicit dimensions/sizes and a minimal trusted remote-host pattern. Prefer owned Storage URLs over long-term hotlinking Facebook CDN images.

## 5. Suggested source organization

```text
src/
  modules/
    vehicles/
      domain/
      application/
      infrastructure/
      ui/
    imports/
    ai-extraction/
    marketplace/
    leads/
    wanted/
    sourcing-rules/
    activity/
    auth/
  components/
    shell/
    status/
    images/
  lib/
    supabase/
    validation/
    observability/
    idempotency/
```

Migrating the current component names is optional. Visual parity is not.

## 6. Server DTO boundaries

Define distinct types:

- `InternalVehicleDTO` — full internal facts, sources, internal pricing, AI statuses.
- `VehicleReviewDTO` — review-specific aggregate and Owner actions.
- `PublicMarketplaceVehicleDTO` — intentionally safe fields only.
- `VehicleImportReviewDTO` — draft, evidence, field confidence/conflicts, images.
- `LeadListDTO`, `WantedListDTO`, `DashboardDTO` — query-specific projections.

Never serialize a database row and delete sensitive fields afterward. Select/map only the approved safe fields.

## 7. Authentication and authorization

- Supabase Auth manages user identity and cookie-based server sessions.
- Use the current official SSR approach and pin a tested `@supabase/ssr` version; verify package APIs because the package is documented as beta.
- `organization_members` is the application role source.
- Internal layouts require an active Owner/Staff membership.
- Customer/public V1 routes may be anonymous; inquiry endpoints validate inputs, rate limit, and create only safe records through a trusted server path.
- Authorization is repeated in application services and RLS/privileges.
- Sensitive Owner-only functions use explicit server/RPC entrypoints that validate role and state transition.

## 8. Database and transaction architecture

Follow `DATA_MODEL.md`.

Important transaction boundaries:

- Submitting a draft and creating Waiting Review state.
- Approve + publish + public projection + activity event.
- Reject + reason + activity event.
- Price change + attention event.
- Default source selection.
- Duplicate merge/resolution.
- Inquiry + Lead creation.
- Lead/Wanted status transition + activity.

Use optimistic concurrency (`version`/expected updated time) for review and approval so an Owner cannot publish stale data after Staff edits.

## 9. Import and job architecture

`AI_MARKETPLACE_IMPORT.md` is authoritative.

Recommended process:

1. Route Handler validates URL/actor, creates draft and idempotent job, and returns quickly.
2. Durable worker calls the connector, persists reachable evidence/images, and updates progress.
3. Worker calls the extraction service with the entire evidence set.
4. Worker persists structured field results and marks review ready.
5. Client receives progress via polling or Supabase Realtime.
6. Safe failure converts to `needs_user_evidence` without losing the URL.

Do not depend on a single long-lived request or an in-memory queue in production.

## 10. AI service boundaries

### Vehicle extraction

- Strict versioned input/output schema.
- Multimodal whole-vehicle evidence packet.
- `store: false` unless retention is explicitly approved.
- Model, prompt, schema, evidence, cost, and latency metadata stored internally.
- Unknown/conflict/non-overwrite behavior enforced both in prompt and merge code.

### NK AI Sales

- Receives only the public-safe vehicle DTO and verified policy facts.
- Tools: `searchPublicVehicles`, `getPublicVehicle`, `createInquiry`, `createWantedRequest`, optionally `requestAvailabilityCheck`.
- Server validates every tool input and writes records; the model cannot mutate arbitrary fields.
- System guardrails prohibit unverified price/availability/shipping/discount claims and internal-data disclosure.
- Conversation/transcript retention and PII policy must be explicit.

## 11. Image architecture

- Mobile uploads go directly to private Storage using short-lived signed upload paths.
- Original/private listing images, screenshots, VIN labels, and documents are never automatically public.
- Generate normalized display derivatives and thumbnails asynchronously.
- Cover/order is stored in database, not inferred from object name.
- On publish, expose only approved vehicle images through the public bucket/proxy/projection.
- On unpublish/reject, public derivatives are removed or made inaccessible according to retention policy.
- Validate content type, extension, signature, byte/pixel limits, and decompression-bomb risk.

## 12. Demo and environment architecture

Environments:

- Local development
- Automated test
- Private preview/staging
- Demo tenant/mode
- Production

Demo records are fixtures scoped to an `is_demo` organization. Reset Demo calls a protected fixture reset for that tenant only. It cannot touch production organization data. Demo role switching is compiled/configured only for demo, not trusted as identity.

## 13. Deployment and CI/CD

Suggested checks for every pull request:

- Install from lockfile.
- TypeScript type check.
- ESLint/format checks.
- Unit/domain tests.
- Database migration lint and schema diff.
- pgTAP RLS/privilege tests against an ephemeral project/database.
- Route/connector contract tests with fixtures.
- Playwright mobile parity and complete-flow tests.
- Build.
- Secret and dependency scanning.

Deployment principles:

- Preview deployments use preview credentials and isolated data.
- Migrations run through a controlled, observable deployment step.
- Backward-compatible schema changes precede application code that needs them.
- Feature flags can switch between prototype and production route slices during migration.
- Production promotion requires Owner sign-off on the private preview.
- Rollback plan covers application version, database compatibility, connector disable switch, and AI model/prompt rollback.

## 14. Configuration inventory

Server-only:

- OpenAI API key and model configuration.
- Supabase service-role key.
- Browserless token/profile/endpoint.
- Future Meta/WhatsApp/webhook verification secrets.
- Job/queue and error monitoring credentials.

Browser-safe:

- Supabase project URL and publishable/anon key, used only with RLS-safe operations.
- Public application base URL.
- Non-sensitive feature flags.

Maintain a checked-in `.env.example` with names and explanations only. Validate environment at process start. Never log values.

## 15. Observability and operational controls

- Structured logs with request/job/correlation IDs.
- Metrics: import success/partial/fallback rates, listing fetch latency, image counts, extraction latency/cost, unknown/conflict rates, correction rates, review time, publish rate, inquiry conversion.
- Traces across create job → connector → storage → extraction → review.
- Safe Owner-facing connector health/status.
- Circuit breaker/kill switch for Facebook connector and AI cost spikes.
- Durable rate limits for imports, image uploads, AI extraction, AI Sales, and public inquiry endpoints.
- Alerts on import failure spikes, job backlog, storage failure, RLS-denied anomalies, and provider budget thresholds.

## 16. Security and privacy checklist

- RLS and explicit grants on every exposed table.
- Server-only service role and provider credentials.
- SSRF-resistant URL and image fetching.
- Same-origin/CSRF protection for authenticated mutations.
- Input schemas and output encoding.
- Content Security Policy and restrictive image/connect policies.
- Rate limits, idempotency keys, upload caps, and cost ceilings.
- No internal data in public DTOs, caches, analytics, logs, metadata, or image alt text.
- Full VIN/chassis, registration, seller data, and customer PII protected and access logged as appropriate.
- Signed webhook verification and replay protection.
- Dependency updates and current vendor changelog review before each integration milestone.

## 17. Performance targets

- Add Vehicle interaction remains usable on a modern mobile connection.
- With accessible listing/evidence and healthy providers, import → review-ready target is 30–60 seconds.
- First UI response after starting import is immediate; work proceeds asynchronously.
- Photo thumbnails render progressively without loading 30 full-resolution images into layout.
- Marketplace pages use optimized images, pagination/infinite loading, and cache only the safe public projection.
- Dashboard aggregations use indexes/materialized summaries only after profiling; correctness first.

## 18. Production readiness decisions still requiring Owner/engineering sign-off

- Hosting/queue provider and regional data location.
- Facebook access method and compliance review for the authenticated connector.
- Supabase Auth invitation/onboarding flow for Owner and Staff.
- Customer authentication versus anonymous inquiry-only V1.
- Raw listing/AI evidence retention period.
- Public image retention after rejection/unpublish.
- Availability freshness threshold.
- Model selection, monthly AI budget, and fallback model policy.
- Exact required fields that block Owner publication.
- Contact/consent requirements for WhatsApp and international customers.

These decisions do not justify redesigning the current screens; expose them as configuration or backend policy wherever possible.

## 19. Official references

- [Next.js App Router documentation](https://nextjs.org/docs/app)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Next.js Image component](https://nextjs.org/docs/app/api-reference/components/image)
- [Supabase server-side authentication](https://supabase.com/docs/guides/auth/server-side)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)

Re-check current documentation and changelogs during implementation rather than relying on version-specific examples in this planning document.

