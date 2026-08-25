# NK Cars Cross-Platform Buying Browser

Status: Owner-approved V1 technical direction. This document supersedes conflicting external-share-only conclusions in earlier feasibility notes.

## Architecture

One shared NK application and domain layer receives explicit listing captures through `/buy/share`. Platform adapters contain only browser/session/navigation behavior:

- iOS: `WKWebView`
- Android: Android `WebView`
- Windows: Microsoft `WebView2`

Each adapter keeps its browser data in the app/device profile, recognizes an HTTPS Facebook Marketplace item URL, and enables the native NK toolbar only on a recognized listing. Selecting an NK action sends the current URL and capture provenance to the existing Vehicle Case flow. No DOM bridge or credential collector is injected into Facebook.

## Security Boundary

- The customer authenticates directly inside Facebook.
- NK does not request, collect, or store Facebook passwords.
- MFA, CAPTCHA, checkpoints, rate limits, and access controls are never bypassed.
- Only the selected listing URL is sent to NK after an explicit customer action.
- Facebook content and session storage remain local to the native browser profile.

## Fallbacks

If Facebook blocks embedded browsing or login on a platform:

1. open Facebook externally and Share to NK Cars;
2. copy the listing link and import it through NK;
3. retain screenshots, photos, and listing-text evidence when source metadata is unavailable.

The shared Vehicle Case, translation, pricing, inspection, messaging, internal source view, and customer-safe DTO boundaries remain unchanged behind these adapters.
