import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import UnauthorizedGame from "@/components/unauthorized/UnauthorizedGame";

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

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <UnauthorizedGame />
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-faint border-t border-dark-200/60 dark:border-dark-800">
        Kalivergo &copy; {new Date().getFullYear()} - Class Management System
      </footer>
    </div>
  );
}