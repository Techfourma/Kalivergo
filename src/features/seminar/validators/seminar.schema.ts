import { z } from "zod";

export const createSeminarSchema = z.object({
  title: z.string().min(1, "Judul seminar wajib diisi").max(200),
  description: z.string().min(1, "Deskripsi seminar wajib diisi").max(2000),
  date: z.coerce.date({ invalid_type_error: "Tanggal tidak valid" }),
  location: z.string().min(1, "Lokasi seminar wajib diisi").max(200),
  url: z
    .union([z.string().url("URL tidak valid"), z.literal("")])
    .optional()
    .transform((value) => value || undefined),
});

export type CreateSeminarInput = z.infer<typeof createSeminarSchema>;