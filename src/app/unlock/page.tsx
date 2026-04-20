"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const PASSCODE_LENGTH = 6;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

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
    if (loading || passcode.length >= PASSCODE_LENGTH) {
      return;
    }

    const nextCode = `${passcode}${digit}`;
    setPasscode(nextCode);

    if (nextCode.length === PASSCODE_LENGTH) {
      void submitCode(nextCode);
    }
  }

  function removeDigit() {
    if (loading || passcode.length === 0) {
      return;
    }
    setPasscode((value) => value.slice(0, -1));
  }

  return (
    <main className="unlock-shell">
      <section className="unlock-card">
        <p className="unlock-time">9:41</p>
        <h1 className="unlock-title">输入密码</h1>
        <p className="unlock-subtitle">请输入 6 位访问密码</p>

        <div className="unlock-dots" aria-label="passcode dots">
          {Array.from({ length: PASSCODE_LENGTH }).map((_, index) => (
            <span key={index} className={`dot ${index < passcode.length ? "filled" : ""}`} />
          ))}
        </div>

        <div className="unlock-keypad">
          {KEYS.map((key, index) => {
            if (key === "") {
              return <div key={`${key}-${index}`} />;
            }

            if (key === "del") {
              return (
                <button
                  key={key}
                  type="button"
                  className="key key-clear"
                  onClick={removeDigit}
                  disabled={loading || passcode.length === 0}
                >
                  删除
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
