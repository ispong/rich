"use client";

import { FormEvent, useMemo, useState } from "react";

type ApiResponse = {
  ok: boolean;
  message: string;
};

export default function HomePage() {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("投资咨询测试邮件");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const canSubmit = useMemo(() => recipient.trim().length > 3 && !loading, [recipient, loading]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ recipient, subject })
      });

      const json = (await response.json()) as ApiResponse;
      setResult(json);
    } catch {
      setResult({ ok: false, message: "请求失败，请稍后重试。" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <section className="card">
        <h1>邮件推送测试</h1>
        <p className="hint">输入邮箱后点击按钮，立即发送一封投资咨询测试邮件。</p>

        <form onSubmit={onSubmit} className="form">
          <label htmlFor="recipient">收件邮箱</label>
          <input
            id="recipient"
            type="email"
            inputMode="email"
            placeholder="name@example.com"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
          />

          <label htmlFor="subject">邮件标题</label>
          <input
            id="subject"
            type="text"
            placeholder="投资咨询测试邮件"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={80}
            required
          />

          <button type="submit" disabled={!canSubmit}>
            {loading ? "发送中..." : "发送测试邮件"}
          </button>
        </form>

        {result ? (
          <p className={result.ok ? "status ok" : "status error"}>{result.message}</p>
        ) : null}
      </section>
    </main>
  );
}
