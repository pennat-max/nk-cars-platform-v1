import Foundation

enum BrowserPolicy {
    static let marketplaceURL = URL(string: "https://www.facebook.com/marketplace/")!
    static let nkBaseURL = URL(string: "https://nk-cars-buying-browser-v1-review-32d38b1.pennat.chatgpt.site")!

    static func isMarketplaceListing(_ url: URL?) -> Bool {
        guard let url, url.scheme?.lowercased() == "https", let host = url.host?.lowercased() else { return false }
        guard host == "facebook.com" || host.hasSuffix(".facebook.com") else { return false }
        let parts = url.pathComponents.filter { $0 != "/" }
        return parts.count >= 3 && parts[0].lowercased() == "marketplace"
            && parts[1].lowercased() == "item" && parts[2].allSatisfy(\.isNumber)
    }

    static func nkCaptureURL(listingURL: URL, action: String) -> URL? {
        var components = URLComponents(url: nkBaseURL.appending(path: "/buy/share"), resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "url", value: listingURL.absoluteString),
            URLQueryItem(name: "source", value: "ios_wkwebview"),
            URLQueryItem(name: "action", value: action)
        ]
        return components?.url
    }
}
