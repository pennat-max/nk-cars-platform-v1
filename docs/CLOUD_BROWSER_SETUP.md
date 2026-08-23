# NK Cars Cloud Browser connector

For the Owner-controlled free alternative introduced by the Live AI Broker amendment, see `LOCAL_MARKETPLACE_CONNECTOR.md`. It uses Playwright with a dedicated local Chrome profile and the same connector boundary. Browserless remains an optional hosted adapter, not a required dependency.

The Add Vehicle flow includes a production integration boundary for a standard Browserless Chromium session. It opens a Facebook Marketplace URL, reads only content visible to the authenticated browser, walks the visible listing carousel, collects up to 30 reachable images, and sends that evidence to NK AI as one vehicle.

## Runtime variables

- `BROWSERLESS_TOKEN`: Browserless API token stored as a private Sites runtime secret.
- `BROWSERLESS_PROFILE`: saved Browserless Authenticated Profile name, for example `nk-facebook`.
- `BROWSERLESS_API_URL`: optional Browserless HTTPS origin. Defaults to `https://production-sfo.browserless.io`.

The existing `MARKETPLACE_CONNECTOR_URL` and `MARKETPLACE_CONNECTOR_TOKEN` remain supported as an alternate connector boundary.

## Phone-only setup

1. Create a Browserless account from a phone.
2. In Authenticated Profiles, create a profile named `nk-facebook` using the remote-browser sign-in flow.
3. Sign in to the business Facebook account in that remote browser and save the profile.
4. Add the Browserless token and profile name as private runtime environment variables for this Site.
5. Paste a Facebook Marketplace link in Add Vehicle and run Import & Analyze.

This setup is completed once. Routine imports do not require Owner approval or a new login while the saved profile remains valid. NK Cars detects counters such as `1 of 18` and reports whether the reachable gallery is complete.

Facebook may expire or challenge a saved session. When that happens, NK Cars returns `login_required` without displaying a provider error or stack trace. Refresh the Browserless profile, then retry. The source URL remains in the draft flow.

Facebook public metadata commonly contains only the cover image. Without the token/profile above, NK Cars cannot truthfully recover unseen carousel photos. The supported fallback is to select multiple screenshots/photos from the phone in one operation; NK AI analyzes the complete upload as one vehicle.

Customer-facing descriptions and pages do not display the source platform, source URL, seller/dealer identity or contact, source price, or sourcing location. Imported evidence remains available only in internal review surfaces.

## Guardrails

- Standard Chromium only.
- No password is stored by NK Cars.
- No CAPTCHA solving, stealth mode, proxy rotation, fingerprint spoofing, or security-check bypass.
- The connector stops and asks for human login when Facebook presents login or checkpoint UI.
- If no real listing evidence is accessible, the app does not invent vehicle data and falls back to screenshots/photos or pasted listing text.
