"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import WaveBackground from "@/components/ui/WaveBackground";
import Loading from "@/components/layout/Loading";

export default function LoginPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetSuccess = params.get("reset-success");
    if (resetSuccess === "1") {
      alert("Selamat akun anda berhasil reset password");
      router.push("/login");
    }
  }, [router]);

  const startLoading = () => {
    setIsLoading(true);
    setError("");
  };

  const handleNavigate = (href: string) => {
    startLoading();
    window.setTimeout(() => router.push(href), 150);
  };

  const handleSubmit = async (formData: FormData) => {
    startLoading();

    const nim = formData.get("nim") as string;
    const password = formData.get("password") as string;
    try {
      const { loginUserUniversal } = await import("@/actions/universal-auth");
      const result = await loginUserUniversal(nim, password);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        localStorage.setItem("user", JSON.stringify(result.user));
        const redirectUrl = result.redirectUrl || "/home";
        window.location.assign(redirectUrl);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Loading
        isVisible={isLoading}
        message="Sedang masuk"
        subMessage="Mohon tunggu sebentar..."
      />
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a14] relative p-4">
        <WaveBackground />
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a14]/50 to-[#0a0a14] pointer-events-none" />
        <div className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg overflow-hidden">
                <Image src="/logo.jpg" alt="Kalivergo Logo" width={64} height={64} className="object-cover" priority />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-dark-900 font-display">Selamat Datang di Kalivergo </h1>
            <p className="text-dark-500 mt-2">Masuk untuk mengelola tugas, keuangan, dan kegiatan kelas</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">NIM</label>
              <input type="text" name="nim" required disabled={isLoading} className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50" placeholder="Masukkan NIM Anda" />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" required disabled={isLoading} className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10" placeholder="Masukkan password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link href="/forgot-password" onClick={(e) => { e.preventDefault(); handleNavigate("/forgot-password"); }} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Lupa password?
              </Link>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">
              {isLoading ? "Memproses..." : "Masuk Sekarang"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-dark-500">
              Belum punya akun?{" "}
              <Link
                href="/member-signup"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate("/member-signup");
                }}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-dark-100">
            <Link
              href="/platform/login"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate("/platform/login");
              }}
              className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <ShieldCheck className="h-4 w-4" />
              Login Admin Platform (Panel KYC)
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}