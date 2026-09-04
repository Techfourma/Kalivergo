import { NextRequest, NextResponse } from "next/server";
import { hashToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();
  const token = searchParams.get("token");
  if (!email || !token) return NextResponse.redirect(new URL("/platform/login?verified=0", request.url));

  const resetToken = await prisma.verificationToken.findFirst({
    where: { email, tokenHash: hashToken(token), purpose: "PLATFORM_ADMIN_PASSWORD_RESET", newPasswordHash: { not: null }, expiresAt: { gt: new Date() } },
  });
  if (!resetToken) return NextResponse.redirect(new URL("/platform/login?verified=0", request.url));

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, platformRole: true } });
  if (!user || (user.platformRole !== "ADMIN_KYC" && user.platformRole !== "SUPER_ADMIN_KYC")) return NextResponse.redirect(new URL("/platform/login?verified=0", request.url));

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: resetToken.newPasswordHash! } }),
    prisma.verificationToken.delete({ where: { id: resetToken.id } }),
  ]);
  return NextResponse.redirect(new URL("/platform/login?verified=1", request.url));
}