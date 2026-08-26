import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import Link from "next/link";
import {
  ShieldAlert,
  Home,
  Lock,
  Sparkles,
  ArrowRight,
  Frown,
  Bot,
} from "lucide-react";

export default async function UnauthorizedPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex flex-col bg-dark-50 dark:bg-dark-950 text-dark-900 dark:text-white relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-600/20 via-pink-500/20 to-red-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Navbar dengan Logo Kalivergo */}
      <div className="relative z-20">
        <NavbarWrapper user={session?.user || null} />
      </div>

      {/* Main Content Meme Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 my-8">
        <div className="max-w-2xl w-full">
          {/* Main Card */}
          <div className="relative bg-dark-100/80 dark:bg-dark-800/70 backdrop-blur-xl border border-dark-200/60 dark:border-dark-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center overflow-hidden">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-semibold tracking-wide uppercase mb-6 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
              <span>403 Forbidden - Access Denied</span>
            </div>

            {/* Meme Graphic Showcase */}
            <div className="relative mx-auto w-36 h-36 sm:w-44 sm:h-44 mb-6 flex items-center justify-center">
              {/* Pulsing Backlight */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-red-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />

              {/* Meme Illustration Container */}
              <div className="relative z-10 w-full h-full bg-dark-900/90 border-2 border-dark-300 dark:border-dark-700 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner group hover:scale-105 transition-transform duration-300">
                <div className="text-4xl sm:text-5xl mb-2 animate-bounce">
                  😝🤚
                </div>
                <div className="text-[10px] sm:text-xs font-black uppercase text-amber-300 tracking-tighter bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                  STOP RIGHT THERE!
                </div>
              </div>
            </div>

            {/* Notice Title (Explicit Requirement) */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-amber-300 mb-4 leading-tight font-display">
              Maaf, anda tidak di izinkan mengakses laman ini.
            </h1>

            {/* Meme Description */}
            <div className="space-y-3 mb-8 text-muted text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
              <p className="bg-dark-100/80 dark:bg-dark-800/70 p-4 rounded-xl border border-dark-200/60 dark:border-dark-800 text-gray-200">
                🔒{" "}
                <strong className="text-dark-900 dark:text-white">
                  Area Khusus Petinggi Kelas !
                </strong>
                <br />
                Laman CMS hanya diperuntukkan untuk{" "}
                <strong>
                  Ketua Kelas, Wakil Ketua, Bendahara, Wakil Bendahara, dan
                  Sekretaris
                </strong>
                .
              </p>
              <p className="text-xs sm:text-sm text-faint italic">
                (Buat Anggota & Anonym... Gak bisa intip-intip CMS ya bang ! 😹)
              </p>
            </div>

            {/* Action Buttons - Only redirect to Beranda */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/home"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-dark-900 dark:text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105 transition-all duration-200"
              >
                <Home className="w-5 h-5" />
                <span>Kembali ke Beranda</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Bottom Info Tag */}
            <div className="mt-8 pt-6 border-t border-dark-200/60 dark:border-dark-800 flex items-center justify-center gap-2 text-xs text-faint">
              <Lock className="w-3.5 h-3.5 text-faint" />
              <span>Kalivergo Security Protocol &bull; Safe &amp; Stable</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-faint border-t border-dark-200/60 dark:border-dark-800">
        Kalivergo &copy; {new Date().getFullYear()} - Class Management System
      </footer>
    </div>
  );
}