# Android WebView Adapter

The Android adapter uses the platform WebView and a per-install data-directory suffix. Cookies and Facebook session state remain in the app sandbox. NK injects no JavaScript interface into Facebook and sends only the current listing URL after an explicit NK action.

It also registers as a text Share target. If embedded Facebook login or Marketplace navigation is blocked, Facebook can open externally and Share directly to NK Cars; the same Vehicle Case route is used.

Build prerequisites: JDK 17 and Android SDK 35. Device/emulator login, session persistence, search, filters, and real-listing capture require a human-operated Android device or emulator; MFA/CAPTCHA/checkpoints are never automated.
