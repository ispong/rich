import { NextRequest, NextResponse } from "next/server";
import { sendTestMail } from "@/lib/mailer";

const requests = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const now = Date.now();
  const last = requests.get(ip) ?? 0;

  if (now - last < RATE_LIMIT_MS) {
    return NextResponse.json(
      { ok: false, message: "请求过于频繁，请 1 分钟后重试。" },
      { status: 429 }
    );
  }

  requests.set(ip, now);

  try {
    const body = (await request.json()) as { recipient?: string; subject?: string };
    const recipient = body.recipient?.trim();

    if (recipient && !isEmail(recipient)) {
      return NextResponse.json({ ok: false, message: "邮箱格式不正确。" }, { status: 400 });
    }

    await sendTestMail(recipient, body.subject);
    return NextResponse.json({ ok: true, message: "测试邮件发送成功。" });
  } catch {
    return NextResponse.json(
      { ok: false, message: "发送失败，请检查 SMTP 配置。" },
      { status: 500 }
    );
  }
}
