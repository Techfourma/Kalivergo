'use server';

import { registerUserService, loginUserService, resetPasswordService } from "../services/auth.service";
import { registerSchema, loginSchema, resetPasswordSchema } from "../validators/auth.schema";
import { setCurrentSessionUser, clearCurrentSession } from "@/server/auth/session";
import { CMS_ROLES } from "@/types";

export async function registerAction(formData: FormData) {
  const fullName = (formData.get("fullName") as string)?.trim();
  const nim = (formData.get("nim") as string)?.trim();
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const result = registerSchema.safeParse({ fullName, nim, email, password, confirmPassword });
  if (!result.success) {
    return { error: result.error.errors[0]?.message, field: result.error.errors[0]?.path[0] as string };
  }

  return registerUserService({
    fullName,
    nim,
    email,
    password,
    confirmPassword,
  });
}

export async function loginAction(nim: string, password: string) {
  const result = loginSchema.safeParse({ nim, password });
  if (!result.success) {
    return { error: result.error.errors[0]?.message };
  }

  const serviceResult = await loginUserService({ nim, password });
  if (serviceResult.error) {
    return serviceResult;
  }

  const user = serviceResult.user;
  let role: string | null = null;
  let cmsRole: string | null = null;

  if (user.platformRole) {
    role = user.platformRole;
  } else {
    const priority = ["OWNER", "PRESIDENT", "VICE_PRESIDENT", "TREASURER", "VICE_TREASURER", "SECRETARY", "MEMBER"];
    const rank = (m: (typeof user.memberships)[number]): number => {
      if (m.role === "OWNER") return 0;
      const idx = m.cmsRole ? CMS_ROLES.indexOf(m.cmsRole) : -1;
      if (idx >= 0) return idx + 1;
      return priority.indexOf("MEMBER");
    };
    const primary = [...user.memberships].sort((a, b) => rank(a) - rank(b))[0];
    role = primary?.role === "OWNER" ? "OWNER" : primary?.cmsRole ?? primary?.role ?? "MEMBER";
    cmsRole = primary?.cmsRole ?? null;
  }

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    nim: user.nim,
    platformRole: user.platformRole,
    role,
    cmsRole,
    memberships: user.memberships,
  };

  await setCurrentSessionUser(sessionUser);
  
  return { success: true, user: sessionUser };
}

export async function logoutAction() {
  await clearCurrentSession();
  return { success: true };
}

export async function resetPasswordAction(formData: FormData) {
  const nim = formData.get("nim") as string;
  const email = formData.get("email") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const result = resetPasswordSchema.safeParse({ nim, email, newPassword, confirmPassword });
  if (!result.success) {
    return { error: result.error.errors[0]?.message, field: result.error.errors[0]?.path[0] as string };
  }

  return resetPasswordService({ nim, email, newPassword, confirmPassword });
}