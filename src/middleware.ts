import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_SESSION_IDLE_TIMEOUT_SECONDS,
  getAccessCookieSecret
} from "@/lib/access";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const allowList =
    pathname === "/unlock" ||
    pathname.startsWith("/api/unlock") ||
    pathname.startsWith("/api/funds") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (allowList) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (token === getAccessCookieSecret()) {
    const response = NextResponse.next();
    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_SESSION_IDLE_TIMEOUT_SECONDS
    });
    return response;
  }

  const unlockUrl = new URL("/unlock", request.url);
  const nextPath = pathname === "/" ? "/" : `${pathname}${search}`;
  unlockUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ["/:path*"]
};
