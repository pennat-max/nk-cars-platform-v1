import Foundation
import Combine
import WebKit

@MainActor
final class BrowserModel: NSObject, ObservableObject, WKNavigationDelegate {
    @Published var currentURL: URL?
    @Published var canGoBack = false
    @Published var listingActionsEnabled = false
    @Published var savedCaseID: String?

    let webView: WKWebView

    override init() {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init()
        webView.navigationDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.load(URLRequest(url: BrowserPolicy.marketplaceURL))
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        currentURL = webView.url
        canGoBack = webView.canGoBack
        listingActionsEnabled = BrowserPolicy.isMarketplaceListing(webView.url)
        let parts = webView.url?.pathComponents.filter { $0 != "/" } ?? []
        if parts.count >= 3 && parts[0] == "buy" && parts[1] == "cases" {
            savedCaseID = parts[2]
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        currentURL = webView.url
        listingActionsEnabled = false
    }

    func save(action: String) {
        guard let currentURL, BrowserPolicy.isMarketplaceListing(currentURL),
              let captureURL = BrowserPolicy.nkCaptureURL(listingURL: currentURL, action: action) else { return }
        webView.load(URLRequest(url: captureURL))
    }

    func goBack() { if webView.canGoBack { webView.goBack() } }
    func reload() { webView.reload() }
}
