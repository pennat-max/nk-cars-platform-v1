# Google Sheets + Drive Staging Sync

Status: Implemented in code; runtime credential connection pending
Updated: 2026-08-26

## Purpose

Google Sheets and Google Drive are the approved V1 staging layer for reviewed vehicle inventory. They are not the Vehicle Case database and are not the permanent business-domain database.

Runtime flow:

`Authorized capture -> normalize/review -> private Google Registry + Drive -> NK server adapter -> customer-safe Browse -> Vehicle Case snapshot`

The repository snapshot remains a tested fallback. It is not the primary editing workflow after Google synchronization is activated.

## Current Google Assets

- Registry: `NK Cars Vehicle Staging Registry`
- Spreadsheet ID: `1IXEZTH2EYcIeM6HQKJ2Qfk4LZYsVWu4ipNolXoTnxhw`
- Staging root folder: `NK Cars Vehicle Staging`
- Staging root folder ID: `1TVQxbCQP7KePJTLoEwHhXQY6FjsLcvc5`
- Current staged inventory: 20 vehicles: 10 approved for Browse and 10 in Needs Review
- Current Drive media: 197 images: 60 approved customer-safe images and 137 private Needs Review evidence images

The Registry and staging root remain private. Do not publish the Registry because it contains internal source URL, seller, phone, location, notes, and Drive identifiers.

## Registry Schema

The first tab is `README`. It identifies the two runtime tabs, publication rules, safe edit order, identity rules, privacy boundary, cache behavior, and the status of preserved legacy tabs. The application does not parse `README`.

### `Vehicles`

One row per staged vehicle. The server maps fields by header name, not fixed column position.

Customer publication requires both:

- `publication_status = Approved for Browse`
- `visibility = CUSTOMER_VISIBLE`

Important customer-safe fields include vehicle identity, English title/summary, normalized specs, observed price/time, general location, availability state, translation state, and evidence labels.

Internal fields include source platform/URL, seller/contact, exact location, internal notes, Drive folder identifiers, and original media count. These fields are never copied into the customer listing DTO.

### `Media`

One row per media item. Customer media requires all of:

- matching approved vehicle
- `visibility = CUSTOMER_VISIBLE`
- `review_status = Approved`
- `kind = photo`

The browser receives only an NK first-party media URL. It does not receive the Google Drive file ID or Drive URL.

`sort_order = 1` is the customer cover image used by Browse cards and the first image on Vehicle Detail. It must be a reviewed exterior photo. Registration plates, seller/dealer branding, phone numbers, and other source-identifying clues must be redacted in a customer-safe derivative before approval; the original remains internal evidence.

## Drive Structure

```text
NK Cars Vehicle Staging/
  NK-MKT-2026-0825-01/
    photos/
    evidence/
  ...
  NK-MKT-2026-0825-10/
    photos/
    evidence/
  NK-MKT-2026-0826-11/
    photos/
    evidence/  # private Needs Review source evidence
  ...
  NK-MKT-2026-0826-20/
    photos/
    evidence/
```

The first ten `photos/` folders contain reviewed customer-safe media. The 137 images captured for vehicles 11-20 are stored only in private `evidence/` folders and remain `INTERNAL_ONLY + Needs Review`. Raw repository evidence has not been deleted and still requires a separate private-storage migration before production launch.

## Runtime Configuration

Required secret:

- `GOOGLE_SERVICE_ACCOUNT_JSON`: complete Google service-account JSON, stored only in the hosting secret/environment system.

Optional non-secret configuration:

- `NK_GOOGLE_SHEET_ID` (defaults to the current Registry)
- `NK_GOOGLE_VEHICLES_RANGE` (defaults to `Vehicles!A1:AN500`)
- `NK_GOOGLE_MEDIA_RANGE` (defaults to `Media!A1:O5000`)
- `NK_GOOGLE_SYNC_TTL_SECONDS` (defaults to 300 seconds; allowed range 30-3600)

Google setup:

1. Enable Google Sheets API and Google Drive API in the approved Google Cloud project.
2. Create a read-only runtime service account.
3. Share the `NK Cars Vehicle Staging` root folder with the service-account email as Viewer.
4. Add `GOOGLE_SERVICE_ACCOUNT_JSON` to the approved Site/runtime secrets without committing it.
5. Verify `/api/buying-browser/sync-status` reports `live: true`, 10 approved vehicles, and 60 approved media items.

The current environment does not contain this credential. Until configured, the app intentionally reports `fallbackActive: true` and serves the last verified repository snapshot.

## Sync And Failure Behavior

- Data is refreshed on demand and cached server-side for five minutes by default.
- A new request after cache expiry reads the Registry again.
- Google authentication, schema, or network failure does not blank Browse; the adapter uses the tested repository snapshot.
- Google errors are reduced to a safe status. Credentials, Drive IDs, source URLs, and raw API responses are not exposed.
- The Drive media proxy checks vehicle/media identity and visibility again, accepts only bounded JPEG/PNG/WebP/GIF/AVIF content, and rejects active SVG/HTML before serving an image.
- Current price and availability remain unverified unless their deterministic statuses say otherwise.

## Operating Procedure

1. Add/update a vehicle in `Vehicles` with `Needs Review` while editing.
2. Add media rows in `Media` as `Needs Review` or `INTERNAL_ONLY`.
3. Review normalized facts, conflicts, source evidence, and every customer photo. Select a customer-safe exterior cover and assign it `sort_order = 1`.
4. Set approved customer photos to `CUSTOMER_VISIBLE + Approved`.
5. Set the vehicle to `CUSTOMER_VISIBLE + Approved for Browse` only after Owner review.
6. Wait for cache expiry or use a new runtime instance/request to observe the update.
7. When a customer acts, create a Vehicle Case snapshot; later Sheet edits must not silently rewrite historical case facts.

## Maintenance Policy

- The Owner authorizes routine, reversible improvements to the Google Sheet schema and Drive folder organization when they reduce errors or support the approved V1 flow.
- Preserve stable `vehicle_id`, `source_reference`, and per-vehicle/media references after downstream records use them.
- Do not duplicate authoritative business data for presentation convenience; add derived views only when they have a clear operating purpose.
- Do not delete or rename legacy tabs, evidence, folders, or business records without a verified migration and the approval required for destructive data changes.
- Keep app-facing schema changes backward compatible or update the parser, tests, documentation, and rollback path in the same milestone.
- Keep the Registry and staging root private. A structural cleanup must never broaden sharing permissions.

## Security Boundary

- Never commit the service-account JSON, access tokens, source sessions, cookies, or Google credentials.
- Never make the private Registry public.
- Never use direct Drive links in customer DTOs.
- Do not place unreviewed plates, source clues, seller contacts, or documents in customer-visible media.
- Production still requires Owner approval and secret configuration review.
