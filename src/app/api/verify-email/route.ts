import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.json({ error: "Link verifikasi tidak valid." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const tokenHash = hashToken(token);
  const now = new Date();

  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        tokenHash,
        email: normalizedEmail,
        newPasswordHash: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Token tidak valid, sudah dipakai, atau kedaluwarsa." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
      return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }, 
      }),
      prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      }),
    ]);

    return NextResponse.redirect(new URL("/login?verified=1", request.url));
  } catch (error) {
    console.error("VERIFY_EMAIL_ERROR", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat verifikasi." }, { status: 500 });
  }
}