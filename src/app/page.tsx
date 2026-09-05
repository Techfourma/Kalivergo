"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import Loading from "@/components/layout/Loading";
import { cn } from "@/lib/utils";
import PageBackground from "@/components/ui/PageBackground";

const FEATURES = [
  {
    icon: BookOpenCheck,
    title: "Tracking Tugas",
    description: "Pantau deadline, status pengumpulan, dan progres tugas kuliah setiap anggota secara real-time.",
    color: "text-primary-600 dark:text-primary-400",
    bg: "bg-primary-500/10",
    border: "hover:border-primary-500/50",
  },
  {
    icon: Wallet,
    title: "Manajemen Keuangan",
    description: "Kelola arus kas kelas, hitung tunggakan uang kas otomatis, dan unggah bukti transaksi dengan transparan.",
    color: "text-accent-600 dark:text-accent-400",
    bg: "bg-accent-500/10",
    border: "hover:border-accent-500/50",
  },
  {
    icon: GraduationCap,
    title: "Seminar & Kegiatan",
    description: "Daftarkan seminar, pantau kehadiran, dan koordinasikan seluruh agenda kelas dalam satu kalender.",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
    border: "hover:border-green-500/50",
  },
  {
    icon: ShieldCheck,
    title: "Verifikasi & Keamanan",
    description: "Setiap kelas diverifikasi oleh platform melalui proses KYC. Data anggota aman dan terkontrol.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "hover:border-blue-500/50",
  },
];

const STEPS = [
  { step: "01", icon: Building2, title: "Daftarkan Kelasmu", description: "Owner kelas mendaftarkan universitas, program studi, dan kelas. Cukup sekali, langsung terintegrasi." },
  { step: "02", icon: ShieldCheck, title: "Verifikasi KYC oleh Platform", description: "Tim platform memverifikasi identitas owner. Kelas baru aktif setelah disetujui dan aman digunakan." },
  { step: "03", icon: LayoutDashboard, title: "Kelola & Pantau", description: "Kelola anggota, tugas, keuangan, dan seminar dari dashboard terpadu yang mudah digunakan." },
];

const STATS = [
  { value: "1", label: "Platform Terpadu", icon: Zap },
  { value: "4+", label: "Modul Inti Kelas", icon: LayoutDashboard },
  { value: "100%", label: "Transparansi Data", icon: CheckCircle2 },
];

const BENEFITS = [
  { icon: Users, title: "Multi-Kelas", description: "Satu aplikasi melayani banyak universitas, program studi, dan kelas dengan isolasi data yang ketat." },
  { icon: Landmark, title: "Isolasi Data per Tenant", description: "Setiap kelas adalah tenant independen. Data kelas A tidak pernah tercampur dengan kelas B." },
  { icon: CheckCircle2, title: "Transparan & Akuntabel", description: "Laporan keuangan dan audit log tersedia lengkap untuk setiap kelas dan kepengurusan." },
  { icon: Zap, title: "Cepat & Ringan", description: "Dibangun dengan teknologi modern sehingga responsif di perangkat apa pun, kapan pun." },
];

const FOOTER_LINKS = [
  { href: "/privacy", label: "Kebijakan Privasi" },
  { href: "/terms", label: "Syarat & Ketentuan" },
];

export default function PlatformLandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (href: string) => {
    setIsLoading(true);
    window.setTimeout(() => router.push(href), 200);
  };

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate(href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-50 dark:bg-dark-950 relative overflow-hidden text-slate-700 dark:text-slate-300 transition-colors duration-300">
      {/* ambient 3D background */}
      <PageBackground />

      <Loading
        isVisible={isLoading}
        message="Sedang memuat halaman"
        subMessage="Silakan tunggu sebentar..."
      />

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary-600/20 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 h-[450px] w-[450px] rounded-full bg-accent-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-dark-200/60 dark:border-dark-800 bg-dark-50 dark:bg-dark-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-3 cursor-pointer group"
              aria-label="Beranda Kalivergo"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/30 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.jpg"
                  alt="Kalivergo Logo"
                  width={36}
                  height={36}
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-xl font-bold font-display text-slate-950 dark:text-white transition-colors duration-300">
                Kalivergo
              </span>
            </button>

            <div className="hidden md:flex items-center gap-8 text-sm">
              <button onClick={() => handleNavClick("#fitur")} className="text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors duration-200">
                Fitur
              </button>
              <button onClick={() => handleNavClick("#cara-kerja")} className="text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors duration-200">
                Cara Kerja
              </button>
              <button onClick={() => handleNavClick("#keunggulan")} className="text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors duration-200">
                Keunggulan
              </button>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => handleNavClick("/platform/login")}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all duration-200"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </button>
              <button
                onClick={() => handleNavClick("/login")}
                className="rounded-xl border border-dark-300 dark:border-dark-700 bg-dark-100/80 dark:bg-dark-800/70 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-dark-200/60 dark:hover:bg-dark-800 transition-all duration-200"
              >
                Masuk
              </button>
              <button
                onClick={() => handleNavClick("/signup")}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-2 text-sm font-medium text-white hover:shadow-lg hover:shadow-primary-500/30 hover:scale-105 transition-all duration-200"
              >
                Daftar Kelas
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-slate-950 dark:text-white"
              aria-label="Buka menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-dark-200/60 dark:border-dark-800 bg-dark-50 dark:bg-dark-950/95 backdrop-blur-md px-4 py-4 space-y-1 animate-fade-in-down">
            {[
              { href: "#fitur", label: "Fitur" },
              { href: "#cara-kerja", label: "Cara Kerja" },
              { href: "#keunggulan", label: "Keunggulan" },
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="block w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-dark-100/80 dark:hover:bg-dark-800/70 transition-colors duration-200"
              >
                {item.label}
              </button>
            ))}
            <div className="flex gap-3 pt-3">
              <button
                onClick={() => handleNavClick("/login")}
                className="flex-1 rounded-xl border border-dark-300 dark:border-dark-700 bg-dark-100/80 dark:bg-dark-800/70 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-dark-200/60 dark:hover:bg-dark-800 transition-all duration-200"
              >
                Masuk
              </button>
              <button
                onClick={() => handleNavClick("/signup")}
                className="flex-1 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-2 text-sm font-medium text-white hover:shadow-lg transition-all duration-200"
              >
                Daftar Kelas
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <section className="py-24 lg:py-32 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-dark-100/80 dark:bg-dark-800/70 backdrop-blur-sm border border-dark-300 dark:border-dark-700 px-4 py-1.5 text-sm font-medium mb-8 text-slate-700 dark:text-slate-300 animate-fade-in-up">
              <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span>Platform Terpadu untuk Kelas Kampus</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display tracking-tight max-w-4xl mx-auto leading-tight text-slate-950 dark:text-white animate-fade-in-up [animation-delay:80ms]">
              Kelola Kelasmu di{" "}
              <span className="bg-gradient-to-r from-primary-600 via-accent-600 to-primary-600 dark:from-primary-400 dark:via-accent-400 dark:to-primary-400 bg-clip-text text-transparent">
                Satu Tempat
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto animate-fade-in-up [animation-delay:160ms]">
              Platform terpadu untuk manajemen kelas, tracking tugas, kelola
              keuangan, dan pantau kegiatan seminar dalam satu tempat. Dirancang
              untuk universitas, program studi, dan setiap kelas kampus.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-in-up [animation-delay:240ms]">
              <button
                onClick={() => handleNavClick("/signup")}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-8 py-3.5 text-base font-semibold text-white hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105 transition-all duration-200"
              >
                Daftarkan Kelasmu
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleNavClick("/login")}
                className="flex items-center gap-2 rounded-xl border-2 border-dark-300 dark:border-white/30 bg-dark-100/80 dark:bg-dark-800/70 backdrop-blur-sm px-8 py-3.5 text-base font-semibold text-slate-900 dark:text-white hover:bg-dark-200/60 dark:hover:bg-dark-800 hover:border-dark-400 dark:hover:border-dark-600 hover:scale-105 transition-all duration-200"
              >
                Masuk ke Kelasku
              </button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {STATS.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    style={{ animationDelay: `${300 + i * 100}ms` }}
                    className="rounded-2xl bg-dark-100/80 dark:bg-dark-800/70 backdrop-blur-md border border-dark-200/60 dark:border-dark-800 p-6 text-center hover:bg-dark-200/60 dark:hover:bg-dark-800 transition-all duration-200 hover:scale-105 animate-fade-in-up"
                  >
                    <Icon className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
                    <p className="text-3xl font-bold font-display text-slate-950 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Features */}
          <section id="fitur" className="py-20">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
                FITUR UNGGULAN
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-950 dark:text-white">
                Semua Kebutuhan Kelas, Terintegrasi
              </h2>
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                Empat modul inti yang bekerja bersama menciptakan ekosistem
                manajemen kelas yang utuh dan transparan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    style={{ animationDelay: `${i * 100}ms` }}
                    className={cn(
                      "rounded-2xl bg-dark-100/80 dark:bg-dark-800/70 backdrop-blur-md border border-dark-200/60 dark:border-dark-800 p-6 transition-all duration-200 hover:scale-[1.02] animate-fade-in-up",
                      feature.border
                    )}
                  >
                    <div className={cn("inline-flex h-12 w-12 items-center justify-center rounded-xl", feature.bg)}>
                      <Icon className={cn("h-6 w-6", feature.color)} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* How it works */}
          <section id="cara-kerja" className="py-20">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-semibold text-accent-600 dark:text-accent-400 mb-2">
                CARA KERJA
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-950 dark:text-white">
                Aktifkan Kelasmu dalam 3 Langkah
              </h2>
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                Proses onboarding yang cepat dan aman — dengan verifikasi KYC
                oleh platform untuk menjaga kualitas dan keamanan setiap kelas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    style={{ animationDelay: `${i * 120}ms` }}
                    className="relative rounded-2xl bg-dark-100/80 dark:bg-dark-800/70 backdrop-blur-md border border-dark-200/60 dark:border-dark-800 p-6 hover:bg-dark-200/60 dark:hover:bg-dark-800 transition-all duration-200 animate-fade-in-up"
                  >
                    <span className="absolute top-5 right-6 text-4xl font-bold font-display text-slate-950/10 dark:text-white/10">
                      {step.step}
                    </span>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Benefits */}
          <section id="keunggulan" className="py-20">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                MENGAPA KALIVERGO
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-950 dark:text-white">
                Dibangun untuk Skala dan Keamanan
              </h2>
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                Arsitektur multi-tenant memastikan setiap kelas mendapatkan
                ruang kerjanya sendiri dengan standar keamanan platform.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {BENEFITS.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    style={{ animationDelay: `${i * 100}ms` }}
                    className="flex items-start gap-4 rounded-2xl bg-dark-100/80 dark:bg-dark-800/70 backdrop-blur-md border border-dark-200/60 dark:border-dark-800 p-6 hover:bg-dark-200/60 dark:hover:bg-dark-800 transition-all duration-200 animate-fade-in-up"
                  >
                    <Icon className="h-7 w-7 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{benefit.title}</h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CTA */}
          <section className="py-20">
            <div className="relative overflow-hidden rounded-3xl border border-dark-200/60 dark:border-dark-800 bg-gradient-to-br from-primary-600/30 via-dark-800/40 to-accent-600/30 p-10 sm:p-16 text-center animate-fade-in-up">
              <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary-500/30 blur-[100px]" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent-500/30 blur-[100px]" />
              <h2 className="relative text-3xl sm:text-4xl font-bold font-display text-slate-950 dark:text-white">
                Siap Membawa Kelasmu ke Era Digital?
              </h2>
              <p className="relative mt-4 text-slate-700 dark:text-slate-300 max-w-xl mx-auto">
                Bergabunglah dengan Kalivergo dan rasakan kemudahan mengelola
                tugas, keuangan, dan kegiatan kelas dalam satu platform.
              </p>
              <button
                onClick={() => handleNavClick("/signup")}
                className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white dark:bg-dark-900 text-slate-950 dark:text-white px-8 py-3.5 text-base font-semibold hover:bg-slate-100 dark:hover:bg-dark-800 hover:scale-105 transition-all duration-200"
              >
                Daftar Sekarang
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-200/60 dark:border-dark-800 py-8 bg-dark-50 dark:bg-dark-950/90 backdrop-blur-md relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Kalivergo © {new Date().getFullYear()} — Platform Manajemen Kelas Terpadu
              </p>
            </div>
            <div className="flex items-center gap-6">
              {FOOTER_LINKS.map((link, index) => (
                <div key={link.href} className="flex items-center gap-6">
                  {index > 0 && <span className="text-slate-400 dark:text-slate-600">•</span>}
                  <button
                    onClick={() => handleNavClick(link.href)}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </button>
                </div>
              ))}
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <button
                onClick={() => handleNavClick("/platform/login")}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors duration-200"
              >
                Panel Platform
              </button>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.25s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up,
          .animate-fade-in-down {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}