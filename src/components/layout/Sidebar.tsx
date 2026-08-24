"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const cmsNavItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/cms", label: "Overview", icon: LayoutDashboard },
  { href: "/cms/tasks", label: "Manage Tasks", icon: ClipboardList },
  { href: "/cms/people", label: "People Management", icon: User },
  { href: "/cms/finance", label: "Finance", icon: Wallet },
  { href: "/cms/schedule", label: "Schedule", icon: Calendar },
  { href: "/cms/seminar", label: "Seminar", icon: GraduationCap },
  { href: "/cms/audit", label: "Audit Log", icon: FileText },
  { href: "/cms/access", label: "Access Control", icon: Shield, ownerOnly: true },
];

const mainNavItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

interface SidebarProps {
  variant?: "cms" | "main";
  userRole?: string;
  tenantPath?: string;
}

export default function Sidebar({ variant, userRole, tenantPath }: SidebarProps) {
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

  const mainNavItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/profil", label: "Profil", icon: User },
    ...(isNonMember ? [{ href: "/cms", label: "CMS Overview", icon: FolderOpen }] : []),
  ];

  const navItems = isCms ? cmsNavItems : mainNavItems;
  const sidebarTitle = isCms ? "CMS Menu" : "Navigation";

  if (!isMounted) {
    return <aside className="w-64 border-r border-dark-200 bg-white" />;
  }

  return (
    <>
      {isCollapsed && (
        <button
          onClick={toggleSidebar}
          className="fixed left-0 top-0 z-40 p-2 bg-white border border-dark-200 rounded-lg shadow-lg hover:bg-dark-50 transition-colors"
          title="Open Menu"
        >
          <Menu className="h-5 w-5 text-dark-600" />
        </button>
      )}

      <aside
        className={cn(
          "shrink-0 bg-white border-r border-dark-200 min-h-screen transition-all duration-300 ease-in-out max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40",
          isCollapsed ? "w-0" : "w-64"
        )}
      >
        {!isCollapsed && (
          <div className="p-4 h-screen sticky top-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-dark-400">
                {sidebarTitle}
              </p>
              <button
                onClick={toggleSidebar}
                className="p-1.5 hover:bg-dark-100 rounded-lg transition-colors"
                title="Close Menu"
              >
                <X className="h-4 w-4 text-dark-500" />
              </button>
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const href = resolveHref(item.href);
                const normalize = (p: string) => p?.replace(/\/$/, "") || "";
                const np = normalize(pathname);
                const nh = normalize(href);
                const isActive = np === nh || np.startsWith(nh + "/");
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary-50 text-primary-700 shadow-sm"
                        : "text-dark-600 hover:bg-dark-100 hover:text-dark-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary-600" : "text-dark-400"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}