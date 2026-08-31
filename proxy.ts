import { NextRequest, NextResponse } from "next/server";

const HISPEED_DOMAINS = new Set(["xiangshihai.com", "www.xiangshihai.com"]);
const HISPEED_SHORT_PATHS = new Set(["/vehicles", "/saved", "/shipments", "/cases", "/account"]);

function requestHost(request: NextRequest) {
  return (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(":")[0].toLowerCase();
}

function isHiSpeedShortPath(pathname: string) {
  return Array.from(HISPEED_SHORT_PATHS).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const host = requestHost(request);
  if (!HISPEED_DOMAINS.has(host)) return NextResponse.next();

  const url = request.nextUrl.clone();
  if (url.pathname === "/") {
    url.pathname = "/hispeed";
    return NextResponse.rewrite(url);
  }

  if (url.pathname === "/buy" || url.pathname.startsWith("/buy/")) {
    url.pathname = "/hispeed";
    return NextResponse.redirect(url);
  }

  if (isHiSpeedShortPath(url.pathname)) {
    url.pathname = `/hispeed${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
