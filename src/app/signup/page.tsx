"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerOwnerClass } from "@/actions/registration";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, Mail, ArrowLeft, Upload, University } from "lucide-react";
import Loading from "@/components/layout/Loading";

type OwnerSignupValues = {
  fullName: string;
  nim: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  customSlug: string;
  universityName: string;
  programName: string;
  className: string;
};

const initialOwnerSignupValues: OwnerSignupValues = {
  fullName: "",
  nim: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  customSlug: "",
  universityName: "",
  programName: "",
  className: "",
};

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formValues, setFormValues] = useState<OwnerSignupValues>(initialOwnerSignupValues);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [ktmFile, setKtmFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [ktmPreview, setKtmPreview] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState("");

  const handleFormChange = (event: React.ChangeEvent<HTMLFormElement>) => {
    if (!(event.target instanceof HTMLInputElement)) return;

    const target = event.target;
    if (target.name in initialOwnerSignupValues) {
      setFormValues((currentValues) => ({
        ...currentValues,
        [target.name]: target.value,
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setShowPopup(false);
    setSubmitStatus("Mengunggah data ke server...");

    try {
      const formData = new FormData();
      formData.append("fullName", formValues.fullName);
      formData.append("nim", formValues.nim);
      formData.append("email", formValues.email);
      formData.append("phone", formValues.phone);
      formData.append("password", formValues.password);
      formData.append("confirmPassword", formValues.confirmPassword);
      formData.append("customSlug", formValues.customSlug);
      formData.append("universityName", formValues.universityName);
      formData.append("programName", formValues.programName);
      formData.append("className", formValues.className);

      if (selfieFile) {
        formData.append("selfieFile", selfieFile);
      }

      if (ktmFile) {
        formData.append("ktmFile", ktmFile);
      }

      const result = await registerOwnerClass(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.success);
        setShowPopup(true);
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
      setSubmitStatus("");
    }
  };

  const handleNavigateToLogin = (event?: React.MouseEvent<HTMLAnchorElement>) => {
    if (event) event.preventDefault();
    setIsLoading(true);
    router.push("/login");
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKtmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setKtmFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtmPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950 p-4 relative">
      <Loading
        isVisible={isLoading}
        message="Mendaftarkan kelas"
        subMessage="Mohon tunggu sebentar, proses sedang berjalan..."
      />

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-dark-900 dark:text-dark-900 mb-2">
              Pengajuan Kelas Berhasil!
            </h2>

            <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-600 mb-4">
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">Menunggu Verifikasi platform</span>
            </div>

            <p className="text-dark-600 dark:text-dark-600 mb-6 leading-relaxed">
              Pengajuan kelas Anda berhasil dikirim. Data Anda sudah masuk ke antrean  dan akan ditinjau dalam 1x24 jam.
              Setelah disetujui, email autentikasi akan dikirim ke Gmail Anda.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-white border border-dark-200 dark:border-dark-200 text-dark-700 dark:text-dark-700 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-50 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
              <button
                onClick={() => setShowPopup(false)}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md"
              >
                Tutup
              </button>
            </div>

            <p className="text-xs text-dark-400 dark:text-dark-400 mt-5">
              Proses review biasanya selesai dalam 1 hari kerja.
            </p>
          </div>
        </div>
      )}

      <div className={`bg-white dark:bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transition-opacity ${showPopup ? "opacity-40 blur-sm" : ""}`}>
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
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-900 font-display">
            Daftar Kelas Baru
          </h1>
          <p className="text-dark-500 dark:text-dark-500 mt-2">
            Buat kelas — lengkapi data universitas, prodi, kelas, nomor telepon, selfie, dan KTM.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-50 border border-red-200 dark:border-red-200 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-600">{error}</p>
          </div>
        )}
        {success && !showPopup && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-50 border border-green-200 dark:border-green-200 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-600">{success}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          onSubmitCapture={() => {
            setSubmitStatus("Menyiapkan upload selfie dan KTM...");
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              name="fullName"
              value={formValues.fullName}
              required
              disabled={isLoading || showPopup}
              className="w-full px-3 py-2 border border-dark-200 dark:border-dark-200 bg-white dark:bg-white text-dark-900 dark:text-dark-900 placeholder:text-dark-400 dark:placeholder:text-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="Masukkan nama lengkap Anda"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-700 mb-1">NIM</label>
            <input
              type="text"
              name="nim"
              value={formValues.nim}
              required
              disabled={isLoading || showPopup}
              className="w-full px-3 py-2 border border-dark-200 dark:border-dark-200 bg-white dark:bg-white text-dark-900 dark:text-dark-900 placeholder:text-dark-400 dark:placeholder:text-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="Masukkan NIM Anda"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-700 mb-1">Email (Gmail)</label>
            <input
              type="email"
              name="email"
              value={formValues.email}
              required
              disabled={isLoading || showPopup}
              className="w-full px-3 py-2 border border-dark-200 dark:border-dark-200 bg-white dark:bg-white text-dark-900 dark:text-dark-900 placeholder:text-dark-400 dark:placeholder:text-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="nama@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-700 mb-1">Nomor Telepon</label>
            <input
              type="tel"
              name="phone"
              value={formValues.phone}
              required
              disabled={isLoading || showPopup}
              className="w-full px-3 py-2 border border-dark-200 dark:border-dark-200 bg-white dark:bg-white text-dark-900 dark:text-dark-900 placeholder:text-dark-400 dark:placeholder:text-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formValues.password}
                required
                disabled={isLoading || showPopup}
                minLength={6}
                className="w-full px-3 py-2 border border-dark-200 dark:border-dark-200 bg-white dark:bg-white text-dark-900 dark:text-dark-900 placeholder:text-dark-400 dark:placeholder:text-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10"
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-dark-400 hover:text-dark-600 dark:hover:text-dark-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-700 mb-1">Ulangi Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formValues.confirmPassword}
                required
                disabled={isLoading || showPopup}
                className="w-full px-3 py-2 border border-dark-200 dark:border-dark-200 bg-white dark:bg-white text-dark-900 dark:text-dark-900 placeholder:text-dark-400 dark:placeholder:text-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10"
                placeholder="Ulangi password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-dark-400 hover:text-dark-600 dark:hover:text-dark-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-700 mb-1">Masukan Nama Website Kelas Mu</label>
            <input
              type="text"
              name="customSlug"
              value={formValues.customSlug}
              required
              disabled={isLoading || showPopup}
              className="w-full px-3 py-2 border border-dark-200 dark:border-dark-200 bg-white dark:bg-white text-dark-900 dark:text-dark-900 placeholder:text-dark-400 dark:placeholder:text-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="Contoh: techfourma"
            />
            <p className="text-xs text-dark-500 dark:text-dark-500 mt-1">
              Slug akan digunakan sebagai subdomain, contoh: kalivergo.com/techfourma
            </p>
          </div>

          <div className="border-t border-dark-200 dark:border-dark-200 pt-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-700 mb-1">Nama Universitas</label>
              <input
                type="text"
                name="universityName"
                value={formValues.universityName}
                required
                disabled={isLoading || showPopup}
                className="w-full px-3 py-2 border border-dark-200 dark:border-dark-200 bg-white dark:bg-white text-dark-900 dark:text-dark-900 placeholder:text-dark-400 dark:placeholder:text-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                placeholder="Contoh: Universitas Pamulang"
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-700 mb-1">Program Studi</label>
              <input
                type="text"
                name="programName"
                value={formValues.programName}
                required
                disabled={isLoading || showPopup}
                className="w-full px-3 py-2 border border-dark-200 dark:border-dark-200 bg-white dark:bg-white text-dark-900 dark:text-dark-900 placeholder:text-dark-400 dark:placeholder:text-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                placeholder="Contoh: Teknik Informatika"
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-700 mb-1">Nama Kelas</label>
              <input
                type="text"
                name="className"
                value={formValues.className}
                required
                disabled={isLoading || showPopup}
                className="w-full px-3 py-2 border border-dark-200 dark:border-dark-200 bg-white dark:bg-white text-dark-900 dark:text-dark-900 placeholder:text-dark-400 dark:placeholder:text-dark-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                placeholder="Contoh: 03TPLE004"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-700 mb-2">Upload Selfie</label>
              <div className="flex items-center gap-4">
                {selfiePreview && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-dark-200 dark:border-dark-200">
                    <Image
                      src={selfiePreview}
                      alt="Selfie preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-dark-300 dark:border-dark-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-dark-50 dark:bg-dark-50">
                  <Upload className="w-5 h-5 text-dark-400 dark:text-dark-400" />
                  <span className="text-sm text-dark-600 dark:text-dark-600">
                    {selfiePreview ? "Ganti foto selfie" : "Pilih foto selfie"}
                  </span>
                  <input
                    type="file"
                    name="selfieFile"
                    accept="image/*"
                    required
                    disabled={isLoading || showPopup}
                    onChange={handleSelfieChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-dark-500 dark:text-dark-500 mt-1">
                Format: JPG/PNG, maks. 5MB. Foto harus jelas menunjukkan wajah Anda.
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-700 mb-2">Upload Foto KTM</label>
              <div className="flex items-center gap-4">
                {ktmPreview && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-dark-200 dark:border-dark-200">
                    <Image
                      src={ktmPreview}
                      alt="KTM preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-dark-300 dark:border-dark-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-dark-50 dark:bg-dark-50">
                  <Upload className="w-5 h-5 text-dark-400 dark:text-dark-400" />
                  <span className="text-sm text-dark-600 dark:text-dark-600">
                    {ktmPreview ? "Ganti foto KTM" : "Pilih foto KTM"}
                  </span>
                  <input
                    type="file"
                    name="ktmFile"
                    accept="image/*"
                    required
                    disabled={isLoading || showPopup}
                    onChange={handleKtmChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-dark-500 dark:text-dark-500 mt-1">
                Format: JPG/PNG/WebP, maks. 5MB. Foto KTM harus terbaca jelas.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || showPopup}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? submitStatus || "Memproses..." : "Ajukan Kelas"}
          </button>
        </form>

        {isLoading && submitStatus && (
          <p className="mt-3 text-center text-sm text-primary-700 dark:text-primary-700">
            {submitStatus}
          </p>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-dark-500 dark:text-dark-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              onClick={handleNavigateToLogin}
              className="text-primary-600 dark:text-primary-600 hover:text-primary-700 dark:hover:text-primary-700 font-medium"
            >
              Masuk di sini
            </Link>
          </p>
          <p className="text-sm text-dark-500 dark:text-dark-500 mt-2">
            Ingin bergabung sebagai member?{" "}
            <Link
              href="/member-signup"
              className="text-accent-600 dark:text-accent-600 hover:text-accent-700 dark:hover:text-accent-700 font-medium"
            >
              Daftar member di sini
            </Link>
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-50 border border-blue-200 dark:border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-700">
            <strong>Catatan:</strong>
            Pengajuan kelas akan melalui proses review oleh platform  dalam 1x24 jam.
            Silahkan periksa email anda untuk verifikasi setelah pengajuan disetujui.
          </p>
        </div>
      </div>
    </div>
  );
}
