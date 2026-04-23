"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "submit"] as const;

type UnlockResponse = {
  ok: boolean;
  message?: string;
  next?: string;
};

export default function UnlockPage() {
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  async function submitCode(inputCode: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ passcode: inputCode, next: nextPath })
      });

      const json = (await response.json()) as UnlockResponse;
      if (!response.ok || !json.ok) {
        setPasscode("");
        setError(json.message || "验证失败，请重试。");
        return;
      }

      router.replace(json.next || "/");
    } catch {
      setPasscode("");
      setError("网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  function pushDigit(digit: string) {
    if (loading) {
      return;
    }

    if (error) {
      setError("");
    }
    setPasscode((value) => `${value}${digit}`);
  }

  function clearPasscode() {
    if (loading || passcode.length === 0) {
      return;
    }
    if (error) {
      setError("");
    }
    setPasscode("");
  }

  return (
    <main className="unlock-shell">
      <section className="unlock-card">
        <div className="unlock-dots" aria-label="passcode dots">
          {Array.from({ length: passcode.length }).map((_, index) => (
            <span key={index} className="dot filled" />
          ))}
        </div>

        <div className="unlock-keypad">
          {KEYS.map((key) => {
            if (key === "clear") {
              return (
                <button
                  key={key}
                  type="button"
                  className="key key-clear"
                  onClick={clearPasscode}
                  disabled={loading || passcode.length === 0}
                >
                  清空
                </button>
              );
            }

            if (key === "submit") {
              return (
                <button
                  key={key}
                  type="button"
                  className="key key-clear"
                  onClick={() => void submitCode(passcode)}
                  disabled={loading || passcode.length === 0}
                >
                  确定
                </button>
              );
            }

            return (
              <button key={key} type="button" className="key" onClick={() => pushDigit(key)} disabled={loading}>
                {key}
              </button>
            );
          })}
        </div>

        <p className="unlock-error">{error || " "}</p>
      </section>
    </main>
  );
}
