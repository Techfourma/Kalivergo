import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUserId } from "@/server/auth/session";
import { ShieldCheck, Home, FileSearch, FileText, Users } from "lucide-react";
import PlatformLogoutButton from "@/components/platform/PlatformLogoutButton";

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
      <header className="sticky top-0 z-40 border-b border-dark-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Panel Platform</p>
              <p className="text-xs text-dark-500">{admin.name || "Admin"}</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/platform"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-dark-600 hover:bg-dark-100 hover:text-dark-900 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </Link>
            <Link
              href="/platform/kyc"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-primary-700 hover:bg-primary-50 transition-colors"
            >
              <FileSearch className="h-4 w-4" />
              <span className="hidden sm:inline">Review KYC</span>
            </Link>
            <Link
              href="/platform/kyc-audit"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-dark-600 hover:bg-dark-100 hover:text-dark-900 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Audit KYC</span>
            </Link>
            <Link
              href="/platform/user"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-dark-600 hover:bg-dark-100 hover:text-dark-900 transition-colors"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Owner</span>
            </Link>
            <Link
              href="/"
              className="ml-2 rounded-lg border border-dark-200 px-3 py-2 text-dark-600 hover:bg-dark-100 transition-colors"
            >
              Ke Situs
            </Link>
            <PlatformLogoutButton />
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>
    </>
  );
}