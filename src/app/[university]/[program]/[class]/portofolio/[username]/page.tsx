import { notFound } from "next/navigation";
import PortofolioView, { type PortfolioUser } from "@/features/portfolio/components/PortofolioView";
import Footer from "@/components/layout/Footer";
import WaveBackground from "@/components/ui/WaveBackground";
import { getCurrentSessionUser } from "@/server/auth/session";
import { findPortfolioById } from "@/features/portfolio/repositories/portfolio.repository";
import {
  getPortfolio,
  getPortfolioInTenant,
} from "@/features/portfolio/services/portfolio.service";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    username: string;
    university?: string;
    program?: string;
    class?: string;
  }>;
}

export default async function PortfolioPage({ params }: PageProps) {
  const { username, university, program, class: classSlug } = await params;

  try {
    const decodedUsername = decodeURIComponent(username);
    const portfolioUser = university && program && classSlug
      ? await getPortfolioInTenant(decodedUsername, {
          university,
          program,
          class: classSlug,
        })
      : await getPortfolio({ username: decodedUsername });

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
        <WaveBackground />
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a14]/50 to-[#0a0a14] pointer-events-none" />
        <main className="relative z-10 min-h-screen py-8">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white font-display">
                Portfolio
              </h1>
              <p className="text-gray-300 mt-2">
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