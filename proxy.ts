import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (ex-middleware) : vérifications optimistes basées sur la présence du cookie de session.
 * La sécurité réelle est assurée côté serveur (DAL) dans chaque page, action et route.
 */
const SESSION_COOKIE = "kayen_session";
const protectedPrefixes = ["/account", "/admin", "/checkout"];
const guestOnly = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession && protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (hasSession && guestOnly.includes(pathname)) {
    const next = request.nextUrl.searchParams.get("next");
    return NextResponse.redirect(new URL(next && next.startsWith("/") ? next : "/account", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|images|favicon.ico|icon|sitemap.xml|robots.txt|manifest.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
