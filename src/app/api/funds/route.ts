import { NextResponse } from "next/server";
import { fetchFunds } from "@/lib/funds";

export async function GET() {
  try {
    const funds = await fetchFunds();
    return NextResponse.json({ ok: true, funds });
  } catch {
    return NextResponse.json({ ok: false, message: "基金数据获取失败，请稍后重试。" }, { status: 500 });
  }
}
