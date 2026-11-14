import { NextResponse, type NextRequest } from "next/server";

/**
 * UX-level guard only (Next.js "proxy", formerly middleware): sends visitors without a session cookie to the login page.
 * Real authorization happens on the API for every request, so a forged cookie gets nothing.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(process.env.ADMIN_COOKIE_NAME ?? "sh_token");
  if (!hasSession && pathname !== "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
