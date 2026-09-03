import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUserId } from "@/server/auth/session";
import PlatformNavbar from "@/components/platform/PlatformNavbar";

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
      <PlatformNavbar adminName={admin.name} adminRole={admin.platformRole} />

      <main className="min-w-0 flex-1 w-full overflow-x-hidden pt-16 md:ml-72 md:w-auto md:pt-0">{children}</main>
    </>
  );
}