import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/server/auth/session";
import {
  deleteProfileImage,
  uploadProfileImage,
} from "@/features/portfolio/services/profile-image.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const result = await uploadProfileImage(session.id, file);
    if ("error" in result) {
      return NextResponse.json(result, {
        status: result.error === "User tidak ditemukan" ? 404 : 400,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Foto profil berhasil diupdate",
      data: result,
    });
  } catch (error) {
    console.error("Upload profile error:", error);
    return NextResponse.json(
      { error: "Gagal mengupload foto profil" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await deleteProfileImage(session.id);
    if ("error" in result) return NextResponse.json(result, { status: 404 });

    return NextResponse.json({
      success: true,
      message: "Foto profil berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete profile image error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus foto profil" },
      { status: 500 }
    );
  }
}