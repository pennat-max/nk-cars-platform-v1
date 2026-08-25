# iOS WKWebView Adapter

The iOS adapter uses `WKWebsiteDataStore.default()` so Facebook cookies/session state persist inside the NK app sandbox across launches. It does not share the Facebook app's cookie store, inject a script message handler into Facebook, or collect login fields. The customer signs in directly on Facebook's page and handles MFA/CAPTCHA/checkpoints themselves.

Generate the Xcode project on macOS with XcodeGen, then build/test in Xcode:

```bash
xcodegen generate --spec native/ios/project.yml
xcodebuild test -project native/ios/NKCarsBuyingBrowser.xcodeproj -scheme NKCarsBuyingBrowser -destination 'platform=iOS Simulator,name=iPhone 16'
```

This Windows environment cannot run Xcode, the iOS Simulator, TestFlight signing, or a physical-iPhone Facebook login test. Source and policy tests are included, but runtime success must remain unclaimed until those macOS/device checks pass.
