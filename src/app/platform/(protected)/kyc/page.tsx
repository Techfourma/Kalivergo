import type { Metadata } from "next";
import { getKycApplications } from "@/actions/platform-kyc";
import KycReviewDashboard from "@/components/platform/KycReviewDashboard";
import PageBackground from "@/components/ui/PageBackground";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review KYC - kalivergo Platform",
  description: "Tinjau dan verifikasi aplikasi owner kelas (KYC).",
};

export default async function PlatformKycPage() {
  const result = await getKycApplications();

  return (
    <div className="relative min-h-[calc(100vh-80px)]">
      <PageBackground />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-display text-dark-900 dark:text-white">
            Review KYC Owner Kelas
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Verifikasi identitas owner sebelum kelas diaktifkan. Hanya ADMIN_KYC dan SUPER_ADMIN_KYC
            yang dapat menyetujui atau menolak aplikasi.
          </p>
        </div>

        <KycReviewDashboard
          initialApplications={result.applications}
          initialError={result.error ?? null}
        />
      </div>
    </div>
  );
}