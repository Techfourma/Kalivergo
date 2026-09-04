"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { loginPlatformAdmin } from "@/actions/platform-auth";
import Loading from "@/components/layout/Loading";
import PageBackground from "@/components/ui/PageBackground";

export default function PlatformLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const verificationStatus = searchParams.get("verified");
    if (!verificationStatus) return;
    window.alert(
      verificationStatus === "1"
        ? "Password admin platform berhasil diubah. Silakan login dengan password baru."
        : "Link verifikasi reset password tidak valid atau sudah kedaluwarsa."
    );
    router.replace("/platform/login");
  }, [router, searchParams]);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError("");
    try {
      const identifier = formData.get("identifier") as string;
      const password = formData.get("password") as string;
      const result = await loginPlatformAdmin(identifier, password);
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result?.success) {
        router.push("/platform");
      }
    } catch (err) {
      console.error("Platform login error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950 p-4 relative">
      <PageBackground />

      <Loading
        isVisible={isLoading}
        message="Memeriksa kredensial"
        subMessage="Mohon tunggu sebentar..."
      />

      <div className="relative z-10 bg-white/80 dark:bg-dark-800/70 backdrop-blur-md border border-dark-200/60 dark:border-dark-700 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white font-display">
            Login Admin Platform
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-2">
            Akses panel verifikasi KYC &amp; manajemen platform kalivergo
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Gmail
            </label>
            <input
              type="email"
              name="identifier"
              required
              disabled={isLoading}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              placeholder="admin@kalivergo.id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                disabled={isLoading}
                className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10 transition-colors"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-dark-500 hover:text-dark-600 dark:hover:text-dark-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? "Memproses..." : "Masuk ke Panel Platform"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link
            href="/platform/forgot-password"
            className="block text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            Lupa password admin platform?
          </Link>
          <p className="text-sm text-dark-500 dark:text-dark-400">
            Belum punya akun admin?{" "}
            <Link
              href="/platform/register"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
            >
              Daftar di sini
            </Link>
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs text-dark-400 dark:text-dark-500 hover:text-dark-600 dark:hover:text-dark-300 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke login member
          </Link>
        </div>
      </div>
    </div>
  );
}