"use client";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  UserPlus,
  BookOpen,
  Wallet,
  Calendar,
  Shield,
  Crown,
  FileText,
} from "lucide-react";
import Image from "next/image";
import PageBackground from "@/components/ui/PageBackground";
import {
  type OrgMember,
  convertUserToOrgMember,
} from "@/data/orgMembers";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Loading from "@/components/layout/Loading";

const STATS = [
  { label: "Anggota Aktif", value: "31", icon: Users, dynamicMemberCount: true },
  { label: "Tugas Selesai", value: "95%", icon: CheckCircle2 },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Task Tracker",
    description:
      "Monitoring dan tracking tugas kuliah dengan deadline yang jelas",
    hoverColor: "hover:border-primary-500/50",
    iconColor: "text-primary-400",
  },
  {
    icon: Wallet,
    title: "Keuangan Kas",
    description: "Pengelolaan transparan keuangan dan iuran kelas",
    hoverColor: "hover:border-accent-500/50",
    iconColor: "text-accent-400",
  },
  {
    icon: Calendar,
    title: "Seminar & Kegiatan",
    description: "Pendaftaran dan monitoring kegiatan seminar",
    hoverColor: "hover:border-green-500/50",
    iconColor: "text-green-400",
  },
  {
    icon: Shield,
    title: "Verifikasi Anggota",
    description:
      "Sistem autentikasi aman dengan verifikasi Data Mahasiswa Universitas Pamulang",
    hoverColor: "hover:border-blue-500/50",
    iconColor: "text-blue-400",
  },
];

const FOOTER_LINKS = [
  { href: "/privacy", label: "Kebijakan Privasi" },
  { href: "/terms", label: "Syarat & Ketentuan" },
];

const roleConfig: Record<string, { label: string; icon: any; color: string }> =
  {
    PRESIDENT: {
      label: "Ketua Kelas",
      icon: Crown,
      color: "from-amber-400 to-orange-500",
    },
    VICE_PRESIDENT: {
      label: "Wakil Ketua",
      icon: Users,
      color: "from-blue-400 to-indigo-500",
    },
    SECRETARY: {
      label: "Sekretaris",
      icon: FileText,
      color: "from-emerald-400 to-teal-500",
    },
    TREASURER: {
      label: "Bendahara",
      icon: Wallet,
      color: "from-purple-400 to-pink-500",
    },
    VICE_TREASURER: {
      label: "Wakil Bendahara",
      icon: Wallet,
      color: "from-pink-400 to-rose-500",
    },
    MEMBER: {
      label: "Anggota",
      icon: Users,
      color: "from-dark-400 to-dark-600",
    },
    OWNER: {
      label: "Pemilik Kelas",
      icon: Crown,
      color: "from-rose-400 to-red-500",
    },
  };

export interface TenantLandingProps {
  tenant?: {
    label?: string;
    universityName?: string;
    className?: string;
  };
  tenantId?: string;
  university?: string;
  program?: string;
  classSlug?: string;
  customSlug?: string;
  /** Real org/member data resolved server-side for public landing access. */
  members?: OrgMember[];
}

export default function TenantLanding({
  tenant,
  tenantId,
  university,
  program,
  classSlug,
  customSlug,
  members: serverMembers,
}: TenantLandingProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<OrgMember[]>(serverMembers ?? []);
  const [isMembersLoading, setIsMembersLoading] = useState(!serverMembers);

  const tenantPath = customSlug ? `/${customSlug}` : "";

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const url = tenantId
          ? `/api/member?tenantId=${encodeURIComponent(tenantId)}`
          : "/api/member";
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            const convertedMembers = result.data.map((user: any) =>
              convertUserToOrgMember(user)
            );
            setMembers(convertedMembers);
          }
        }
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setIsMembersLoading(false);
      }
    };

    fetchMembers();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchMembers();
    };
    const handleFocus = () => fetchMembers();
    const handlePageShow = () => fetchMembers();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const navigateWithLoading = (
    href: string,
    options?: { external?: boolean },
  ) => {
    setIsLoading(true);

    window.setTimeout(() => {
      if (options?.external) {
        window.open(href, "_blank", "noopener,noreferrer");
        setIsLoading(false);
      } else {
        router.push(href);
      }
    }, 500);
  };

  const handleLoginClick = () => {
    navigateWithLoading("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-50 dark:bg-dark-950 relative overflow-hidden">
      <Loading
        isVisible={isLoading}
        message="Sedang memuat halaman"
        subMessage="Silakan tunggu sebentar..."
      />
      {}
      <PageBackground />

      {}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar router={router} onLoginClick={handleLoginClick} />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <HeroSection tenantLabel={tenant?.label} router={router} navigateWithLoading={navigateWithLoading} tenantPath={tenantPath} />
            <StatsSection memberCount={members.length} />
            <AboutSection tenantLabel={tenant?.label} />
            <OrganizationSection members={members} isMembersLoading={isMembersLoading} navigateWithLoading={navigateWithLoading} tenantPath={tenantPath} />
          </div>
        </main>
        <Footer router={router} />
      </div>

      {}
      <style jsx global>{`
        @keyframes gradient {
          0%,
          100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        .animate-gradient {
          animation: gradient 8s ease infinite;
        }
      `}</style>
    </div>
  );
}

function Navbar({
  router,
  onLoginClick,
}: {
  router: ReturnType<typeof useRouter>;
  onLoginClick?: () => void;
}) {
  return (
    <nav className="border-b border-dark-200/60 dark:border-dark-800 backdrop-blur-md sticky top-0 z-50 bg-dark-50 dark:bg-dark-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/30 overflow-hidden">
              <Image
                src="/logo.jpg"
                alt="kalivergo Logo"
                width={36}
                height={36}
                className="object-cover"
                priority
              />
            </div>
            <span className="text-xl font-bold font-display text-dark-900 dark:text-white">
              Kalivergo
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onLoginClick ?? (() => router.push("/login"))}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-2 text-sm font-medium text-dark-900 dark:text-white hover:shadow-lg hover:shadow-primary-500/30 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Login
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection({
  router,
  navigateWithLoading,
  tenantLabel,
  tenantPath,
}: {
  router: ReturnType<typeof useRouter>;
  navigateWithLoading: (href: string, options?: { external?: boolean }) => void;
  tenantLabel?: string;
  tenantPath?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <div className="inline-flex items-center gap-2 rounded-full bg-dark-100/80 dark:bg-dark-800/70 backdrop-blur-sm border border-dark-300 dark:border-dark-700 px-4 py-1.5 text-sm font-medium mb-8">
        <Sparkles className="h-4 w-4 text-primary-400" />
        <span className="text-dark-900 dark:text-white">Class Management System</span>
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display tracking-tight text-dark-900 dark:text-white">
        Welcome to{" "}
        <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent animate-gradient">
          Kalivergo
        </span>
      </h1>

      <p className="mt-6 text-lg text-muted leading-relaxed">
        Platform terpadu untuk manajemen kelas{" "}
        {tenantLabel ?? " Universitas Pamulang"}.
        Tracking tugas, kelola keuangan, dan pantau kegiatan seminar dalam satu
        tempat.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
        <button
          onClick={() => navigateWithLoading("/signup")}
          className="flex items-center gap-2 rounded-xl bg-white text-dark-900 dark:bg-dark-900 dark:text-white px-8 py-3.5 text-base font-semibold hover:bg-gray-100 dark:hover:bg-dark-800 transition-all shadow-xl shadow-white/10 hover:shadow-2xl hover:scale-105"
        >
          Daftar Sekarang
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function StatsSection({ memberCount }: { memberCount: number }) {
  return (
    <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
      {STATS.map((stat) => {
        const Icon = stat.icon;
        const value = (stat as { dynamicMemberCount?: boolean }).dynamicMemberCount
          ? String(memberCount)
          : stat.value;
        return (
          <div
            key={stat.label}
            className="rounded-2xl bg-white/80 dark:bg-dark-800/70 backdrop-blur-md border border-dark-200/60 dark:border-dark-800 p-6 text-center hover:bg-white dark:bg-dark-800/70 transition-all hover:scale-105"
          >
            <Icon className="h-6 w-6 mx-auto mb-2 text-primary-400" />
            <p className="text-3xl font-bold font-display text-dark-900 dark:text-white">
              {value}
            </p>
            <p className="text-sm text-faint mt-1">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function AboutSection({ tenantLabel }: { tenantLabel?: string }) {
  return (
    <div className="mt-24 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-dark-900 dark:text-white mb-8 text-center">
        Tentang {tenantLabel ? tenantLabel.split(" ")[0] : "kalivergo"}
      </h2>

      <div className="bg-white/80 dark:bg-dark-800/70 backdrop-blur-md border border-dark-200/60 dark:border-dark-800 rounded-2xl p-8 hover:bg-white dark:bg-dark-800/70 transition-all">
        <div className="space-y-6 text-muted">
          <div>
            <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-3">
              Platform Manajemen Kelas Terpadu
            </h3>
            <p className="leading-relaxed">
              Kalivergo adalah platform manajemen kelas yang dirancang khusus untuk memudahkan pengelolaan
              kegiatan akademik mahasiswa. Platform ini membantu dalam tracking
              tugas, monitoring keuangan kas kelas, dan koordinasi kegiatan
              seminar dalam satu sistem yang terintegrasi.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-4">
              Fitur Utama
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className={`flex items-start gap-3 p-4 bg-dark-100/80 dark:bg-dark-800/70 rounded-xl border border-dark-200/60 dark:border-dark-800 ${feature.hoverColor} transition-all`}
                  >
                    <Icon
                      className={`h-6 w-6 ${feature.iconColor} flex-shrink-0 mt-1`}
                    />
                    <div>
                      <h4 className="font-semibold text-dark-900 dark:text-white mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-faint">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-3">
              Untuk Siapa Platform Ini?
            </h3>
            <p className="leading-relaxed">
              Kalivergo dirancang khusus untuk mahasiswa dan kelas yang
              membutuhkan sistem manajemen yang terorganisir. Platform ini cocok
              untuk kelas dengan aktivitas tinggi dalam hal tugas, kegiatan
              seminar, dan pengelolaan keuangan bersama.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-3">Teknologi</h3>
            <p className="leading-relaxed">
              Platform ini dibangun menggunakan teknologi modern seperti Next.js
              untuk frontend, PostgreSQL untuk database, dan verifikasi data mahasiswa yang aman.
              Semua data disimpan dengan enkripsi dan backup berkala.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <footer className="border-t border-dark-200/60 dark:border-dark-800 py-8 bg-dark-50 dark:bg-dark-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-faint">
              Kalivergo © {new Date().getFullYear()} - Class Management System
            </p>
          </div>
          <div className="flex items-center gap-6">
            {FOOTER_LINKS.map((link, index) => (
              <div key={link.href} className="flex items-center gap-6">
                {index > 0 && <span className="text-faint">•</span>}
                <button
                  onClick={() => router.push(link.href)}
                  className="text-sm text-faint hover:text-dark-900 dark:text-white transition-colors"
                >
                  {link.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function OrganizationSection({
  members,
  isMembersLoading,
  navigateWithLoading,
  tenantPath,
}: {
  members: OrgMember[];
  isMembersLoading: boolean;
  navigateWithLoading: (href: string, options?: { external?: boolean }) => void;
  tenantPath?: string;
}) {
  const leadership = members.filter(
    (m) =>
      m.role === "OWNER" ||
      m.role === "PRESIDENT" ||
      m.role === "VICE_PRESIDENT" ||
      m.role === "SECRETARY" ||
      m.role === "TREASURER" ||
      m.role === "VICE_TREASURER",
  );

  const regularMembers = members.filter((m) => m.role === "MEMBER");

  const [currentSlide, setCurrentSlide] = useState(0);
  const cardsPerSlide = 6;
  const totalSlides = Math.max(
    1,
    Math.ceil(regularMembers.length / cardsPerSlide),
  );

  useEffect(() => {
    if (totalSlides <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [totalSlides]);

  useEffect(() => {
    setCurrentSlide((prev) => Math.min(prev, totalSlides - 1));
  }, [totalSlides]);

  const renderMemberCard = (member: OrgMember, isLarge = false) => {
    const config = roleConfig[member.role] || roleConfig.MEMBER;
    const Icon = config.icon;

    return (
      <button
        key={member.id}
        type="button"
        title={member.fullName || member.name}
        aria-label={`Lihat portfolio ${member.fullName || member.name}`}
        onClick={() =>
          navigateWithLoading(
            `${tenantPath ? `${tenantPath}/portofolio/` : "/portofolio/"}${encodeURIComponent(
              member.fullName || member.name,
            )}?uid=${encodeURIComponent(member.id)}`,
          )
        }
        className={cn(
          "group relative rounded-2xl border border-dark-200/60 dark:border-dark-800 p-6 text-center",
          "bg-white/80 dark:bg-dark-800/70 backdrop-blur-md",
          "hover:bg-white dark:bg-dark-800/70 transition-all duration-300 hover:scale-105 hover:-translate-y-1",
          "block no-underline w-full cursor-pointer",
        )}
      >
        <div className="relative mb-4">
          <div
            className={cn(
              "mx-auto rounded-full bg-gradient-to-br flex items-center justify-center text-dark-900 dark:text-white font-bold shadow-lg",
              "relative z-10 overflow-hidden",
              isLarge ? "h-24 w-24 text-3xl" : "h-20 w-20 text-2xl",
              config.color,
            )}
          >
            {member.image ? (
              <Image
                src={member.image}
                alt={member.fullName || member.name}
                fill
                loading="lazy"
                decoding="async"
                className="object-cover"
                sizes={isLarge ? "96px" : "80px"}
              />
            ) : (
              <span>{member.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>

        <h3
          className={cn(
            "font-bold text-dark-900 dark:text-white mt-3",
            isLarge ? "text-xl" : "text-lg",
          )}
        >
          {member.name}
        </h3>

        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Icon className="h-4 w-4 text-primary-400" />
          <span className="font-medium text-sm text-muted">
            {config.label}
          </span>
        </div>

        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1.5 text-xs font-medium",
            "text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity",
          )}
        >
          Lihat Portfolio
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </button>
    );
  };

  const startIdx = currentSlide * cardsPerSlide;
  const currentMembers = regularMembers.slice(
    startIdx,
    startIdx + cardsPerSlide,
  );

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  return (
    <div className="mt-24">
      {}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-dark-900 dark:text-white">
              Struktur Organisasi
            </h2>
            <p className="text-sm text-faint"> Universitas Pamulang.</p>
          </div>
        </div>

        {isMembersLoading ? (
          <div className="text-center text-faint py-8">Memuat data anggota...</div>
        ) : leadership.length === 0 ? (
          <div className="text-center text-faint py-12 rounded-2xl border border-dashed border-dark-200/60 dark:border-dark-800 bg-dark-100/80 dark:bg-dark-800/70">
            Belum ada data pengurus.
          </div>
        ) : (
          <div className="grid gap-6">
            {leadership
              .filter((m: OrgMember) => m.role === "OWNER" || m.role === "PRESIDENT")
              .map((m: OrgMember) => renderMemberCard(m, true))}

            {leadership
              .filter((m: OrgMember) => m.role === "VICE_PRESIDENT")
              .map((m: OrgMember) => renderMemberCard(m, true))}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {leadership
                .filter(
                  (m: OrgMember) =>
                    m.role === "SECRETARY" ||
                    m.role === "TREASURER" ||
                    m.role === "VICE_TREASURER",
                )
                .map((m: OrgMember) => renderMemberCard(m))}
            </div>
          </div>
        )}
      </div>

      {}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20 text-primary-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Anggota Kelas</h2>
            <p className="text-sm text-faint">
              {regularMembers.length} anggota aktif
            </p>
          </div>
        </div>

        {isMembersLoading ? (
          <div className="text-center text-faint py-8">Memuat data anggota...</div>
        ) : regularMembers.length === 0 ? (
          <div className="text-center text-faint py-12 rounded-2xl border border-dashed border-dark-200/60 dark:border-dark-800 bg-dark-100/80 dark:bg-dark-800/70">
            Belum ada anggota yang terdaftar.
          </div>
        ) : (
          <div className="relative">
            <div
              key={currentSlide}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 transition-all duration-300"
            >
              {currentMembers.map((m: OrgMember) => renderMemberCard(m))}
            </div>

            {}
            {totalSlides > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={goToPrev}
                  aria-label="Slide sebelumnya"
                  className="p-2 rounded-full bg-dark-100/80 dark:bg-dark-800/70 hover:bg-dark-200/80 dark:bg-dark-700/80 transition-all"
                >
                  <svg
                    className="w-6 h-6 text-dark-900 dark:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalSlides }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      aria-current={idx === currentSlide ? "true" : undefined}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all",
                        idx === currentSlide
                          ? "bg-primary-400 scale-125"
                          : "bg-white/30 hover:bg-dark-100/80 dark:bg-dark-800/700",
                      )}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="Slide berikutnya"
                  className="p-2 rounded-full bg-dark-100/80 dark:bg-dark-800/70 hover:bg-dark-200/80 dark:bg-dark-700/80 transition-all"
                >
                  <svg
                    className="w-6 h-6 text-dark-900 dark:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}