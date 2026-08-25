using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace NKCars.BuyingBrowser;

public partial class MainWindow : Window
{
    private const string MarketplaceUrl = "https://www.facebook.com/marketplace/";
    private readonly string _nkBaseUrl = Environment.GetEnvironmentVariable("NK_CARS_APP_URL")?.TrimEnd('/')
        ?? "https://nk-cars-buying-browser-v1-review-32d38b1.pennat.chatgpt.site";
    private readonly string _profileFolder;
    private readonly string? _smokeUrl;
    private readonly string? _smokeOutput;
    private readonly string? _startUrl;
    private bool _smokeCompleted;
    private Uri? _currentUri;

    public MainWindow()
    {
        InitializeComponent();
        var profileId = Environment.GetEnvironmentVariable("NK_CARS_PROFILE_ID") ?? Environment.UserName;
        _profileFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NKCars", "WebView2", StableProfileId(profileId));
        _smokeUrl = ReadArgument("--smoke-url=");
        _smokeOutput = ReadArgument("--smoke-output=");
        _startUrl = ReadArgument("--start-url=");
        if (_smokeUrl is not null)
        {
            WindowState = WindowState.Minimized;
            ShowInTaskbar = false;
            ShowActivated = false;
        }
        Loaded += InitializeBrowser;
    }

    private static string? ReadArgument(string prefix) => Environment.GetCommandLineArgs()
        .FirstOrDefault(argument => argument.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))?[prefix.Length..];

    private static string StableProfileId(string value)
    {
        var digest = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(digest)[..16].ToLowerInvariant();
    }

    private async void InitializeBrowser(object sender, RoutedEventArgs e)
    {
        try
        {
            Directory.CreateDirectory(_profileFolder);
            var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: _profileFolder);
            await Browser.EnsureCoreWebView2Async(environment);
            Browser.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            Browser.CoreWebView2.Settings.AreDevToolsEnabled = false;
            Browser.CoreWebView2.Settings.IsPasswordAutosaveEnabled = false;
            Browser.CoreWebView2.Settings.IsGeneralAutofillEnabled = false;
            Browser.CoreWebView2.NewWindowRequested += (_, args) => { args.Handled = true; Browser.CoreWebView2.Navigate(args.Uri); };
            Browser.CoreWebView2.SourceChanged += Browser_SourceChanged;
            Browser.CoreWebView2.NavigationCompleted += Browser_NavigationCompleted;
            Browser.CoreWebView2.ProcessFailed += (_, _) => SetStatus("Browser process stopped. Reload or use the external fallback.");
            Browser.CoreWebView2.Navigate(_smokeUrl ?? _startUrl ?? MarketplaceUrl);
        }
        catch (Exception exception)
        {
            SetStatus($"WebView2 unavailable: {exception.Message}");
            await WriteSmokeResult(false, exception.Message);
        }
    }

    private void Browser_SourceChanged(object? sender, CoreWebView2SourceChangedEventArgs e)
    {
        _currentUri = Uri.TryCreate(Browser.Source?.AbsoluteUri, UriKind.Absolute, out var uri) ? uri : null;
        DomainText.Text = _currentUri?.Host ?? "Unknown source";
        var isListing = IsMarketplaceListing(_currentUri);
        SaveButton.IsEnabled = isListing;
        TranslateButton.IsEnabled = isListing;
        AskButton.IsEnabled = isListing;
        CheckButton.IsEnabled = isListing;
        ConfirmationPanel.Visibility = Visibility.Collapsed;
        SetStatus(isListing ? "Real Marketplace listing detected. NK actions are available." : "Browse Facebook Marketplace normally.");
    }

    private async void Browser_NavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
    {
        BackButton.IsEnabled = Browser.CanGoBack;
        if (_currentUri?.AbsolutePath.StartsWith("/buy/cases/", StringComparison.OrdinalIgnoreCase) == true)
        {
            var caseId = _currentUri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? "Vehicle Case";
            CaseIdText.Text = caseId;
            ConfirmationPanel.Visibility = Visibility.Visible;
        }
        if (_smokeOutput is not null && !_smokeCompleted)
        {
            _smokeCompleted = true;
            await WriteSmokeResult(e.IsSuccess, e.IsSuccess ? null : e.WebErrorStatus.ToString());
            Application.Current.Shutdown(e.IsSuccess ? 0 : 1);
        }
    }

    private async Task WriteSmokeResult(bool success, string? error)
    {
        if (_smokeOutput is null) return;
        var result = new
        {
            platform = "windows",
            engine = "Microsoft WebView2",
            requestedUrl = _smokeUrl,
            finalUrl = _currentUri?.AbsoluteUri,
            navigationSuccess = success,
            realFacebookPage = _currentUri?.Host.EndsWith("facebook.com", StringComparison.OrdinalIgnoreCase) == true,
            marketplaceListingDetected = IsMarketplaceListing(_currentUri),
            currentListingUrlCapturable = IsMarketplaceListing(_currentUri),
            profileFolderExists = Directory.Exists(_profileFolder),
            persistentProfileId = Path.GetFileName(_profileFolder),
            facebookLoginTested = false,
            passwordCollectedByNk = false,
            error,
            testedAt = DateTimeOffset.UtcNow
        };
        Directory.CreateDirectory(Path.GetDirectoryName(_smokeOutput) ?? ".");
        await File.WriteAllTextAsync(_smokeOutput, JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true }));
    }

    private static bool IsMarketplaceListing(Uri? uri)
    {
        if (uri is null || !uri.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase)) return false;
        var host = uri.Host.ToLowerInvariant();
        if (host != "facebook.com" && !host.EndsWith(".facebook.com")) return false;
        var parts = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length >= 3 && parts[0].Equals("marketplace", StringComparison.OrdinalIgnoreCase)
            && parts[1].Equals("item", StringComparison.OrdinalIgnoreCase) && parts[2].All(char.IsDigit);
    }

    private void OpenNkCase(string action)
    {
        if (!IsMarketplaceListing(_currentUri)) return;
        var url = $"{_nkBaseUrl}/buy/share?url={Uri.EscapeDataString(_currentUri!.AbsoluteUri)}&source=windows_webview2&action={Uri.EscapeDataString(action)}";
        SetStatus("Saving the selected listing to NK Cars...");
        Browser.CoreWebView2.Navigate(url);
    }

    private void Back_Click(object sender, RoutedEventArgs e) { if (Browser.CanGoBack) Browser.GoBack(); }
    private void Reload_Click(object sender, RoutedEventArgs e) => Browser.Reload();
    private void Save_Click(object sender, RoutedEventArgs e) => OpenNkCase("save");
    private void Translate_Click(object sender, RoutedEventArgs e) => OpenNkCase("translate");
    private void Ask_Click(object sender, RoutedEventArgs e) => OpenNkCase("ask_ai");
    private void Check_Click(object sender, RoutedEventArgs e) => OpenNkCase("check_car");
    private void More_Click(object sender, RoutedEventArgs e) => Browser.CoreWebView2.Navigate(_nkBaseUrl + "/buy");

    private void External_Click(object sender, RoutedEventArgs e)
    {
        var target = _currentUri?.AbsoluteUri ?? MarketplaceUrl;
        Process.Start(new ProcessStartInfo(target) { UseShellExecute = true });
    }

    private void SetStatus(string text)
    {
        StatusText.Text = text;
        StatusPanel.Visibility = Visibility.Visible;
    }
}
