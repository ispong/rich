export const ACCESS_COOKIE_NAME = "rich_access";
export const ACCESS_SESSION_IDLE_TIMEOUT_SECONDS = 15 * 60;

export function getAccessPassword(): string {
  return process.env.ACCESS_PASSWORD?.trim() || "";
}

export function getAccessCookieSecret(): string {
  return process.env.ACCESS_COOKIE_SECRET?.trim() || "change-me-please";
}

export function getAccessUnlockCode(): string {
  return process.env.ACCESS_UNLOCK_CODE?.trim() || "";
}

export function sanitizeNextPath(input: string | null | undefined): string {
  if (!input || !input.startsWith("/")) {
    return "/";
  }

  if (input.startsWith("//") || input.startsWith("/unlock") || input.startsWith("/api/unlock")) {
    return "/";
  }

  return input;
}
