import com.nkcars.buyingbrowser.BrowserPolicy;

public final class BrowserPolicyTest {
    public static void main(String[] args) {
        require(BrowserPolicy.isMarketplaceListing("https://www.facebook.com/marketplace/item/1716607786274590/"));
        require(BrowserPolicy.isMarketplaceListing("https://m.facebook.com/marketplace/item/1716607786274590/?ref=share"));
        require(!BrowserPolicy.isMarketplaceListing("http://www.facebook.com/marketplace/item/1716607786274590/"));
        require(!BrowserPolicy.isMarketplaceListing("https://evil.example/marketplace/item/1716607786274590/"));
        require(!BrowserPolicy.isMarketplaceListing("https://www.facebook.com/marketplace/"));
        System.out.println("Android BrowserPolicy tests passed");
    }

    private static void require(boolean condition) {
        if (!condition) throw new AssertionError("BrowserPolicy assertion failed");
    }
}
