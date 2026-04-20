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
  const finalSubject = (subject?.trim() || "投资咨询测试邮件").slice(0, 80);
  const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  await transporter.sendMail({
    from: config.from,
    to,
    subject: finalSubject,
    text: `这是一封测试邮件。\n\n发送时间：${now}\n\n若你收到此邮件，说明邮件服务可用。`
  });
}
