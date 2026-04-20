import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, getAccessCookieSecret } from "@/lib/access";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const allowList =
    pathname === "/unlock" ||
    pathname.startsWith("/api/unlock") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (allowList) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (token === getAccessCookieSecret()) {
    return NextResponse.next();
  }

  const unlockUrl = new URL("/unlock", request.url);
  const nextPath = pathname === "/" ? "/" : `${pathname}${search}`;
  unlockUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ["/:path*"]
};
