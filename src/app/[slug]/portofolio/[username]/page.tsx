import { notFound } from "next/navigation";
import PortofolioView, { type PortfolioUser } from "@/features/portfolio/components/PortofolioView";
import Footer from "@/components/layout/Footer";
import PageBackground from "@/components/ui/PageBackground";
import { prisma } from "@/server/db/prisma";
import { getCurrentSessionUser } from "@/server/auth/session";
import { findPortfolioById } from "@/features/portfolio/repositories/portfolio.repository";
import { getPortfolioInTenant } from "@/features/portfolio/services/portfolio.service";
import { resolveTenantFromRoute } from "@/lib/tenant";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    slug: string;
    username: string;
  }>;
  searchParams?: Promise<{
    uid?: string;
  }>;
}

export default async function PortfolioPage({ params, searchParams }: PageProps) {
  const { slug, username } = await params;
  const { uid } = (await searchParams) ?? {};

  const tenantContext = await resolveTenantFromRoute({ slug });
  if (!tenantContext) {
    notFound();
  }

  try {
    const decodedUsername = decodeURIComponent(username);

    let portfolioUser: PortfolioUser | null = null;

    // Prefer the exact user by id (sent from the tenant landing member card),
    // but only if that user is actually a member of this tenant.
    if (uid) {
      const membership = await prisma.tenantMembership.findFirst({
        where: { userId: uid, tenantId: tenantContext.tenantId },
        select: { userId: true },
      });
      if (membership) {
        portfolioUser = await findPortfolioById(uid);
      }
    }

    // Fallback: resolve the portfolio scoped to this tenant by name so the
    // member shown on the tenant landing opens that user's portfolio
    // (public for guests).
    if (!portfolioUser) {
      portfolioUser =
        await getPortfolioInTenant(decodedUsername, {
          university: tenantContext.universitySlug,
          program: tenantContext.programSlug,
          class: tenantContext.classSlug,
        });
    }

    // Strict tenant isolation: only members of this tenant are ever shown.
    if (!portfolioUser) {
      notFound();
    }

    
    const session = await getCurrentSessionUser();
    let currentUser: PortfolioUser | null = null;

    if (session?.id) {
      const dbUser = await findPortfolioById(session.id);
      currentUser = dbUser ?? {
        id: session.id,
        name: session.name ?? "Pengguna",
        email: session.email ?? null,
        nim: session.nim ?? null,
      };
    }

    return (
      <>
        <PageBackground />
        <main className="relative z-10 min-h-screen py-8">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-dark-900 dark:text-white font-display">
                Portfolio
              </h1>
              <p className="text-muted mt-2">
                Profil profesional {portfolioUser.name}
              </p>
            </div>
            <PortofolioView
              portfolioUser={portfolioUser}
              currentUser={currentUser}
            />
          </div>
        </main>
        <Footer />
      </>
    );
  } catch (error) {
    console.error("PortfolioPage error:", error);
    notFound();
  }
}