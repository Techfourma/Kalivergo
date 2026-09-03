import Link from "next/link";
import { FileSearch, ShieldCheck } from "lucide-react";
import { getKycApplications } from "@/actions/platform-kyc";
import PageBackground from "@/components/ui/PageBackground";

export const dynamic = "force-dynamic";

export default async function PlatformOverviewPage() {
  const result = await getKycApplications();
  const pendingCount = result.success ? result.applications.length : 0;

  return (
    <div className="relative min-h-[calc(100vh-80px)]">
      <PageBackground />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-display text-dark-900 dark:text-white">Overview Platform</h1>
        <p className="mt-1 text-dark-500 dark:text-dark-400">
          Kelola verifikasi KYC dan pantau kesehatan platform kalivergo.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/platform/kyc"
          className="group rounded-2xl border border-dark-200 bg-white p-6 shadow-sm transition-all hover:border-primary-400 hover:shadow-md dark:border-dark-800 dark:bg-dark-900"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <FileSearch className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-dark-900 dark:text-white">Review KYC Owner</h3>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                {pendingCount} aplikasi menunggu verifikasi
              </p>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3 rounded-2xl border border-dark-200 bg-white p-6 shadow-sm dark:border-dark-800 dark:bg-dark-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-dark-900 dark:text-white">Keamanan Platform</h3>
            <p className="text-sm text-dark-500 dark:text-dark-400">
              Hanya ADMIN_KYC dan SUPER_ADMIN_KYC yang dapat mengakses panel ini.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}