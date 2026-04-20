# rich-mail-test

一个移动端优先的测试页面，点击按钮触发邮件发送接口。

## 1. 安装依赖

```bash
npm install
```

## 2. 配置环境变量

```bash
cp .env.example .env.local
```

按你的 SMTP 提供商填写 `.env.local`。
默认已配置为 QQ 邮箱：

- `SMTP_HOST=smtp.qq.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER` 填你的 QQ 邮箱地址
- `SMTP_PASS` 填 QQ 邮箱开启 SMTP 后生成的“授权码”（不是登录密码）

## 3. 启动

```bash
npm run dev
```

打开 `http://localhost:3000`，输入邮箱后点击“发送测试邮件”。

## API

- `POST /api/test-email`
- body: `{ "recipient": "test@example.com", "subject": "可选标题" }`

接口自带基础限流：同一 IP 1 分钟内最多触发 1 次。
