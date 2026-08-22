import { z } from "zod";

export const ownerApplicationSchema = z.object({
  fullName: z
    .string()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  email: z
    .string()
    .email("Format email tidak valid")
    .endsWith(".com", "Harus menggunakan email Gmail (.com)"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password maksimal 100 karakter"),
  confirmPassword: z.string(),
  nim: z
    .string()
    .min(5, "NIM minimal 5 karakter")
    .max(20, "NIM maksimal 20 karakter"),
  universityName: z
    .string()
    .min(2, "Nama universitas wajib diisi")
    .max(200, "Nama universitas maksimal 200 karakter"),
  programName: z
    .string()
    .min(2, "Nama program studi wajib diisi")
    .max(200, "Nama program studi maksimal 200 karakter"),
  className: z
    .string()
    .min(2, "Nama kelas wajib diisi")
    .max(100, "Nama kelas maksimal 100 karakter"),
  selfieFile: z.instanceof(File).refine(
    (file) => {
      return file.size > 0;
    },
    "Foto selfie wajib diunggah"
  ),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

export const kycReviewSchema = z.object({
  applicationId: z.string().cuid("ID aplikasi tidak valid"),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z
    .string()
    .min(10, "Alasan minimal 10 karakter")
    .max(1000, "Alasan maksimal 1000 karakter"),
});

export const ALLOWED_SELFIE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_SELFIE_SIZE = 5 * 1024 * 1024;

export function validateSelfieFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_SELFIE_SIZE) {
    return {
      valid: false,
      error: `Ukuran file maksimal 5MB. File Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  if (!ALLOWED_SELFIE_MIME_TYPES.includes(file.type as typeof ALLOWED_SELFIE_MIME_TYPES[number])) {
    return {
      valid: false,
      error: "Format file harus JPEG, PNG, atau WebP",
    };
  }

  return { valid: true };
}

export const KYC_STORAGE_FOLDER = "kalivergo/kyc/selfies";