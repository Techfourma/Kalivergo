import { unstable_noStore as noStore } from "next/cache";

import Footer from "@/components/layout/Footer";
import WaveBackground from "@/components/ui/WaveBackground";
import ProfileForm from "./ProfileForm";
import CacheGuard from "@/components/security/CacheGuard";
import { cookies } from "next/headers";
import {
  requireTenantPageAccess,
  resolveTenantFromRoute,
} from "@/lib/tenant";
import { loadCurrentUser } from "@/lib/user-session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  noStore();

  const cookieStore = await cookies();
  const userCookie = cookieStore.get("kalivergo_user")?.value;

  let currentUser: any = null;

  const { slug } = await params;

  const tenantContext = await resolveTenantFromRoute({ slug });
  const tenantId = tenantContext?.tenantId;

  if (!tenantId) {
    notFound();
  }

  await requireTenantPageAccess(tenantId);

  try {
    currentUser = await loadCurrentUser(userCookie, tenantId);

    if (!currentUser) {
      return (
        <>
          <WaveBackground />

          <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a14]/50 to-[#0a0a14] pointer-events-none" />

          <div className="relative z-10 min-h-screen flex items-center justify-center">
            <div className="text-white text-center">
              <h1 className="text-2xl font-bold mb-4">
                Silakan login terlebih dahulu
              </h1>

              <p className="text-gray-300">
                Anda harus login untuk mengakses halaman profil.
              </p>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <CacheGuard />

        <WaveBackground />

        <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a14]/50 to-[#0a0a14] pointer-events-none" />

        <main className="flex-1 py-8 relative z-10 min-h-screen">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white font-display">
                Profil Pengguna
              </h1>

              <p className="text-gray-300 mt-2">
                Kelola foto profil Anda
              </p>
            </div>

            <ProfileForm user={currentUser} />
          </div>
        </main>

        <Footer />
      </>
    );
  } catch (err) {
    console.error("ProfilePage: DB error:", err);

    return (
      <>
        <WaveBackground />

        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold mb-4">
              Terjadi kesalahan
            </h1>

            <p className="text-gray-300">
              Gagal memuat data profil.
            </p>
          </div>
        </div>
      </>
    );
  }
}