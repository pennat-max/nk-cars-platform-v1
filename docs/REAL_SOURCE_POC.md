# NK Cars Real Facebook Source Proof Of Concept

Status: First viable compliant path proven on 2026-08-24
Branch: `codex/buying-browser-rebuild`
Selected architecture: External Facebook app/browser plus Share or Copy Link handoff to NK

## Required Flow

Customer opens NK -> opens Facebook Marketplace outside NK using the customer's own Facebook session -> browses and selects a real listing -> uses Share or Copy Link -> returns the selected URL to NK -> NK captures permitted listing evidence -> creates a Vehicle Case -> translation, availability, communication, pricing, and inspection workflows continue from the case.

NK never receives or stores the Facebook password, MFA response, CAPTCHA response, or session cookie in this path.

## Approach Results

### 1. Managed Or Embedded Facebook Session

Result: Rejected for an embedded NK frame.

The real Marketplace listing response was tested on 2026-08-24. Facebook returned `X-Frame-Options: DENY`, so Facebook Marketplace cannot be rendered inside an NK iframe. NK must not proxy or modify Facebook headers to bypass this control.

### 2. External Facebook App/Browser Handoff

Result: Selected and proven.

The Owner supplied this real Facebook share URL from the Facebook browsing flow:

`https://www.facebook.com/share/1DF6CzLM1A/?mibextid=wwXIfr`

The NK import boundary resolved it to the canonical listing:

`https://www.facebook.com/marketplace/item/1716607786274590/`

Accessible evidence returned by Facebook public metadata:

- Title: `2025 Toyota HILUX REVO 2.8 4WD GR SPORT WIDE`
- Brand/model/year: Toyota Hilux Revo 2025
- Grade: GR SPORT WIDE
- Engine: 2.8L
- Drive: 4WD
- Body: Double Cab
- Mileage: 24,000 km
- Accessible images: 1

The source price, seller/contact, exact location, complete gallery, and current availability were not accessible. NK left those fields Pending and did not invent them.

Browser verification created `NK-CASE-2026-001245` from this real listing. The case timeline recorded that the external source link was captured internally. The customer case did not render the Facebook URL, seller identity, or seller contact. The Owner/internal preview resolved the case back to the canonical Marketplace URL.

### 3. Remote Isolated Browser Session

Result: Not selected for this milestone because approach 2 is viable.

The existing `marketplace-connector` remains a contingency for future customer-specific managed browsing. It requires manual Facebook login in an isolated profile, secure production session storage, monitoring, and an approved connector runtime. It must stop for login, MFA, CAPTCHA, or checkpoints and must not become a hidden scraping dependency.

## Implemented POC Boundary

- `/buy/paste` opens Facebook Marketplace in a separate browser/app context.
- The customer can return a link by normal paste, a user-triggered clipboard read, or a `?url=`/`?text=` handoff parameter.
- NK validates the Facebook URL and calls the existing marketplace import boundary.
- A separate internal `SourceCapture` stores submitted URL, canonical URL, source reference, adapter, capture method, import status, and capture time.
- `VehicleCase.sourceCaptureId` links the customer-safe case to the internal capture without copying the URL into the customer vehicle DTO.
- Existing screenshot/photo/text fallback, normalized data, case, pricing, availability, AI, and inspection workflows remain unchanged.

## Production Gaps

- Replace browser-local SourceCapture and Vehicle Case persistence with authenticated tenant-scoped server storage, RLS, audit, backup, and encrypted handling where required.
- Add a supported mobile app/PWA/native share target only after platform compatibility testing. Manual Share/Copy Link remains the working baseline.
- Copy permitted operational evidence into first-party storage according to source rights and retention policy; do not rely indefinitely on expiring remote image URLs.
- Do not send seller messages or perform availability checks until an approved communication channel and send authorization exist.
- Production deployment remains Owner approval-gated.
