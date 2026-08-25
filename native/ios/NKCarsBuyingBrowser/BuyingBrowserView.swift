import SwiftUI
import WebKit

struct WebViewContainer: UIViewRepresentable {
    let webView: WKWebView
    func makeUIView(context: Context) -> WKWebView { webView }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

struct BuyingBrowserView: View {
    @StateObject private var model = BrowserModel()

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Button(action: model.goBack) { Image(systemName: "chevron.left") }.disabled(!model.canGoBack)
                VStack(alignment: .leading, spacing: 1) {
                    Text("NK Cars Browser").font(.headline)
                    Text(model.currentURL?.host ?? "facebook.com").font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Button(action: model.reload) { Image(systemName: "arrow.clockwise") }
                Button {
                    if let url = model.currentURL { UIApplication.shared.open(url) }
                } label: { Image(systemName: "safari") }
            }
            .padding(.horizontal, 14).frame(height: 58).background(Color.white)

            WebViewContainer(webView: model.webView)

            HStack(spacing: 4) {
                action("Save to NK", icon: "bookmark", action: "save")
                action("Translate", icon: "character.book.closed", action: "translate")
                action("Ask NK AI", icon: "bubble.left.and.bubble.right", action: "ask_ai")
                action("Check Car", icon: "checkmark.shield", action: "check_car")
                Button { model.webView.load(URLRequest(url: BrowserPolicy.nkBaseURL.appending(path: "/buy"))) } label: {
                    Label("More", systemImage: "ellipsis").labelStyle(.iconOnly).frame(maxWidth: .infinity)
                }
            }
            .padding(8).background(Color(red: 0.06, green: 0.17, blue: 0.24)).tint(.white)
        }
        .alert("Saved to NK Cars", isPresented: Binding(get: { model.savedCaseID != nil }, set: { if !$0 { model.savedCaseID = nil } })) {
            Button("View Case", role: .cancel) {}
        } message: {
            Text("\(model.savedCaseID ?? "Vehicle Case")\nAvailability and current price are not yet confirmed.")
        }
    }

    private func action(_ title: String, icon: String, action: String) -> some View {
        Button { model.save(action: action) } label: {
            VStack(spacing: 3) { Image(systemName: icon); Text(title).font(.system(size: 9)) }.frame(maxWidth: .infinity)
        }.disabled(!model.listingActionsEnabled)
    }
}
