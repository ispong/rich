export const FUND_CODES = ["017103", "014156", "021483", "008847", "008173"] as const;

export type FundInfo = {
  code: string;
  name: string;
  navDate: string;
  nav: string;
  estimateNav: string;
  estimateTime: string;
};

type FundApiPayload = {
  name?: string;
  jzrq?: string;
  dwjz?: string;
  gsz?: string;
  gztime?: string;
};

function parseJsonp(input: string): FundApiPayload {
  const start = input.indexOf("(");
  const end = input.lastIndexOf(")");
  if (start === -1 || end === -1 || end <= start + 1) {
    throw new Error("Invalid fund payload");
  }

  return JSON.parse(input.slice(start + 1, end)) as FundApiPayload;
}

export function getEstimateChangeRate(nav: string, estimateNav: string): number | null {
  const navValue = Number(nav);
  const estimateValue = Number(estimateNav);

  if (!Number.isFinite(navValue) || !Number.isFinite(estimateValue) || navValue === 0) {
    return null;
  }

  return ((estimateValue - navValue) / navValue) * 100;
}

async function fetchFund(code: string): Promise<FundInfo> {
  const response = await fetch(`https://fundgz.1234567.com.cn/js/${code}.js`, {
    cache: "no-store",
    headers: {
      Referer: "https://fund.eastmoney.com/",
      Accept: "text/javascript, application/javascript, */*;q=0.8",
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch fund ${code}`);
  }

  const text = await response.text();
  const payload = parseJsonp(text);

  return {
    code,
    name: payload.name || code,
    navDate: payload.jzrq || "--",
    nav: payload.dwjz || "--",
    estimateNav: payload.gsz || "--",
    estimateTime: payload.gztime || "--"
  };
}

export async function fetchFunds(): Promise<FundInfo[]> {
  const results = await Promise.allSettled(FUND_CODES.map((code) => fetchFund(code)));
  const funds = results
    .filter((result): result is PromiseFulfilledResult<FundInfo> => result.status === "fulfilled")
    .map((result) => result.value);

  if (funds.length === 0) {
    throw new Error("No fund data available");
  }

  return funds;
}
