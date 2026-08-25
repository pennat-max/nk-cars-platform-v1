# Windows WebView2 Adapter

This WPF shell uses Microsoft WebView2 with a persistent profile isolated under the current Windows user. Facebook receives login input directly inside WebView2; NK does not render or collect a Facebook credential form, disables password/autofill storage at the host setting, injects no script bridge into Facebook, and captures only the current Marketplace listing URL after the customer presses an NK action.

Build from the repository root after restoring the WebView2 package:

```powershell
dotnet build native/windows/NKCars.BuyingBrowser/NKCars.BuyingBrowser.csproj
```

The smoke mode navigates a real URL and writes non-sensitive engine/navigation evidence:

```powershell
NKCars.BuyingBrowser.exe --smoke-url=https://www.facebook.com/marketplace/item/1716607786274590/ --smoke-output=smoke.json
```

Facebook login, MFA, CAPTCHA, and checkpoint handling remain entirely inside Facebook. A human must complete those steps; the POC never automates or bypasses them.

## Manual Marketplace test

1. Run `NKCars.BuyingBrowser.exe` from the Release output.
2. Log in directly on Facebook if requested. Do not enter Facebook credentials anywhere except Facebook's page inside WebView2.
3. Search for `Revo`, use Marketplace filters, open a vehicle, and browse its photos/details.
4. On a URL matching `https://www.facebook.com/marketplace/item/<number>/`, click **Save to NK**.
5. Wait for the NK case page and confirmation containing the Case ID.
6. Close the whole NK Browser window, reopen the same executable, and confirm Facebook remains signed in. The persistent WebView2 profile is under the current Windows user's local application data directory.

If Facebook presents MFA, CAPTCHA, checkpoint, unsupported-browser, cookie, or navigation errors, complete only Facebook's normal human flow. Record the visible message; do not bypass it.
