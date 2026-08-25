import type { SourceCapture } from "./types";

export const NATIVE_BROWSER_SOURCES = ["ios_wkwebview", "android_webview", "windows_webview2"] as const;

export type NativeBrowserSource = typeof NATIVE_BROWSER_SOURCES[number];

export function nativeCaptureMethod(value: string | null): SourceCapture["captureMethod"] {
  return NATIVE_BROWSER_SOURCES.includes(value as NativeBrowserSource)
    ? value as NativeBrowserSource
    : "web_share_target";
}

export function isFacebookMarketplaceListing(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return (host === "facebook.com" || host.endsWith(".facebook.com"))
      && /^\/marketplace\/item\/\d+\/?$/i.test(url.pathname);
  } catch {
    return false;
  }
}
