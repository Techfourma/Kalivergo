import { NextRequest, NextResponse } from "next/server";
import { getPortfolio } from "@/features/portfolio/services/portfolio.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");
    const userId = searchParams.get("userId");

    if (!username && !userId) {
      return NextResponse.json(
        { error: "Username atau userId harus disediakan" },
        { status: 400 }
      );
    }

    const user = await getPortfolio({ username, userId });
    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Get portfolio error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data portfolio" },
      { status: 500 }
    );
  }
}