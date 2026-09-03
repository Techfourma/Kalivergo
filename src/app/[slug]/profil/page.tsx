import { unstable_noStore as noStore } from "next/cache";

import Footer from "@/components/layout/Footer";
import PageBackground from "@/components/ui/PageBackground";
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
          <PageBackground />

          <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a14]/50 to-[#0a0a14] pointer-events-none" />

          <div className="relative z-10 min-h-screen flex items-center justify-center">
            <div className="text-dark-900 dark:text-white text-center">
              <h1 className="text-2xl font-bold mb-4">Silakan login terlebih dahulu</h1>
              <p className="text-dark-500 dark:text-dark-400">Anda harus login untuk mengakses halaman profil.</p>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <CacheGuard />

        <PageBackground />
        <main className="flex-1 py-12 relative z-10 min-h-screen">
          <div className="mx-auto w-full max-w-4xl min-w-0 px-4 sm:px-6 lg:px-8">
            <div className="relative min-w-0 rounded-3xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl p-4 sm:p-10 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.15)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)]">
              {/* subtle top highlight for a lifted, 3D feel */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />

              <div className="mb-10">
                <p className="text-xs font-semibold tracking-widest uppercase text-dark-400 dark:text-dark-500 mb-2">
                  Akun Saya
                </p>
                <h1 className="text-3xl font-bold text-dark-900 dark:text-white font-display tracking-tight">
                  Profil Pengguna
                </h1>
                <p className="text-dark-500 dark:text-dark-400 mt-2 text-sm leading-relaxed">
                  Kelola foto profil Anda
                </p>
                <div className="mt-6 h-0.5 w-full rounded-full bg-gradient-to-r from-dark-300 dark:from-dark-600 via-dark-200/40 dark:via-dark-700/40 to-transparent" />
              </div>
              <ProfileForm user={currentUser} />
            </div>
           </div>
        </main>

        <Footer />
      </>
    );
  } catch (err) {
    console.error("ProfilePage: DB error:", err);

    return (
      <>
        <PageBackground />

        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-dark-900 dark:text-white text-center">
            <h1 className="text-2xl font-bold mb-4">Terjadi kesalahan</h1>
            <p className="text-dark-500 dark:text-dark-400">Gagal memuat data profil.</p>
          </div>
        </div>
      </>
    );
  }
}