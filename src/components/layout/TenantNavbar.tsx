"use client";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { logoutUser } from "@/actions/cms";
import {
  Home,
  Wallet,
  Menu,
  X,
  LogIn,
  LogOut,
  Calendar,
  GraduationCap,
  User,
  LayoutDashboard,
  FolderOpen,
  FileText,
  ClipboardList,
} from "lucide-react";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface TenantNavbarProps {
  user?: {
    name: string;
    email: string;
    image?: string | null;
    role?: string;
    cmsRole?: string | null;
    canAccessCms?: boolean;
    isVerified?: boolean;
  } | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  tenantPath: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  requiresAuth?: boolean;
}

export default function TenantNavbar({ user, onSignIn, onSignOut, tenantPath }: TenantNavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      if (onSignOut) {
        await onSignOut();
      } else {
        try {
          await logoutUser();
        } catch (e) {
          console.error("Gagal memanggil logoutUser:", e);
        }

        document.cookie =
          "kalivergo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie =
          "kalivergo_tenant=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

        window.location.replace("/login");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems: NavItem[] = [
    { href: `${tenantPath}/home`, label: "Home", icon: Home },
    {
      href: `${tenantPath}/tasks`,
      label: "Tasks",
      icon: ClipboardList,
      requiresAuth: true
    },
    {
      href: `${tenantPath}/information`,
      label: "Information",
      icon: FileText,
      requiresAuth: true
    },
    {
      href: `${tenantPath}/dashboard`,
      label: "Dashboard",
      icon: LayoutDashboard,
      requiresAuth: true
    },
    {
      href: `${tenantPath}/seminar`,
      label: "Seminar",
      icon: GraduationCap,
      requiresAuth: true
    },
    {
      href: `${tenantPath}/profil`,
      label: "Profil",
      icon: User,
      requiresAuth: true
    },
  ];

  const canAccessCms =
    !!user &&
    (user.canAccessCms === true ||
      user.role === "OWNER" ||
      !!user.cmsRole);
  if (canAccessCms) {
    navItems.push({
      href: `${tenantPath}/cms`,
      label: "CMS",
      icon: FolderOpen,
      requiresAuth: true,
    });
  }

  const formatRole = (role?: string) => {
    const roleMap: Record<string, string> = {
      MEMBER: "Member",
      OWNER: "Owner",
      PRESIDENT: "Presiden",
      VICE_PRESIDENT: "Wakil Presiden",
      TREASURER: "Bendahara",
      VICE_TREASURER: "Wakil Bendahara",
      SECRETARY: "Sekretaris",
    };
    if (!role) return "Member";
    return roleMap[role] || role;
  };

  const filteredNavItems = !user
    ? navItems.filter((item) => !item.requiresAuth)
    : navItems;

  const isActiveHref = (href: string) => {
    const current = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
    const normalize = (p: string) => {
      if (!p) return "/";
      const removed = p.replace(/[?#].*$/, "");
      const withSlash = removed.startsWith("/") ? removed : "/" + removed;
      const noTrailing = withSlash.replace(/\/$/, "");
      return noTrailing === "" ? "/" : noTrailing;
    };
    const np = normalize(current);
    const nh = normalize(href);
    if (np === nh) return true;
    if (nh !== "/" && nh !== `${tenantPath}/home` && np.startsWith(nh + "/")) return true;
    if (nh === `${tenantPath}/home` && np === tenantPath) return true;
    return false;
  };

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-dark-200 bg-white/80 backdrop-blur-xl dark:border-dark-800 dark:bg-dark-950/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href={`${tenantPath}/home`} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/25 overflow-hidden">
                <Image
                  src="/logo.jpg"
                  alt="Kalivergo Logo"
                  width={36}
                  height={36}
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-xl font-bold text-dark-900 font-display hidden sm:block dark:text-dark-100">
                Kalivergo
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveHref(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-500/15 dark:text-primary-300"
                        : "text-dark-600 hover:bg-dark-100 hover:text-dark-900 dark:text-dark-300 dark:hover:bg-dark-800 dark:hover:text-dark-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle className="h-9 w-9" />
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-dark-50 px-3 py-1.5 border border-dark-100 dark:bg-dark-900 dark:border-dark-800">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-dark-900 leading-tight dark:text-dark-100">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-dark-400 leading-tight">
                        {formatRole(user.role)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    isLoading={isLoggingOut}
                    className="!px-2 text-dark-500 hover:text-red-600 hover:bg-red-50 dark:text-dark-300 dark:hover:bg-red-500/15"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button onClick={onSignIn} size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden rounded-lg p-2 text-dark-600 hover:bg-dark-100 transition-colors dark:text-dark-300 dark:hover:bg-dark-800"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {mounted && mobileOpen && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[110] md:hidden flex flex-col dark:bg-dark-950 dark:border-r dark:border-dark-800"
          >
            <div className="flex items-center justify-between p-4 border-b border-dark-100 dark:border-dark-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg overflow-hidden">
                  <Image
                    src="/logo.jpg"
                    alt="Kalivergo Logo"
                    width={36}
                    height={36}
                    className="object-cover"
                    priority
                  />
                </div>
                <span className="text-lg font-bold text-dark-900 font-display dark:text-dark-100">Menu</span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle className="h-8 w-8" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors dark:text-dark-300 dark:hover:bg-dark-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
              <div className="p-4 space-y-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveHref(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
                          : "text-dark-600 hover:bg-dark-50 hover:text-dark-900 dark:text-dark-300 dark:hover:bg-dark-800 dark:hover:text-dark-100"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-dark-100 bg-dark-50/50 dark:border-dark-800 dark:bg-dark-900/50">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    {user.image ? (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={user.image}
                          alt={user.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-dark-900 truncate dark:text-dark-100">{user.name}</span>
                      <span className="text-xs text-dark-500 truncate">{formatRole(user.role)}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                    disabled={isLoggingOut}
                    isLoading={isLoggingOut}
                    onClick={() => {
                      handleSignOut();
                      setMobileOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => {
                    onSignIn?.();
                    setMobileOpen(false);
                  }}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}