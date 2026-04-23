"use client";

import { useState } from "react";

export default function HomePage() {
  const [loading, setLoading] = useState(false);

  async function onSend() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
    } catch {
      // Keep the UI minimal: button only.
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="home-shell">
      <button type="button" className="home-send-button" onClick={onSend} disabled={loading}>
        {loading ? "发送中..." : "发送邮件"}
      </button>
    </main>
  );
}
