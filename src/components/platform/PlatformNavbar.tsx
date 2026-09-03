"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSearch, FileText, Home, ShieldCheck, Users } from "lucide-react";
import PlatformLogoutButton from "@/components/platform/PlatformLogoutButton";

interface PlatformNavbarProps {
  adminName: string | null;
}

const linkBaseClass = "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors";
const activeClass = "bg-primary-50 text-primary-700";
const inactiveClass = "text-dark-600 hover:bg-dark-100 hover:text-dark-900";

export default function PlatformNavbar({ adminName }: PlatformNavbarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/platform") return pathname === href;
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-dark-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Panel Platform</p>
            <p className="text-xs text-dark-500">{adminName || "Admin"}</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 text-sm">
          <Link href="/platform" className={`${linkBaseClass} ${isActive("/platform") ? activeClass : inactiveClass}`}>
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </Link>
          <Link href="/platform/kyc" className={`${linkBaseClass} ${isActive("/platform/kyc") ? activeClass : inactiveClass}`}>
            <FileSearch className="h-4 w-4" />
            <span className="hidden sm:inline">Review KYC</span>
          </Link>
          <Link href="/platform/kyc-audit" className={`${linkBaseClass} ${isActive("/platform/kyc-audit") ? activeClass : inactiveClass}`}>
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Audit KYC</span>
          </Link>
          <Link href="/platform/user" className={`${linkBaseClass} ${isActive("/platform/user") ? activeClass : inactiveClass}`}>
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Owner</span>
          </Link>
          <Link
            href="/"
            className="ml-2 rounded-lg border border-dark-200 px-3 py-2 text-dark-600 transition-colors hover:bg-dark-100"
          >
            Ke Situs
          </Link>
          <PlatformLogoutButton />
        </nav>
      </div>
    </header>
  );
}
