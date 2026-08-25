package com.nkcars.buyingbrowser;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;

public final class MainActivity extends Activity {
    private static final String MARKETPLACE_URL = "https://www.facebook.com/marketplace/";
    private static final String NK_BASE_URL = "https://nk-cars-buying-browser-v1-review-32d38b1.pennat.chatgpt.site";

    private WebView browser;
    private TextView domain;
    private Button save;
    private Button translate;
    private Button ask;
    private Button check;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        configureIsolatedProfile();
        setContentView(buildUi());
        configureBrowser();
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void configureIsolatedProfile() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return;
        var preferences = getSharedPreferences("nk_browser", MODE_PRIVATE);
        var profile = preferences.getString("profile_id", null);
        if (profile == null) {
            profile = UUID.randomUUID().toString();
            preferences.edit().putString("profile_id", profile).apply();
        }
        WebView.setDataDirectorySuffix(stableProfileId(profile));
    }

    private static String stableProfileId(String value) {
        try {
            var bytes = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            var result = new StringBuilder();
            for (int index = 0; index < 8; index++) result.append(String.format("%02x", bytes[index]));
            return result.toString();
        } catch (Exception ignored) {
            return "default";
        }
    }

    private View buildUi() {
        var root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(244, 247, 248));

        var top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(dp(8), dp(6), dp(8), dp(6));
        top.setBackgroundColor(Color.WHITE);
        var back = button("Back", view -> { if (browser.canGoBack()) browser.goBack(); });
        domain = new TextView(this);
        domain.setText("facebook.com");
        domain.setTextColor(Color.rgb(16, 43, 62));
        domain.setPadding(dp(10), 0, dp(10), 0);
        top.addView(back, new LinearLayout.LayoutParams(dp(72), dp(48)));
        top.addView(domain, new LinearLayout.LayoutParams(0, dp(48), 1));
        top.addView(button("Reload", view -> browser.reload()), new LinearLayout.LayoutParams(dp(72), dp(48)));
        top.addView(button("Open", view -> openExternally()), new LinearLayout.LayoutParams(dp(64), dp(48)));
        root.addView(top, new LinearLayout.LayoutParams(-1, dp(60)));

        browser = new WebView(this);
        root.addView(browser, new LinearLayout.LayoutParams(-1, 0, 1));

        var toolbar = new LinearLayout(this);
        toolbar.setPadding(dp(4), dp(6), dp(4), dp(6));
        toolbar.setBackgroundColor(Color.rgb(16, 43, 62));
        save = actionButton("Save to NK", "save");
        translate = actionButton("Translate", "translate");
        ask = actionButton("Ask NK AI", "ask_ai");
        check = actionButton("Check Car", "check_car");
        var more = button("More", view -> browser.loadUrl(NK_BASE_URL + "/buy"));
        toolbar.addView(save, weighted());
        toolbar.addView(translate, weighted());
        toolbar.addView(ask, weighted());
        toolbar.addView(check, weighted());
        toolbar.addView(more, weighted());
        root.addView(toolbar, new LinearLayout.LayoutParams(-1, dp(76)));
        setListingActions(false);
        return root;
    }

    private void configureBrowser() {
        var settings = browser.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSaveFormData(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(browser, true);
        browser.setWebChromeClient(new WebChromeClient());
        browser.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                Uri uri = Uri.parse(url);
                domain.setText(uri.getHost() == null ? "Unknown source" : uri.getHost());
                setListingActions(BrowserPolicy.isMarketplaceListing(url));
                if (uri.getPath() != null && uri.getPath().startsWith("/buy/cases/")) showCaseConfirmation(uri);
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel();
            }
        });
    }

    private void handleIntent(Intent intent) {
        if (Intent.ACTION_SEND.equals(intent.getAction())) {
            var shared = intent.getStringExtra(Intent.EXTRA_TEXT);
            var facebookUrl = firstFacebookUrl(shared);
            if (facebookUrl != null) {
                browser.loadUrl(nkCaptureUrl(facebookUrl, "save"));
                return;
            }
        }
        browser.loadUrl(MARKETPLACE_URL);
    }

    private Button actionButton(String label, String action) {
        return button(label, view -> {
            var current = browser.getUrl();
            if (current != null && BrowserPolicy.isMarketplaceListing(current)) browser.loadUrl(nkCaptureUrl(current, action));
        });
    }

    private String nkCaptureUrl(String url, String action) {
        return NK_BASE_URL + "/buy/share?url=" + Uri.encode(url) + "&source=android_webview&action=" + Uri.encode(action);
    }

    private static String firstFacebookUrl(String text) {
        if (text == null) return null;
        for (String token : text.split("\\s+")) {
            if (token.startsWith("https://") && token.toLowerCase().contains("facebook.com")) return token;
        }
        return null;
    }

    private void showCaseConfirmation(Uri uri) {
        var parts = uri.getPathSegments();
        var caseId = parts.isEmpty() ? "Vehicle Case" : parts.get(parts.size() - 1);
        new AlertDialog.Builder(this)
            .setTitle("Saved to NK Cars")
            .setMessage(caseId + "\nAvailability and current price are not yet confirmed.")
            .setPositiveButton("View Case", null)
            .show();
    }

    private void openExternally() {
        var current = browser.getUrl();
        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(current == null ? MARKETPLACE_URL : current)));
    }

    private void setListingActions(boolean enabled) {
        save.setEnabled(enabled);
        translate.setEnabled(enabled);
        ask.setEnabled(enabled);
        check.setEnabled(enabled);
    }

    private Button button(String label, View.OnClickListener listener) {
        var button = new Button(this);
        button.setText(label);
        button.setTextSize(11);
        button.setAllCaps(false);
        button.setOnClickListener(listener);
        return button;
    }

    private LinearLayout.LayoutParams weighted() {
        var params = new LinearLayout.LayoutParams(0, -1, 1);
        params.setMargins(dp(2), 0, dp(2), 0);
        return params;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onBackPressed() {
        if (browser.canGoBack()) browser.goBack(); else super.onBackPressed();
    }
}
