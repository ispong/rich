import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "投资咨询邮件测试",
  description: "移动端邮件推送测试页面"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
