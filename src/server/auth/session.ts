import "server-only";

import { cookies } from "next/headers";
import { parseSessionCookie } from "@/shared/auth/session";
import type { SessionUser } from "@/shared/auth/authorization";
import { env } from "@/config/env";

export const SESSION_COOKIE = "kalivergo_user";
export const TENANT_COOKIE = "kalivergo_tenant";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type TenantCookie = {
  tenantId: string;
  universitySlug: string;
  programSlug: string;
  classSlug: string;
};

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  return parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function getCurrentSessionUserId(): Promise<string | null> {
  return (await getCurrentSessionUser())?.id ?? null;
}

export async function setCurrentSessionUser(
  user: SessionUser,
  tenantContext?: TenantCookie
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  if (tenantContext) {
    cookieStore.set(TENANT_COOKIE, JSON.stringify(tenantContext), {
      httpOnly: false,
      secure: env.nodeEnv === "production",
      maxAge: SESSION_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
  }
}

export async function clearCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(TENANT_COOKIE);
}