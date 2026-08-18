"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerMember, getRegistrationData, type RegistrationUniversity } from "@/actions/registration";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, Mail, ArrowLeft, LogIn, Users } from "lucide-react";
import Loading from "@/components/layout/Loading";

export default function MemberSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationUniversity[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [fullName, setFullName] = useState("");
  const [nim, setNim] = useState("");
  const [matchedClass, setMatchedClass] = useState<{ university: string; program: string; class: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getRegistrationData();
      setRegistrationData(data);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (fullName.trim() && nim.trim() && registrationData.length > 0) {
      const normalizedInputName = fullName.toLowerCase().trim().replace(/\s+/g, " ");
      const normalizedInputNim = nim.trim();

      for (const uni of registrationData) {
        for (const prog of uni.programs) {
          for (const cls of prog.classes) {
            if (cls.members?.some((m: any) => {
              const dbName = m.name.toLowerCase().trim().replace(/\s+/g, " ");
              const dbNim = m.nim ? m.nim.trim() : "";
              return dbName === normalizedInputName && dbNim === normalizedInputNim;
            })) {
              setMatchedClass({
                university: uni.slug,
                program: prog.slug,
                class: cls.slug,
              });
              setSelectedUniversity(uni.slug);
              setSelectedProgram(prog.slug);
              setSelectedClass(cls.slug);
              return;
            }
          }
        }
      }
    }
  }, [fullName, nim, registrationData]);

  const filteredPrograms = registrationData.find(u => u.slug === selectedUniversity)?.programs || [];
  const filteredClasses = filteredPrograms.find(p => p.slug === selectedProgram)?.classes || [];

  const handleSubmit = async (formData: FormData) => {
    if (!matchedClass) {
      setError("Nama dan NIM tidak ditemukan dalam data CMS kelas manapun. Silakan hubungi owner kelas Anda.");
      return;
    }

    formData.set("university", matchedClass.university);
    formData.set("program", matchedClass.program);
    formData.set("class", matchedClass.class);

    setIsLoading(true);
    setError("");
    setSuccess("");
    setShowPopup(false);

    try {
      const result = await registerMember(formData);
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
    }
  };

  const handleNavigateToLogin = (event?: React.MouseEvent<HTMLAnchorElement>) => {
    if (event) event.preventDefault();
    setIsLoading(true);
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950 p-4 relative">
      <Loading
        isVisible={isLoading}
        message="Mendaftarkan anggota"
        subMessage="Mohon tunggu sebentar, proses sedang berjalan..."
      />

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-dark-900 mb-2">
              Pendaftaran Member Berhasil!
            </h2>

            <div className="flex items-center justify-center gap-2 text-primary-600 mb-4">
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">Verifikasi Email Diperlukan</span>
            </div>

            <p className="text-dark-600 mb-6 leading-relaxed">
              Akun member Anda berhasil didaftarkan untuk kelas{" "}
              <span className="font-semibold text-dark-900">
                {matchedClass?.class}
              </span>.
              {" "}Silakan cek email{" "}
              <span className="font-semibold text-dark-900">
                (termasuk folder spam/promosi)
              </span>{" "}
              untuk klik link verifikasi akun agar Anda dapat login.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-dark-200 text-dark-700 rounded-lg hover:bg-dark-50 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
              <button
                onClick={() => router.push("/login")}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            </div>

            <p className="text-xs text-dark-400 mt-5">
              Link verifikasi berlaku selama 1 jam.
            </p>
          </div>
        </div>
      )}

      <div className={`bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transition-opacity ${showPopup ? "opacity-40 blur-sm" : ""}`}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg overflow-hidden">
              <Image
                src="/logo.jpg"
                alt="Techfourma Logo"
                width={64}
                height={64}
                className="object-cover"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-dark-900 font-display">
            Daftar Member
          </h1>
          <p className="text-dark-500 mt-2">
            Bergabung dengan kelas yang sudah ada — input nama dan NIM sesuai data CMS
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {success && !showPopup && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading || showPopup || !!matchedClass}
              className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="Masukkan nama lengkap sesuai data CMS"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">NIM</label>
            <input
              type="text"
              name="nim"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              required
              disabled={isLoading || showPopup || !!matchedClass}
              className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="Masukkan NIM sesuai data CMS"
            />
          </div>

          {matchedClass && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">✓ Data cocok dengan kelas yang terdaftar</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Email (Gmail)</label>
            <input
              type="email"
              name="email"
              required
              disabled={isLoading || showPopup}
              className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              placeholder="nama@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                disabled={isLoading || showPopup}
                minLength={6}
                className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10"
                placeholder="Minimal 6 karakter"
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

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Ulangi Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                disabled={isLoading || showPopup}
                className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10"
                placeholder="Ulangi password"
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

          <div className="border-t border-dark-200 pt-4">
            <h3 className="text-sm font-semibold text-dark-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Kelas Anda
            </h3>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Universitas</label>
              <select
                value={selectedUniversity}
                onChange={(e) => {
                  setSelectedUniversity(e.target.value);
                  setSelectedProgram("");
                  setSelectedClass("");
                }}
                required
                disabled={isLoading || showPopup || !!matchedClass}
                className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <option value="">Pilih universitas</option>
                {registrationData.map((uni) => (
                  <option key={uni.slug} value={uni.slug}>{uni.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-dark-700 mb-1">Program Studi</label>
              <select
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSelectedClass("");
                }}
                required
                disabled={isLoading || showPopup || !selectedUniversity || !!matchedClass}
                className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <option value="">Pilih program studi</option>
                {filteredPrograms.map((prog) => (
                  <option key={prog.slug} value={prog.slug}>{prog.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-dark-700 mb-1">Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
                disabled={isLoading || showPopup || !selectedProgram || !!matchedClass}
                className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <option value="">Pilih kelas</option>
                {filteredClasses.map((cls) => (
                  <option key={cls.slug} value={cls.slug}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || showPopup || !matchedClass}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? "Memproses..." : !matchedClass ? "Input Nama & NIM untuk Mencocokkan Kelas" : "Daftar Member"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-dark-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              onClick={handleNavigateToLogin}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Masuk di sini
            </Link>
          </p>
          <p className="text-sm text-dark-500 mt-2">
            Ingin membuat kelas sendiri?{" "}
            <Link
              href="/signup"
              className="text-accent-600 hover:text-accent-700 font-medium"
            >
              Daftar sebagai owner di sini
            </Link>
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Catatan:</strong> Pastikan nama dan NIM yang Anda masukkan sesuai dengan data yang diinput oleh owner di CMS.
            Sistem akan otomatis mencocokkan data Anda dengan kelas yang terdaftar. Setelah mendaftar, cek inbox (atau folder spam) email Anda untuk link verifikasi akun.
          </p>
        </div>
      </div>
    </div>
  );
}