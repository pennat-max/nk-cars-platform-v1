package com.nkcars.buyingbrowser;

import java.net.URI;

public final class BrowserPolicy {
    private BrowserPolicy() {}

    public static boolean isMarketplaceListing(String value) {
        try {
            URI uri = URI.create(value);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            return "https".equals(uri.getScheme()) && (host.equals("facebook.com") || host.endsWith(".facebook.com"))
                && uri.getPath() != null && uri.getPath().matches("/marketplace/item/[0-9]+/?");
        } catch (Exception ignored) {
            return false;
        }
    }
}
