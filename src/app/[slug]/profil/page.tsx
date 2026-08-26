import { unstable_noStore as noStore } from "next/cache";
import Footer from "@/components/layout/Footer";
import TenantNavbar from "@/components/layout/TenantNavbar";
import PageBackground from "@/components/ui/PageBackground";
import ProfileForm from "./ProfileForm";
import CacheGuard from "@/components/security/CacheGuard";
import { cookies } from "next/headers";
import { requireTenantPageAccess, resolveTenantFromRoute } from "@/lib/tenant";
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
          <div className="relative z-10 min-h-screen flex items-center justify-center">
            <div className="text-dark-900 dark:text-white text-center">
              <h1 className="text-2xl font-bold mb-4">Silakan login terlebih dahulu</h1>
              <p className="text-muted">Anda harus login untuk mengakses halaman profil.</p>
            </div>
          </div>
        </>
      );
    }

    const tenantPath = `/${slug}`;

    return (
      <>
        <CacheGuard />
        <PageBackground />
        <div className="relative z-10">
          <div className="nav-shell">
            <TenantNavbar user={currentUser} tenantPath={tenantPath} />
          </div>
        </div>
        <main className="flex-1 py-8 relative z-10 min-h-screen">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-dark-900 dark:text-white font-display">
                Profil Pengguna
              </h1>
              <p className="text-muted mt-2">
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
        <PageBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-dark-900 dark:text-white text-center">
            <h1 className="text-2xl font-bold mb-4">Terjadi kesalahan</h1>
            <p className="text-muted">Gagal memuat data profil.</p>
          </div>
        </div>
      </>
    );
  }
}