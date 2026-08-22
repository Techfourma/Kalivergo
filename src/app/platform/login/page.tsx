"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { loginPlatformAdmin } from "@/actions/platform-auth";
import Loading from "@/components/layout/Loading";

export default function PlatformLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950 p-4 relative">
      <Loading
        isVisible={isLoading}
        message="Memeriksa kredensial"
        subMessage="Mohon tunggu sebentar..."
      />

      <div className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-dark-900 font-display">
            Login Admin Platform
          </h1>
          <p className="text-dark-500 mt-2">
            Akses panel verifikasi KYC &amp; manajemen platform kalivergo
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
            Gmail
          </label>
          <input
              type="email"
              name="identifier"
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="admin@kalivergo.id"
          />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
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
          <p className="text-sm text-dark-500">
            Belum punya akun admin?{" "}
            <Link
              href="/platform/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Daftar di sini
            </Link>
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs text-dark-400 hover:text-dark-600 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke login member
          </Link>
        </div>
      </div>
    </div>
  );
}