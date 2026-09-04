"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Wallet,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  X,
  Menu,
  Home,
  User,
  Users,
  FolderOpen,
  FileText,
  Newspaper,
  Shield,
} from "lucide-react";

type CmsNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  module?: string;
  ownerOnly?: boolean;
};

const cmsNavItems: CmsNavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/cms", label: "Overview", icon: LayoutDashboard },
  { href: "/cms/tasks", label: "Manage Tasks", icon: ClipboardList, module: "tasks" },
  { href: "/cms/people", label: "People Management", icon: User, module: "people" },
  { href: "/cms/finance", label: "Finance", icon: Wallet, module: "finance" },
  { href: "/cms/schedule", label: "Schedule", icon: Calendar, module: "schedule" },
  { href: "/cms/seminar", label: "Seminar", icon: GraduationCap, module: "seminar" },
  { href: "/cms/information", label: "Information", icon: Newspaper, module: "information" },
  { href: "/cms/audit", label: "Audit Log", icon: FileText, module: "audit" },
  { href: "/cms/access", label: "Access Control", icon: Shield, module: "access", ownerOnly: true },
];

const mainNavItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

interface SidebarProps {
  variant?: "cms" | "main";
  userRole?: string;
  tenantPath?: string;
  cmsModules?: string[];
}

export default function Sidebar({ variant, userRole, tenantPath, cmsModules }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [detectedRole, setDetectedRole] = useState<string | undefined>(userRole);

  const isCms = variant === "cms" || pathname?.startsWith("/cms") || !!tenantPath;
  const storageKey = isCms
    ? `cmsSidebarCollapsed${tenantPath ?? ""}`
    : "mainSidebarCollapsed";

  const resolveHref = (href: string) =>
    tenantPath ? `${tenantPath}${href}` : href;

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, [storageKey]);

  useEffect(() => {
    if (userRole) {
      setDetectedRole(userRole);
    } else if (typeof window !== "undefined") {
      try {
        const cookieValue = document.cookie
          .split("; ")
          .find((row) => row.startsWith("kalivergo_user="))
          ?.split("=")[1];
        if (cookieValue) {
          const parsed = JSON.parse(decodeURIComponent(cookieValue));
          if (parsed?.role) setDetectedRole(parsed.role);
        }
      } catch (e) {
      }
    }
  }, [userRole]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(storageKey, JSON.stringify(newState));
  };

  const effectiveRole = userRole || detectedRole;
  const isNonMember = effectiveRole && effectiveRole !== "MEMBER";
  const isOwner = effectiveRole === "OWNER";

  const mainNavItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/profil", label: "Profil", icon: User },
    ...(isNonMember ? [{ href: "/cms", label: "CMS Overview", icon: FolderOpen }] : []),
  ];

  const visibleCmsNavItems = isCms
    ? cmsNavItems.filter((item) => {
        if (isOwner) return true;
        if (item.ownerOnly) return false;
        if (!item.module) return true;
        return !!cmsModules?.includes(item.module);
      })
    : [];

  const navItems = isCms ? visibleCmsNavItems : mainNavItems;
  const sidebarTitle = isCms ? "CMS Menu" : "Navigation";

  if (!isMounted) {
    return <aside className="w-64 border-r border-dark-200 bg-white dark:border-dark-800 dark:bg-dark-950" />;
  }

  return (
    <>
      {isCollapsed && (
        <button
          onClick={toggleSidebar}
          className="fixed left-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-dark-200 shadow-lg hover:bg-dark-50 transition-colors dark:bg-dark-950 dark:border-dark-800 dark:hover:bg-dark-900"
          title="Open Menu"
          aria-label="Open Menu"
        >
          <Menu className="h-5 w-5 text-dark-600 dark:text-dark-300" />
        </button>
      )}

      <aside
        className={cn(
          "relative z-50 w-64 min-w-[16rem] shrink-0 bg-white border-r border-dark-200 min-h-screen transition-all duration-300 ease-in-out max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 dark:bg-dark-950 dark:border-dark-800",
          isCollapsed ? "hidden" : "block"
        )}
      >
        <div className="p-4 h-screen sticky top-0 overflow-y-auto text-dark-900 dark:text-dark-100">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-dark-400">
                {sidebarTitle}
              </p>
              <div className="flex items-center gap-2">
                <ThemeToggle className="h-8 w-8" />
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 hover:bg-dark-100 rounded-lg transition-colors dark:hover:bg-dark-800"
                  title="Close Menu"
                >
                  <X className="h-4 w-4 text-dark-500 dark:text-dark-300" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const href = resolveHref(item.href);
                const normalize = (p: string) => p?.replace(/\/$/, "") || "";
                const np = normalize(pathname);
                const nh = normalize(href);
                const isActive = item.href === "/cms" ? np === nh : np === nh || np.startsWith(nh + "/");
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-500/15 dark:text-primary-300"
                        : "text-dark-600 hover:bg-dark-100 hover:text-dark-900 dark:text-dark-300 dark:hover:bg-dark-800 dark:hover:text-dark-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary-600 dark:text-primary-400" : "text-dark-400 dark:text-dark-500"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
        </div>
      </aside>
      {!isCollapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 hidden bg-black/30 max-md:block"
          aria-label="Close Menu"
        />
      )}
    </>
  );
}