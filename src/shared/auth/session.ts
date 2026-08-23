import type { SessionUser } from "@/shared/auth/authorization";

export function parseSessionCookie(raw: string | undefined): SessionUser | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const session = parsed as SessionUser;
    return typeof session.id === "string" ? session : null;
  } catch {
    return null;
  }
}