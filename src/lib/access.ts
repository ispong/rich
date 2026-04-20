export const ACCESS_COOKIE_NAME = "rich_access";

export function getAccessPassword(): string {
  return process.env.ACCESS_PASSWORD?.trim() || "123456";
}

export function getAccessCookieSecret(): string {
  return process.env.ACCESS_COOKIE_SECRET?.trim() || "change-me-please";
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
