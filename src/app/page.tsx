"use client";

import { useEffect, useState } from "react";
import { getEstimateChangeRate, type FundInfo } from "@/lib/funds";

type FundsResponse =
  | {
      ok: true;
      funds: FundInfo[];
    }
  | {
      ok: false;
      message?: string;
    };

function formatRate(rate: number | null): string {
  if (rate == null) {
    return "--";
  }

  const numeric = rate;
  if (!Number.isFinite(numeric)) {
    return "--";
  }

  const prefix = numeric > 0 ? "+" : "";
  return `${prefix}${numeric.toFixed(2)}%`;
}

function getTrend(rate: number | null): "up" | "down" | "flat" {
  if (rate == null || !Number.isFinite(rate) || rate === 0) {
    return "flat";
  }
  return rate > 0 ? "up" : "down";
}

export default function HomePage() {
  const [funds, setFunds] = useState<FundInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadFunds() {
      setLoading(true);
      setError("");
      setSendMessage("");

      try {
        const response = await fetch("/api/funds", { cache: "no-store" });
        const json = (await response.json()) as FundsResponse;

        if (!response.ok || !json.ok) {
          throw new Error(json.ok ? "基金数据获取失败，请稍后重试。" : json.message || "基金数据获取失败，请稍后重试。");
        }

        if (alive) {
          setFunds(json.funds);
        }
      } catch (loadError) {
        if (alive) {
          setFunds([]);
          setError(loadError instanceof Error ? loadError.message : "基金数据获取失败，请稍后重试。");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadFunds();

    return () => {
      alive = false;
    };
  }, []);

  async function onSend() {
    if (sending || loading || error || funds.length === 0) {
      return;
    }

    setSending(true);
    setSendMessage("");

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      const json = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !json.ok) {
        throw new Error(json.message || "发送失败，请稍后重试。");
      }

      setSendMessage("邮件已发送");
    } catch (sendError) {
      setSendMessage(sendError instanceof Error ? sendError.message : "发送失败，请稍后重试。");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="funds-shell">
      <section className="funds-panel">
        {loading ? <p className="funds-state">加载中...</p> : null}
        {error ? <p className="funds-state funds-state-error">{error}</p> : null}

        {!loading && !error ? (
          <>
            <div className="funds-list">
              {funds.map((fund) => {
                const estimateChangeRate = getEstimateChangeRate(fund.nav, fund.estimateNav);
                const trend = getTrend(estimateChangeRate);

                return (
                  <article key={fund.code} className="fund-card">
                    <div className="fund-card-top">
                      <div>
                        <p className="fund-name">{fund.name}</p>
                        <p className="fund-code">{fund.code}</p>
                      </div>
                      <div className="fund-rate-wrap">
                        <div className={`fund-rate fund-rate-${trend}`}>{formatRate(estimateChangeRate)}</div>
                        <span className="fund-rate-label">估算涨跌幅</span>
                      </div>
                    </div>

                    <div className="fund-metrics">
                      <div className="fund-metric">
                        <span className="fund-metric-label">单位净值</span>
                        <strong className="fund-metric-value">{fund.nav}</strong>
                      </div>
                      <div className="fund-metric">
                        <span className="fund-metric-label">估算净值</span>
                        <strong className="fund-metric-value">{fund.estimateNav}</strong>
                      </div>
                    </div>

                    <div className="fund-meta">
                      <span>净值日期 {fund.navDate}</span>
                      <span>更新时间 {fund.estimateTime}</span>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="funds-footer">
              <button type="button" className="funds-send-button" onClick={onSend} disabled={sending}>
                {sending ? "发送中..." : "发送"}
              </button>
              {sendMessage ? <p className="funds-send-message">{sendMessage}</p> : null}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
