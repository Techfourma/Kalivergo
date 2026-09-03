import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUserId } from "@/server/auth/session";
import PlatformNavbar from "@/components/platform/PlatformNavbar";
import PageBackground from "@/components/ui/PageBackground";

export const dynamic = "force-dynamic";


export default async function PlatformProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminId = await getCurrentSessionUserId();

  if (!adminId) {
    redirect("/platform/login");
  }

  const admin = await prisma.user
    .findUnique({ where: { id: adminId }, select: { id: true, name: true, platformRole: true } })
    .catch(() => null);

  if (!admin || (admin.platformRole !== "ADMIN_KYC" && admin.platformRole !== "SUPER_ADMIN_KYC")) {
    redirect("/platform/login");
  }

  return (
    <>
      <PlatformNavbar adminName={admin.name} />

      <main className="relative flex-1 w-full">
        <PageBackground />
        <div className="relative z-10">{children}</div>
      </main>
    </>
  );
}