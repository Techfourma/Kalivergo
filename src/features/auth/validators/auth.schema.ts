import "server-only";

import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  nim: z.string().min(1, "NIM wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const resetPasswordSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  email: z.string().email("Email tidak valid"),
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});