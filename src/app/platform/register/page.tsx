"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, UserPlus, Upload } from "lucide-react";
import { registerPlatformAdmin } from "@/actions/platform-auth";
import Loading from "@/components/layout/Loading";
import PageBackground from "@/components/ui/PageBackground";

export default function PlatformRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await registerPlatformAdmin(formData);
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result?.success) {
        setSuccess(result.success);
        setTimeout(() => router.push("/platform/login"), 800);
      }
    } catch (err) {
      console.error("Platform register error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtpPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950 p-4 relative">
      {/* Theme-aware background */}
      <PageBackground />

      <Loading
        isVisible={isLoading}
        message="Mendaftarkan admin KYC"
        subMessage="Mohon tunggu sebentar..."
      />

      <div className="relative z-10 bg-white/80 dark:bg-dark-800/70 backdrop-blur-md border border-dark-200/60 dark:border-dark-700 p-8 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white font-display">
            Registrasi Admin KYC
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-2">
            Buat akun ADMIN_KYC - menunggu approval dari SUPER_ADMIN_KYC
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              required
              disabled={isLoading || !!success}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="Nama lengkap admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Email (Gmail)
            </label>
            <input
              type="email"
              name="email"
              required
              disabled={isLoading || !!success}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="admin@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Alamat Lengkap
            </label>
            <textarea
              name="address"
              required
              disabled={isLoading || !!success}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="Alamat lengkap tempat tinggal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Nomor Telepon
            </label>
            <input
              type="tel"
              name="phone"
              required
              disabled={isLoading || !!success}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="08xxxxxxxxxx"
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
                disabled={isLoading || !!success}
                minLength={6}
                className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10"
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-dark-500 hover:text-dark-600 dark:hover:text-dark-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Ulangi Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                disabled={isLoading || !!success}
                className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10"
                placeholder="Ulangi password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-dark-500 hover:text-dark-600 dark:hover:text-dark-300"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Upload Foto KTP
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dark-300 dark:border-dark-600 border-dashed rounded-lg hover:border-primary-500 transition-colors bg-dark-50 dark:bg-dark-700">
              <div className="space-y-1 text-center">
                {ktpPreview ? (
                  <div className="relative">
                    <img src={ktpPreview} alt="KTP Preview" className="mx-auto h-32 object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setKtpPreview(null);
                        const input = document.getElementById('ktpFile') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <EyeOff className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-dark-400 dark:text-dark-500" />
                    <div className="flex text-sm text-dark-600 dark:text-dark-400">
                      <label
                        htmlFor="ktpFile"
                        className="relative cursor-pointer bg-white dark:bg-dark-600 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500"
                      >
                        <span>Upload file KTP</span>
                        <input
                          id="ktpFile"
                          name="ktpFile"
                          type="file"
                          accept="image/*"
                          required
                          disabled={isLoading || !!success}
                          className="sr-only"
                          onChange={handleKtpChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-dark-500 dark:text-dark-400">PNG, JPG, JPEG maksimal 5MB</p>
                  </>
                )}
                </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Upload Foto Selfie
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dark-300 dark:border-dark-600 border-dashed rounded-lg hover:border-primary-500 transition-colors bg-dark-50 dark:bg-dark-700">
              <div className="space-y-1 text-center">
                {selfiePreview ? (
                  <div className="relative">
                    <img src={selfiePreview} alt="Selfie Preview" className="mx-auto h-32 w-32 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelfiePreview(null);
                        const input = document.getElementById('selfieFile') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <EyeOff className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-dark-400 dark:text-dark-500" />
                    <div className="flex text-sm text-dark-600 dark:text-dark-400">
                      <label
                        htmlFor="selfieFile"
                        className="relative cursor-pointer bg-white dark:bg-dark-600 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500"
                      >
                        <span>Upload foto selfie</span>
                        <input
                          id="selfieFile"
                          name="selfieFile"
                          type="file"
                          accept="image/*"
                          required
                          disabled={isLoading || !!success}
                          className="sr-only"
                          onChange={handleSelfieChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-dark-500 dark:text-dark-400">PNG, JPG, JPEG maksimal 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Kode Registrasi{" "}
              <span className="text-xs text-dark-400 dark:text-dark-500 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              name="registrationCode"
              disabled={isLoading || !!success}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="Isi jika diatur oleh tim kalivergo"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !!success}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center justify-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {isLoading ? "Memproses..." : "Daftar Admin KYC"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-dark-500 dark:text-dark-400">
            Sudah punya akun admin?{" "}
            <Link
              href="/platform/login"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Login di sini
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