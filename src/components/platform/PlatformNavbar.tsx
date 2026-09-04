"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FileSearch,
  FileText,
  Home,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import PlatformLogoutButton from "@/components/platform/PlatformLogoutButton";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface PlatformNavbarProps {
  adminName: string | null;
  adminRole: string | null;
}

const linkBaseClass =
  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors";
const activeClass = "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300";
const inactiveClass =
  "text-dark-600 hover:bg-dark-100 hover:text-dark-900 dark:text-dark-300 dark:hover:bg-dark-800 dark:hover:text-white";

export default function PlatformNavbar({ adminName, adminRole }: PlatformNavbarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/platform") return pathname === href;
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const menuItems = [
    { href: "/platform", label: "Overview", icon: Home },
    { href: "/platform/kyc", label: "Review KYC", icon: FileSearch },
    { href: "/platform/kyc-audit", label: "Audit KYC", icon: FileText },
    { href: "/platform/user", label: "User", icon: Users },
  ];
  const initials = (adminName || "Admin")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = (adminRole || "ADMIN").replaceAll("_", " ");

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-dark-200 bg-white px-4 shadow-sm dark:border-dark-800 dark:bg-dark-900 md:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary-700 shadow-sm ring-1 ring-dark-200 dark:ring-dark-700">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <button
          type="button"
          aria-label="Buka menu platform"
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-dark-700 transition-colors hover:bg-dark-100 dark:text-dark-100 dark:hover:bg-dark-800"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>
      {isOpen && (
        <button
          type="button"
          aria-label="Tutup menu platform"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-dark-950/40 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-3rem))] flex-col border-r border-dark-200 bg-white px-4 py-5 shadow-xl transition-transform dark:border-dark-800 dark:bg-dark-900 md:w-72 md:translate-x-0 md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-700 shadow-sm ring-1 ring-dark-200 dark:ring-dark-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold leading-tight text-dark-900 dark:text-white md:hidden">Menu</p>
              <p className="hidden text-sm font-bold leading-tight text-dark-900 dark:text-white md:block">Panel Platform</p>
              <p className="text-xs text-dark-500 dark:text-dark-400">kalivergo</p>
            </div>
          </div>
          <div className="ml-4 flex shrink-0 items-center gap-1 md:ml-6">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Tutup sidebar"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-800 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-dark-200 bg-dark-50 p-3 dark:border-dark-700 dark:bg-dark-800/60">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-dark-900 dark:text-white">{adminName || "Admin"}</p>
            <p className="truncate text-xs uppercase tracking-wide text-dark-500 dark:text-dark-400">{roleLabel}</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1" aria-label="Navigasi platform">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-dark-400 dark:text-dark-500">Menu utama</p>
          {menuItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className={`${linkBaseClass} ${isActive(href) ? activeClass : inactiveClass}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-dark-200 pt-4 dark:border-dark-800">
          <PlatformLogoutButton />
        </div>
      </aside>
    </>
  );
}
