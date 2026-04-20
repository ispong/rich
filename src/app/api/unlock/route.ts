import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  getAccessCookieSecret,
  getAccessPassword,
  sanitizeNextPath
} from "@/lib/access";

type UnlockBody = {
  passcode?: string;
  next?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UnlockBody;
    const passcode = body.passcode?.trim() || "";
    const nextPath = sanitizeNextPath(body.next);

    if (passcode !== getAccessPassword()) {
      return NextResponse.json({ ok: false, message: "密码错误，请重试。" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, next: nextPath });
    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: getAccessCookieSecret(),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, message: "请求格式错误。" }, { status: 400 });
  }
}
