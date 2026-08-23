import "server-only";

import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  uploadToCloudinary,
} from "@/server/storage/cloudinary";
import {
  findPortfolioById,
  updatePortfolio,
} from "@/features/portfolio/repositories/portfolio.repository";

const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;

export async function uploadProfileImage(userId: string, file: File) {
  const user = await findPortfolioById(userId);
  if (!user) return { error: "User tidak ditemukan" } as const;
  if (!file.type.startsWith("image/")) {
    return { error: "File harus berupa gambar" } as const;
  }
  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    return { error: "Ukuran file maksimal 2MB" } as const;
  }

  if (user.image) {
    const oldPublicId = extractPublicIdFromUrl(user.image);
    if (oldPublicId) {
      try {
        await deleteFromCloudinary(oldPublicId, "image");
      } catch (error) {
        console.warn("Gagal menghapus foto lama dari Cloudinary:", error);
      }
    }
  }

  const uploadResult = await uploadToCloudinary(
    Buffer.from(await file.arrayBuffer()),
    {
      folder: "kalivergo/profiles",
      resourceType: "image",
      publicId: `profile_${userId}_${Date.now()}`,
    }
  );
  await updatePortfolio(userId, { image: uploadResult.secure_url });

  return {
    imageUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  } as const;
}

export async function deleteProfileImage(userId: string) {
  const user = await findPortfolioById(userId);
  if (!user) return { error: "User tidak ditemukan" } as const;

  if (user.image) {
    const publicId = extractPublicIdFromUrl(user.image);
    if (publicId) await deleteFromCloudinary(publicId, "image");
  }
  await updatePortfolio(userId, { image: null });
  return { success: true } as const;
}