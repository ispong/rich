import nodemailer from "nodemailer";

type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fallbackTo: string;
};

type Csi500Quote = {
  name: string;
  code: string;
  latest: number;
  change: number;
  changePercent: number;
  fetchedAt: string;
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

function scaleBy100(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error("Invalid quote number");
  }
  return numeric / 100;
}

async function fetchCsi500Quote(): Promise<Csi500Quote> {
  const endpoint =
    "https://push2.eastmoney.com/api/qt/stock/get?secid=1.000905&fields=f57,f58,f43,f169,f170";
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Quote API failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: {
      f57?: string;
      f58?: string;
      f43?: number;
      f169?: number;
      f170?: number;
    };
  };

  const quote = payload.data;
  if (!quote?.f57 || !quote?.f58 || quote.f43 == null || quote.f169 == null || quote.f170 == null) {
    throw new Error("Quote API payload is incomplete");
  }

  return {
    name: quote.f58,
    code: quote.f57,
    latest: scaleBy100(quote.f43),
    change: scaleBy100(quote.f169),
    changePercent: scaleBy100(quote.f170),
    fetchedAt: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
  };
}

function buildCsi500MailText(quote: Csi500Quote): string {
  const sign = quote.change > 0 ? "+" : "";
  return [
    "当前中证500指数信息",
    "",
    `指数：${quote.name}（${quote.code}）`,
    `最新点位：${quote.latest.toFixed(2)}`,
    `涨跌：${sign}${quote.change.toFixed(2)}`,
    `涨跌幅：${sign}${quote.changePercent.toFixed(2)}%`,
    "",
    `数据时间：${quote.fetchedAt}`
  ].join("\n");
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
  const finalSubject = (subject?.trim() || "当前中证500指数信息").slice(0, 80);
  const quote = await fetchCsi500Quote();
  const content = buildCsi500MailText(quote);

  await transporter.sendMail({
    from: config.from,
    to,
    subject: finalSubject,
    text: content
  });
}
