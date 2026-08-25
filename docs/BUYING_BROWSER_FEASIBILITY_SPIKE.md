# NK Cars Buying Browser - Authenticated Facebook Feasibility Spike

Status: Superseded for primary architecture by the Owner-approved native cross-platform direction on 2026-08-25. External Share remains a required fallback and the evidence below remains historical context.
Date: 2026-08-24
Branch: `codex/buying-browser-rebuild`

## Historical Decision

This decision was superseded by the explicit Owner direction to test top-level WKWebView, Android WebView, and WebView2 adapters. The no-proxy, no-security-bypass, no-NK-credential-collection rules remain binding. The historical selected architecture was:

1. Open the real Facebook Marketplace in the customer's external Facebook app or system browser, preserving the customer's own authenticated session.
2. The customer chooses a real listing and invokes the operating-system Share action.
3. `Save to NK Cars` receives only the shared URL.
4. NK validates and imports permitted evidence, creates an internal `SourceCapture`, atomically creates a customer-safe Vehicle Case, and opens that case.
5. Copy/paste and screenshots/photos remain last-resort fallbacks.

This is Success Option B. Success Option A was not demonstrated and must not be claimed.

## Test Matrix

| Architecture | Real session | Can NK capture selected listing? | Mobile/iPhone | Desktop | Result |
|---|---|---|---|---|---|
| Facebook in NK iframe | Customer browser session in theory | No | No | No | Blocked by the real response header `X-Frame-Options: DENY` |
| System browser / Facebook app | Yes, owned by customer | Only after explicit Share/Copy Link | Yes | Yes | Approved source-browsing boundary |
| iOS in-app browser tab (`SFSafariViewController` pattern) | Can share Safari authentication state | Host app cannot inspect or modify Facebook content by design | Native app only | N/A | Useful for low-context switching, but selection still requires Share/deep-link handoff |
| NK-controlled WebView (`WKWebView`/Android WebView) | Separate app-controlled session; usually not the customer's existing Facebook app session | Technically inspectable by host app | Possible but unsafe | Possible | Rejected for Facebook authentication/session custody |
| Remote isolated browser streamed through NK | Real only after customer logs into NK-hosted remote browser | Technically possible through automation/remote UI | High latency and session-custody risk | Possible | Contingency only; not proven with an authorized customer session and not approved for production |
| Installed PWA Web Share Target | Uses external Facebook session; NK receives URL only | Yes | Android Chromium yes; iPhone Safari no | Chromium yes | Implemented at `/buy/share` |
| Native iOS Share Extension | Uses Facebook app/Safari share sheet; NK receives URL only | Yes | Best iPhone architecture | N/A | Requires an iOS containing app, Xcode signing, authenticated server persistence, and installation; not available in this web-only Windows environment |

## Evidence

### Real Facebook response

Tested against the Owner-supplied Marketplace item `1716607786274590` and the Marketplace root on 2026-08-24. Both returned HTTP 200, `X-Frame-Options: DENY`, `Cross-Origin-Resource-Policy: same-origin`, and a restrictive Facebook Content Security Policy. This proves an iframe cannot be the Buying Browser. NK will not bypass or strip these controls.

### Embedded authentication risk

[IETF RFC 8252](https://www.rfc-editor.org/rfc/rfc8252.html) defines an external user-agent as a separate security domain that the app cannot inspect, recommends browser/in-app browser tabs, and states that native apps must not use embedded user-agents for authorization because the host can access credentials and cookies. Facebook Marketplace is not an NK OAuth authorization flow, but the same credential/session-custody risk applies to asking customers to log into Facebook inside an NK-controlled WebView.

### Web Share Target compatibility

The [Chrome Web Share Target documentation](https://developer.chrome.com/docs/capabilities/web-apis/web-share-target) supports an installed PWA registering as an operating-system share target. Current [MDN browser compatibility data](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/share_target.json) records support in Chrome desktop from 89 and Chrome Android from 76, but no support in Safari or Safari iOS.

### Native iPhone share

Apple's [Share Extension documentation](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/Share.html) confirms that iOS users tap Share and choose an installed app's Share extension, and that the extension receives links/text/attachments through its extension context. This requires a containing iOS app and an Xcode Share Extension target; a website alone cannot register this iPhone share-sheet destination.

## Implemented Proof

- `/buy` is now the real-source launch surface, not the demo vehicle grid.
- The real Facebook Marketplace opens externally under the customer's session.
- `public/manifest.webmanifest` registers `Save to NK Cars` through `share_target` at `/buy/share` for supported installed PWAs.
- `/buy/share?url=...` validates a Facebook URL, calls the real marketplace import boundary, records `captureMethod: web_share_target`, creates the Vehicle Case atomically, and opens it automatically.
- `/buy/browse` retains NK/demo results as a secondary path.
- `/buy/paste` is explicitly the last-resort fallback.
- Existing case, pricing, inspection, customer redaction, Owner source, and grounded NK AI boundaries remain intact.

## Real Marketplace Data Result

The supplied real Facebook URL was used successfully. Publicly accessible evidence resolved to the canonical Marketplace item and produced real title/spec/mileage evidence plus one public image. Facebook did not expose the full authenticated gallery, seller/contact, exact location, source price, or live availability to the public session; those fields remain Pending rather than invented.

## Remaining Blockers

### iPhone one-share delivery

Required before `Save to NK Cars` can appear in the iPhone Facebook share sheet:

- Apple Developer account/team and explicit external-service consent;
- a signed NK Cars iOS containing app with Share Extension target;
- NK customer authentication shared safely with the extension;
- durable tenant-scoped server endpoint for SourceCapture and Vehicle Case creation;
- Associated Domains/Universal Links and App Store/TestFlight distribution;
- physical iPhone verification using the Facebook app share sheet.

No password, OTP, MFA response, CAPTCHA, Facebook cookie, Apple credential, or production secret is requested or stored by the current implementation.

### Remote-browser contingency

Before activation it requires Meta/platform and legal review, encrypted per-customer session storage, a streamed browser runtime, strict process/network isolation, credential-entry protections, session deletion/export controls, rate limits, monitoring, and a real customer-authorized login test. The current Playwright connector proves adapter/profile/queue mechanics only; it does not prove a compliant customer-presented remote browser.

## Production Gate

No production deployment is approved. The separate Owner-only ChatGPT Site remains a review preview only.
