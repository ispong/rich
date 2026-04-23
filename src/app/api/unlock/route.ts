import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_SESSION_IDLE_TIMEOUT_SECONDS,
  getAccessCookieSecret,
  getAccessUnlockCode,
  getAccessPassword,
  sanitizeNextPath
} from "@/lib/access";

const FAILED_WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const failedAttemptTimestamps: number[] = [];
let accountLocked = false;

type UnlockBody = {
  passcode?: string;
  next?: string;
};

function pruneFailedAttempts(now: number) {
  while (
    failedAttemptTimestamps.length > 0 &&
    now - failedAttemptTimestamps[0] > FAILED_WINDOW_MS
  ) {
    failedAttemptTimestamps.shift();
  }
}

function markFailedAttempt(now: number) {
  pruneFailedAttempts(now);
  failedAttemptTimestamps.push(now);
  if (failedAttemptTimestamps.length >= MAX_FAILED_ATTEMPTS) {
    accountLocked = true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UnlockBody;
    const passcode = body.passcode?.trim() || "";
    const nextPath = sanitizeNextPath(body.next);
    const now = Date.now();
    const unlockCode = getAccessUnlockCode();

    if (unlockCode && passcode === unlockCode) {
      accountLocked = false;
      failedAttemptTimestamps.length = 0;
      return NextResponse.json({ ok: false, message: "账号锁定已解除，请输入访问密码。" });
    }

    if (accountLocked) {
      return NextResponse.json(
        { ok: false, message: "账号已锁定，禁止登录。" },
        { status: 423 }
      );
    }

    if (passcode !== getAccessPassword()) {
      markFailedAttempt(now);
      if (accountLocked) {
        return NextResponse.json(
          { ok: false, message: "账号已锁定，禁止登录。" },
          { status: 423 }
        );
      }
      return NextResponse.json({ ok: false, message: "密码错误，请重试。" }, { status: 401 });
    }

    failedAttemptTimestamps.length = 0;

    const response = NextResponse.json({ ok: true, next: nextPath });
    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: getAccessCookieSecret(),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_SESSION_IDLE_TIMEOUT_SECONDS
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, message: "请求格式错误。" }, { status: 400 });
  }
}
