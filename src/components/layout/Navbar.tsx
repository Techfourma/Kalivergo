"use client";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Home,
  Users,
  FolderKanban,
  Wallet,
  Settings,
  Menu,
  X,
  LogIn,
  LogOut,
  Shield,
  ClipboardList,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  User,
  GraduationCapIcon,
  Newspaper,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    image?: string | null;
    role?: string;
    isVerified?: boolean;
  } | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  homeHref?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  requiresAuth?: boolean;
  requiresCMS?: boolean;
}

const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: Wallet, requiresAuth: true },

  { href: "/cms", label: "CMS Overview", icon: LayoutDashboard, requiresCMS: true },
  { href: "/cms/tasks", label: "Tasks", icon: ClipboardList, requiresCMS: true },
  { href: "/cms/people", label: "People", icon: User, requiresCMS: true },
  { href: "/cms/finance", label: "Finance", icon: Wallet, requiresCMS: true },
  { href: "/cms/schedule", label: "Schedule", icon: Calendar, requiresCMS: true },
  { href: "/cms/seminar", label: "Seminar", icon: GraduationCap, requiresCMS: true },
];

export default function Navbar({ user, onSignIn, onSignOut, homeHref = "/home" }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  const formatRole = (role?: string) => {
    const roleMap: Record<string, string> = {
      MEMBER: "Member",
      OWNER: "Owner",
      PRESIDENT: "Presiden",
      VICE_PRESIDENT: "Wakil Presiden",
      TREASURER: "Bendahara",
      VICE_TREASURER: "Wakil Bendahara",
      SECRETARY: "Sekretaris",
      SUPER_ADMIN_KYC: "Super Admin",
      ADMIN_KYC: "Admin KYC",
    };
    if (!role) return "Member";
    return roleMap[role] || role;
  };

  const filteredNavItems = (() => {
    const isCmsPath = pathname?.startsWith("/cms");

    if (isCmsPath) {
      return [
        { href: "/cms", label: "Overview", icon: LayoutDashboard },
        { href: "/cms/tasks", label: "Tasks", icon: ClipboardList },
        { href: "/cms/people", label: "People", icon: User },
        { href: "/cms/finance", label: "Finance", icon: Wallet },
        { href: "/cms/schedule", label: "Schedule", icon: Calendar },
        { href: "/cms/seminar", label: "Seminar", icon: GraduationCap },
        { href: "/cms/information", label: "Information", icon: Newspaper },
      ];
    }

    const items: NavItem[] = [
      { href: homeHref, label: "Home", icon: Home },
      { href: "/seminar", label: "Seminar", icon: GraduationCap, requiresAuth: true },
      { href: "/dashboard", label: "Dashboard", icon: Wallet, requiresAuth: true },
      { href: "/profil", label: "Profil", icon: User, requiresAuth: true },
    ];

    const isNonMember = user?.role && user.role !== "MEMBER";
    if (isNonMember) {
      items.push({
        href: "/cms",
        label: "CMS Overview",
        icon: LayoutDashboard,
      });
    }

    if (!user) {
      return items.filter((item) => !item.requiresAuth);
    }

    return items;
  })();

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
    if (nh !== "/" && nh !== homeHref && nh !== "/cms" && np.startsWith(nh + "/")) return true;
    if (nh === homeHref && np === "/") return true;
    return false;
  };

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-dark-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/25 overflow-hidden">
                <Image
                  src="/logo.jpg"
                  alt="kalivergo Logo"
                  width={36}
                  height={36}
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-xl font-bold text-dark-900 font-display hidden sm:block">
                kalivergo
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
                        ? "bg-primary-50 text-primary-700 shadow-sm"
                        : "text-dark-600 hover:bg-dark-100 hover:text-dark-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

           
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-dark-50 px-3 py-1.5 border border-dark-100">
                    {user.image ? (
                      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={user.image}
                          alt={user.name}
                          fill
                          className="object-cover"
                          sizes="28px"
                        />
                      </div>
                    ) : (
                      <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-dark-900 leading-tight">
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
                    onClick={onSignOut}
                    className="!px-2 text-dark-500 hover:text-red-600 hover:bg-red-50"
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

            
            <button
              className="md:hidden rounded-lg p-2 text-dark-600 hover:bg-dark-100 transition-colors"
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
            className="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-[110] md:hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-dark-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg overflow-hidden">
                  <Image
                    src="/logo.jpg"
                    alt="kalivergo Logo"
                    width={36}
                    height={36}
                    className="object-cover"
                    priority
                  />
                </div>
                <span className="text-lg font-bold text-dark-900 font-display">Menu</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
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
                          ? "bg-primary-50 text-primary-700"
                          : "text-dark-600 hover:bg-dark-50 hover:text-dark-900"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            
            <div className="p-4 border-t border-dark-100 bg-dark-50/50">
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
                      <span className="text-sm font-semibold text-dark-900 truncate">{user.name}</span>
                      <span className="text-xs text-dark-500 truncate">{formatRole(user.role)}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      onSignOut?.();
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