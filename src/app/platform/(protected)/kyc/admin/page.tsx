import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPendingKycAdminRegistrations } from "@/actions/platform-auth";
import { getCurrentSessionUserId } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";
import KycAdminReviewDashboard from "@/components/platform/KycAdminReviewDashboard";
import PageBackground from "@/components/ui/PageBackground";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review KYC Admin - kalivergo Platform",
  description: "Tinjau dan verifikasi pendaftaran admin KYC (platform register).",
};

export default async function PlatformKycAdminPage() {
  const adminId = await getCurrentSessionUserId();
  if (!adminId) {
    redirect("/platform/login");
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { platformRole: true, kycStatus: true },
  });

  if (!admin || admin.platformRole !== "SUPER_ADMIN_KYC" || admin.kycStatus !== "APPROVED") {
    redirect("/platform");
  }

  const result = await getPendingKycAdminRegistrations();

  return (
    <div className="relative min-h-[calc(100vh-80px)]">
      <PageBackground />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-display text-dark-900 dark:text-white">
            Review KYC Admin
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Verifikasi pendaftaran admin KYC.
          </p>
        </div>

        <KycAdminReviewDashboard
          initialRegistrations={result.registrations}
          initialError={result.error ?? null}
        />
      </div>
    </div>
  );
}
