"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/actions/cms";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import WaveBackground from "@/components/ui/WaveBackground";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await resetPassword(formData);

      if (result && 'error' in result) {
        setError(result.error);
      } else if (result && 'success' in result && result.success) {

        const msg = (result as any).message || 'Permintaan berhasil. Silakan cek email Anda.';
        setSuccess(msg);
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a14] relative p-4">
      {/* Wave Background */}
      <WaveBackground />
      
      {/* Overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a14]/50 to-[#0a0a14] pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg overflow-hidden">
              <Image
                src="/logo.jpg"
                alt="Kalivergo Logo"
                width={64}
                height={64}
                className="object-cover"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-dark-900 font-display">
            Lupa Password
          </h1>
          <p className="text-dark-500 mt-2">
            Masukkan data untuk reset password akun Anda
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Forgot Password Form */}
        <form action={handleSubmit} className="space-y-4">
          {/* NIM */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              NIM
            </label>
            <input
              type="text"
              name="nim"
              required
              disabled={isLoading || !!success}
              className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="Masukkan NIM Anda"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              Email (Gmail)
            </label>
            <input
              type="email"
              name="email"
              required
              disabled={isLoading || !!success}
              className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="nama@gmail.com"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                required
                disabled={isLoading || !!success}
                minLength={6}
                className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10"
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              Ulangi Password Baru
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                disabled={isLoading || !!success}
                className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10"
                placeholder="Ulangi password baru"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !!success}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? "Memproses..." : success ? "Password Berhasil Diubah" : "Reset Password"}
          </button>
        </form>

        {/* Success Action */}
        {success && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700 mb-2">
              Silakan verifikasi link yang telah dikirimkan ke email Anda untuk melanjutkan reset password.
            </p>
            <Link
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Buka Gmail
            </Link>
          </div>
        )}

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Kembali ke halaman login
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Catatan:</strong> Pastikan NIM dan Email yang Anda masukkan sesuai dengan data yang terdaftar. 
            Jika data tidak cocok, silakan hubungi administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
