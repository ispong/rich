import nodemailer from "nodemailer";
import { fetchFunds, getEstimateChangeRate, type FundInfo } from "@/lib/funds";

type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fallbackTo: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

function readMailConfig(): MailConfig {
  const host = process.env.SMTP_HOST?.trim() || "smtp.qq.com";
  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;

  return {
    host,
    port,
    secure,
    user: getRequiredEnv("SMTP_USER"),
    pass: getRequiredEnv("SMTP_PASS"),
    from: getRequiredEnv("MAIL_FROM"),
    fallbackTo: getRequiredEnv("MAIL_TO")
  };
}

function formatRate(rate: number | null): string {
  if (rate == null || !Number.isFinite(rate)) {
    return "--";
  }

  const prefix = rate > 0 ? "+" : "";
  return `${prefix}${rate.toFixed(2)}%`;
}

function buildFundsMailText(funds: FundInfo[]): string {
  return [
    "当前基金信息",
    "",
    ...funds.flatMap((fund) => {
      const rate = formatRate(getEstimateChangeRate(fund.nav, fund.estimateNav));
      return [
        `${fund.name}（${fund.code}）`,
        `单位净值：${fund.nav}`,
        `估算净值：${fund.estimateNav}`,
        `估算涨跌幅：${rate}`,
        `净值日期：${fund.navDate}`,
        `更新时间：${fund.estimateTime}`,
        ""
      ];
    })
  ].join("\n");
}

function buildFundsMailHtml(funds: FundInfo[]): string {
  const generatedAt = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  const rows = funds
    .map((fund) => {
      const rate = getEstimateChangeRate(fund.nav, fund.estimateNav);
      const color = rate != null && rate > 0 ? "#ffffff" : "#111111";
      const background = rate != null && rate > 0 ? "#111111" : "#ffffff";

      return `
        <tr>
          <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;">
            <div style="font-size:15px;font-weight:700;color:#111111;">${fund.name}</div>
            <div style="margin-top:4px;font-size:12px;color:#6b7280;">${fund.code}</div>
          </td>
          <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111111;">${fund.nav}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111111;">${fund.estimateNav}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;">
            <span style="display:inline-block;padding:6px 10px;border:1px solid #111111;border-radius:999px;background:${background};color:${color};font-size:13px;font-weight:700;">
              ${formatRate(rate)}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="margin:0;padding:24px;background:#f5f5f5;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#111111;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #111111;border-radius:20px;overflow:hidden;">
        <div style="padding:24px 20px 14px;border-bottom:1px solid #111111;">
          <div style="font-size:26px;font-weight:700;letter-spacing:0.01em;">基金信息</div>
          <div style="margin-top:8px;font-size:13px;color:#6b7280;">生成时间：${generatedAt}</div>
        </div>
        <div style="padding:0 12px 16px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="padding:16px 12px 10px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">基金</th>
                <th style="padding:16px 12px 10px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">单位净值</th>
                <th style="padding:16px 12px 10px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">估算净值</th>
                <th style="padding:16px 12px 10px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">估算涨跌幅</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export async function sendTestMail(recipient: string | undefined, subject: string | undefined): Promise<void> {
  const config = readMailConfig();

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  const to = recipient?.trim() || config.fallbackTo;
  const finalSubject = (subject?.trim() || "当前基金信息").slice(0, 80);
  const funds = await fetchFunds();
  const text = buildFundsMailText(funds);
  const html = buildFundsMailHtml(funds);

  await transporter.sendMail({
    from: config.from,
    to,
    subject: finalSubject,
    text,
    html
  });
}
