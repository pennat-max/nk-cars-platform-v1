# NK Cars - CURRENT V1

Status: Active working context for Codex
Purpose: Keep routine development fast and token-efficient.

Use this file with `AGENTS.md` as the default context. Consult larger product specs only when necessary.

## 1. Current product

NK Cars is being rebuilt as an **AI Vehicle Buying Browser / Buying Platform for Thailand**.

Primary customer journey:

**Browse Vehicles OR Paste Vehicle Link OR Ask NK AI to Find One**
-> customer selects/saves a vehicle
-> create Vehicle Case
-> AI translates/normalizes vehicle information
-> Check Availability
-> Request Inspection
-> transparent NK pricing
-> later Buy Through NK / procurement / export.

The old stock-first implementation remains a rollback/reference and must not be destructively removed before the new preview is approved.

## 2. Current customer UX direction

Mobile-first, especially iPhone.

Browse experience:
- NK-branded marketplace-style vehicle grid
- search
- year / price / mileage / transmission / drive / body filters
- Thai vehicle search area/location
- saved vehicles
- progressive AI translation/analysis

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
