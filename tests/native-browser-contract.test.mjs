import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('native browser adapters share the approved capture and security contract', async () => {
  const contract = JSON.parse(await read('native/shared/browser-adapter-contract.json'))

  assert.deepEqual(contract.captureSources.sort(), [
    'android_webview',
    'ios_wkwebview',
    'windows_webview2',
  ])
  assert.equal(contract.security.injectBridgeIntoFacebook, false)
  assert.equal(contract.security.collectFacebookPassword, false)
  assert.equal(contract.security.persistFacebookPassword, false)
  assert.equal(contract.security.bypassMfaCaptchaOrCheckpoint, false)
  assert.equal(contract.security.captureOnlyAfterExplicitSave, true)
})

test('each native adapter uses its platform browser and explicit capture source', async () => {
  const [windows, android, ios] = await Promise.all([
    read('native/windows/NKCars.BuyingBrowser/MainWindow.xaml.cs'),
    read('native/android/app/src/main/java/com/nkcars/buyingbrowser/MainActivity.java'),
    read('native/ios/NKCarsBuyingBrowser/BrowserModel.swift'),
  ])

  assert.match(windows, /CoreWebView2Environment/)
  assert.match(windows, /source=windows_webview2/)
  assert.doesNotMatch(windows, /AddHostObjectToScript|AddScriptToExecuteOnDocumentCreated/)

  assert.match(android, /new WebView/)
  assert.match(android, /source=android_webview/)
  assert.match(android, /BrowserPolicy\.isMarketplaceListing/)
  assert.match(android, /Intent\.ACTION_VIEW/)
  assert.doesNotMatch(android, /addJavascriptInterface/)

  assert.match(ios, /WKWebView/)
  const iosPolicy = await read('native/ios/NKCarsBuyingBrowser/BrowserPolicy.swift')
  assert.match(iosPolicy, /name: "source", value: "ios_wkwebview"/)
  assert.match(await read('native/ios/NKCarsBuyingBrowser/BuyingBrowserView.swift'), /UIApplication\.shared\.open/)
  assert.doesNotMatch(ios, /addScriptMessageHandler|WKUserScript/)
})

test('native adapters recognize only HTTPS Facebook Marketplace item URLs', async () => {
  const contract = JSON.parse(await read('native/shared/browser-adapter-contract.json'))
  const listingPattern = new RegExp(contract.listingUrlPattern, 'i')

  assert.equal(listingPattern.test('https://www.facebook.com/marketplace/item/1716607786274590/'), true)
  assert.equal(listingPattern.test('https://m.facebook.com/marketplace/item/1716607786274590/?ref=share'), true)
  assert.equal(listingPattern.test('http://www.facebook.com/marketplace/item/1716607786274590/'), false)
  assert.equal(listingPattern.test('https://evil.example/marketplace/item/1716607786274590/'), false)
  assert.equal(listingPattern.test('https://www.facebook.com/marketplace/'), false)
})

test('Windows technical shell exposes the required manual browser controls and persistent profile', async () => {
  const [xaml, windows] = await Promise.all([
    read('native/windows/NKCars.BuyingBrowser/MainWindow.xaml'),
    read('native/windows/NKCars.BuyingBrowser/MainWindow.xaml.cs'),
  ])

  for (const control of ['BackButton', 'ForwardButton', 'AddressBar', 'SaveButton', 'View Vehicle Case']) {
    assert.match(xaml, new RegExp(control.replaceAll(' ', '\\s+')))
  }
  for (const handler of ['Reload_Click', 'Home_Click', 'Go_Click', 'Save_Click']) {
    assert.match(xaml, new RegExp(handler))
  }
  assert.match(windows, /CoreWebView2Environment\.CreateAsync\(userDataFolder: _profileFolder\)/)
  assert.match(windows, /LocalApplicationData/)
  assert.match(windows, /AddressBar\.Text = _currentUri\?\.AbsoluteUri/)
})
