import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/server/auth/session";
import { findPortfolioById } from "@/features/portfolio/repositories/portfolio.repository";
import {
  buildPortfolioUpdate,
  updatePortfolioForUser,
} from "@/features/portfolio/services/portfolio.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await findPortfolioById(session.id);
    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

    const body = (await request.json()) as Record<string, unknown>;
    const targetUserId = typeof body.userId === "string" ? body.userId : session.id;
    const isPlatformAdmin = ["SUPER_ADMIN_KYC", "ADMIN_KYC"].includes(
      session.platformRole ?? ""
    );
    if (targetUserId !== session.id && !isPlatformAdmin) {
      return NextResponse.json(
        { error: "Tidak memiliki izin untuk mengedit portfolio ini" },
        { status: 403 }
      );
    }

    await updatePortfolioForUser(targetUserId, buildPortfolioUpdate(body));
    return NextResponse.json({
      success: true,
      message: "Portfolio berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update portfolio error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui portfolio" },
      { status: 500 }
    );
  }
}