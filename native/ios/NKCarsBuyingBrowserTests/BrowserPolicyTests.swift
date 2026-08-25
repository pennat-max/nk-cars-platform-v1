import XCTest
@testable import NKCarsBuyingBrowser

final class BrowserPolicyTests: XCTestCase {
    func testDetectsRealMarketplaceListing() {
        XCTAssertTrue(BrowserPolicy.isMarketplaceListing(URL(string: "https://www.facebook.com/marketplace/item/1716607786274590/")))
        XCTAssertFalse(BrowserPolicy.isMarketplaceListing(URL(string: "https://www.facebook.com/marketplace/")))
    }

    func testBuildsCustomerExplicitCaptureURL() {
        let listing = URL(string: "https://www.facebook.com/marketplace/item/1716607786274590/")!
        let result = BrowserPolicy.nkCaptureURL(listingURL: listing, action: "save")!.absoluteString
        XCTAssertTrue(result.contains("source=ios_wkwebview"))
        XCTAssertTrue(result.contains("1716607786274590"))
    }
}
