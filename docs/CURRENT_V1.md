# NK Cars - CURRENT V1

Status: Active working context for Codex
Purpose: Keep routine development fast and token-efficient.
Implementation status: The Owner-approved cross-platform Buying Browser direction supersedes the earlier external-share-only conclusion. Native WKWebView, Android WebView, and Windows WebView2 proof-of-concept adapters are in progress; external Share and Copy Link remain required fallbacks. Production activation is not approved.

Web companion status: `/buy/browser` provides a browser-style NK shell on iPhone, Android, and Windows web browsers. It opens the real Facebook Marketplace in Facebook's own tab/app, accepts the selected listing link, and forwards explicit NK actions into the existing Vehicle Case flow. It does not embed, proxy, inspect, or control Facebook and must not be described as a native in-app Facebook browser.

Use this file with `AGENTS.md` as the default context. Consult larger product specs only when necessary.

## 1. Current product

NK Cars is being rebuilt as an **AI Vehicle Buying Browser / Buying Platform for Thailand**.

Primary real-source customer journey:

**Open real Facebook Marketplace inside the NK native browser where technically permitted, using the customer's own session**
-> customer browses/selects a real listing
-> Share -> Save to NK Cars where the installed platform supports it
-> create Vehicle Case
-> AI translates/normalizes vehicle information
-> Check Availability
-> Request Inspection
-> transparent NK pricing
-> later Buy Through NK / procurement / export.

The NK demo vehicle grid and old stock-first implementation remain fallback/downstream and rollback/reference. Do not treat demo cards as proof of real Marketplace browsing.

## 2. Current customer UX direction

Mobile-first, especially iPhone.

Primary source experience:
- open Facebook Marketplace inside the platform browser adapter: iOS WKWebView, Android WebView, or Windows WebView2
- the customer signs in directly to Facebook; NK never collects or stores Facebook credentials
- browse/select a real listing, then explicitly use the native NK action bar to save its URL as a Vehicle Case
- where embedded browsing/login is blocked, use the operating-system `Save to NK Cars` share target
- capture permitted listing URL/data internally and create a customer-safe Vehicle Case
- retain screenshots/photos/listing-text fallback when Facebook evidence is inaccessible

Copy Link -> return -> paste is last resort. A signed iOS Share Extension remains the fallback when Facebook blocks embedded WKWebView behavior. See `docs/BUYING_BROWSER_FEASIBILITY_SPIKE.md` for the superseded feasibility baseline and `docs/CROSS_PLATFORM_BUYING_BROWSER.md` for the current direction.

The existing NK vehicle grid, search, filters, and saved vehicles remain secondary fallback/downstream tools.

Customer location/destination country is separate from Search Location.

Do not use the overseas customer's physical location as the Marketplace search area. Default vehicle search should be Thailand / configured Thai region.

Primary actions:
- Browse Vehicles
- Paste Vehicle Link
- Ask NK AI to Find One
- Save Vehicle
- Ask NK AI
- Check Availability
- Request Inspection

Suggested customer navigation:
**Browse | Saved/My Vehicles | My Cases | Inspections | Messages/Account**

## 3. Vehicle Case

A saved/selected vehicle becomes an NK Vehicle Case.

Vehicle Case should support:
- source platform
- source URL/listing ID
- normalized vehicle spec
- observed asking price + timestamp
- internal seller/location data where permitted
- customer relationship
- AI translation/summary
- availability/verification status
- source conversation history
- inspection status/report
- quote/order linkage later
- audit trail

Do not require permanent storage of every source image/listing. Snapshot operationally important evidence according to policy.

## 4. Source architecture

Do not hard-code Facebook into NK business logic.

Use adapter boundaries for future sources such as:
- Facebook Marketplace
- LINE workflows
- dealer/partner feeds
- Thai vehicle websites
- auction/partner sources
- Dealer Portal

Source access may use supported APIs, authorized sessions/browser workflows, share/copy-link flows, or other source-appropriate methods.

Never fake successful source access.

## 5. Source authentication

Where source login is required:
- customer/source user authenticates themselves
- no plaintext password storage
- isolate sessions by customer/profile
- Login Required state when expired
- no MFA/CAPTCHA/security bypass
- fallback to Open Source App/Browser + Share/Copy Link if managed browsing is unsupported

## 6. AI behavior

AI may:
- translate Thai <-> customer language
- extract vehicle specs
- summarize listing details
- rank/match vehicles
- prepare routine seller questions
- summarize seller replies

AI must not invent:
- availability
- source price
- mileage/VIN/spec
- travel/inspection fee
- shipping
- discount
- payment status

Use Unknown / Need Review / Conflict when evidence is insufficient.

Use progressive rendering:
1. show basic available listing facts immediately
2. translate concise text asynchronously
3. perform deeper image/spec analysis in background
4. cache unchanged normalized/translated results where appropriate

## 7. Commercial model

Current intended structure:

**Vehicle Purchase Price + NK Service Fee + Inspection/Travel + Domestic Transport + Repair/Modification + Export/Shipping + other agreed charges.**

Current intended NK Service Fee:
**10% of actual vehicle purchase price**, configurable before production activation.

Do not apply the 10% silently to pass-through costs.

Future support:
- minimum commission
- volume/fleet tiers
- negotiated commission
- inspection-fee credits after purchase if configured

All important calculations must be deterministic.

## 8. Inspection Network

Future/near-term direction:

Vehicle Case
-> Request Inspection
-> calculate location/travel fee
-> assign/match NK employee, freelancer, partner garage, or inspection company
-> standardized checklist/evidence
-> AI customer-language summary
-> customer purchase decision.

Inspection/travel fees must come from configured deterministic rules/rate tables, not AI estimates.

## 9. Current rebuild target

Minimum Buying Browser V1:

1. customer account/app shell
2. mobile Browse Vehicles UI
3. Search / filters / location
4. Paste Vehicle Link
5. Save Vehicle
6. Vehicle Case
7. AI translation / normalized vehicle details boundary
8. Ask NK AI
9. Check Availability workflow
10. transparent price calculator with configurable service commission
11. Request Inspection
12. inspection/travel pricing structure
13. My Cases
14. messages/conversation-history structure
15. Owner/internal source information
16. source-adapter boundary
17. mobile-accessible preview
18. relevant tests/build passing

Do not expand into full Payment/Purchase/Shipping ERP before this customer journey is proven.

### Preview completion

All 18 Buying Browser V1 preview targets are implemented additively under `/buy` on `codex/buying-browser-rebuild`:

- customer shell, Browse, Saved, Vehicle detail, My Cases, Inspections, Messages, Account, and separate Owner demo routes;
- text search plus year, price, mileage, location, transmission, drive, body, and sort controls;
- Paste Link through the real import boundary when supported, with an honest photo/text/manual fallback when blocked and a reload-safe multi-photo preview gallery;
- customer-safe normalized English vehicle facts, one Owner-selected captured snapshot plus labeled demo data, deterministic grounded NK AI preview replies, and no invented facts;
- deduplicated Vehicle Cases, availability requests, inspection requests, case timelines, and conversation history;
- deterministic 10% preview commission on vehicle price only, explicit inspection/travel zones, and Pending pass-through costs;
- separate customer and internal source DTOs with customer redaction tests;
- responsive verification at 390 x 844 and 1280 x 900 with no horizontal overflow or browser console errors.

Preview state is intentionally browser-local and snapshot/demo source-adapter backed. Production Auth, tenant isolation, RLS, durable storage, encrypted source sessions, real AI, real provider assignment, and real messaging remain blocked integrations rather than simulated successes.

### One-car captured snapshot

`NK-POC-2026-0001` is the first Owner-selected real listing snapshot shown in the Buying Browser. It has a seeded customer-safe Vehicle Case, reviewed English facts, nine customer-safe images, deterministic preview pricing, and the existing case actions. The 18 original images, source URL, seller/source notes, and Google Sheet/Drive evidence stay behind the internal preview boundary.

This is not a live Marketplace or Google Sheet integration. The UI labels it `Captured`, the adapter reports `snapshot`, and availability remains unverified. The odometer image shows 24,623 km while listing text states 24,000 km, so mileage remains an explicit evidence conflict requiring review.

### Real-source proof of concept

The earlier iframe result remains valid for web pages but does not decide native browser behavior. The Owner-approved direction now tests native WKWebView, Android WebView, and WebView2 directly. No adapter may bypass Facebook security controls.

External share capture remains a proven fallback. Supported installed Chromium PWAs receive an actual Marketplace URL through `/buy/share`; signed native share targets are required for platform-complete fallback delivery.

Approach 3, a remote isolated browser session, remains a contingency and was not selected because approach 2 works without NK taking custody of the customer's Facebook session.

## 10. Current technical strategy

Prefer reuse over rewrite.

Keep business logic independent from UI and source adapters.

Important conceptual modules:
- SourceAdapter
- SourceSession/Profile Manager
- VehicleNormalizer
- VehicleIntelligence
- VehicleCase service
- Availability Verification workflow
- Pricing/Commission engine
- Inspection Quote/Assignment boundary
- customer-safe presenter/DTO

Use the repository's existing production architecture where it remains sound.

## 11. Working assumptions

- Current public/old implementation remains rollback/reference.
- No production deployment without Owner approval.
- No destructive replacement until mobile preview is reviewed.
- Real Facebook/LINE/source integrations may remain blocked by authentication/platform constraints; implement honest adapter/fallback interfaces and continue other V1 work.
- Real external messaging remains approval-gated until explicitly authorized.

## 12. Codex routine workflow

For each small milestone:

1. Read `AGENTS.md` + this file.
2. Inspect only task-relevant files.
3. Implement.
4. Run targeted tests.
5. Run broader checks only when warranted/milestone complete.
6. Fix issues.
7. Update this file if current state materially changed.
8. Commit and push stable work.
9. Report only: result, tests, commit SHA, blocker/next item.

Do not reread the full Master Spec unless scope is ambiguous or changing.
