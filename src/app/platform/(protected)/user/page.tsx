import { getAllOwners } from "@/actions/platform-owners";
import DeletePlatformOwnerButton from "@/components/cms/DeletePlatformOwnerButton";
import PageBackground from "@/components/ui/PageBackground";
import { Eye } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING_EMAIL: { label: "Menunggu Email", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  PENDING_KYC: { label: "Menunggu KYC", className: "bg-blue-50 text-blue-700 border-blue-200" },
  APPROVED: { label: "Disetujui", className: "bg-green-50 text-green-700 border-green-200" },
  REJECTED: { label: "Ditolak", className: "bg-red-50 text-red-700 border-red-200" },
  CANCELLED: { label: "Dibatalkan", className: "bg-gray-50 text-gray-700 border-gray-200" },
  NO_APPLICATION: { label: "Tidak Ada", className: "bg-gray-50 text-gray-600 border-gray-200" },
};

export default async function PlatformUsersPage() {
  const result = await getAllOwners();
  const owners = result.success ? result.owners : [];

  return (
    <div className="relative min-h-[calc(100vh-80px)]">
      <PageBackground />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-display">Data Owner Kelas</h1>
          <p className="text-dark-500 mt-1">
            Daftar seluruh owner kelas yang terdaftar di platform kalivergo.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-dark-200 dark:border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-200 dark:divide-dark-700">
              <thead className="bg-dark-50 dark:bg-dark-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    Status Aplikasi
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    KYC
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200 dark:divide-dark-700">
                {owners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                      Belum ada data owner kelas.
                    </td>
                  </tr>
                ) : (
                  owners.map((owner) => {
                    const appStatus = statusConfig[owner.applicationStatus] || statusConfig.NO_APPLICATION;
                    const kycStatusLabel =
                      owner.kycStatus === "APPROVED"
                        ? "Disetujui"
                        : owner.kycStatus === "REJECTED"
                        ? "Ditolak"
                        : owner.kycStatus === "PENDING"
                        ? "Menunggu"
                        : owner.kycStatus || "-";

                    return (
                      <tr key={owner.userId} className="hover:bg-dark-50/50 dark:hover:bg-dark-900/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold text-sm">
                              {owner.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-dark-900 dark:text-white truncate">
                                {owner.name}
                              </p>
                              <p className="text-xs text-dark-500 dark:text-dark-400 truncate">
                                {owner.email || "-"}
                              </p>
                              <p className="text-xs text-dark-400 dark:text-dark-500">
                                NIM: {owner.nim || "-"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                              {owner.universityName}
                            </p>
                            <p className="text-xs text-dark-500 dark:text-dark-400">
                              {owner.programName} &middot; {owner.className}
                            </p>
                            {owner.customSlug && (
                              <p className="text-xs text-dark-400 dark:text-dark-500">
                                /{owner.customSlug}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            {owner.whatsappNumber && (
                              <p className="text-xs text-dark-600 dark:text-dark-300">
                                WA: {owner.whatsappNumber}
                              </p>
                            )}
                            {owner.phone && (
                              <p className="text-xs text-dark-500 dark:text-dark-400">
                                Telp: {owner.phone}
                              </p>
                            )}
                            {!owner.whatsappNumber && !owner.phone && (
                              <p className="text-xs text-dark-400 dark:text-dark-500">-</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${appStatus.className}`}
                          >
                            {appStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                              owner.kycStatus === "APPROVED"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : owner.kycStatus === "REJECTED"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }`}
                          >
                            {kycStatusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {owner.tenantId && (
                              <Link
                                href={`/${owner.tenantSlug || owner.tenantId}/dashboard`}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Lihat Kelas
                              </Link>
                            )}
                            <DeletePlatformOwnerButton
                              userId={owner.userId}
                              userName={owner.name}
                              tenantId={owner.tenantId || owner.userId}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
