"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerMember, getRegistrationData, type RegistrationUniversity } from "@/actions/registration";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, Mail, ArrowLeft, LogIn, Users, Upload, User as UserIcon, CreditCard } from "lucide-react";
import Loading from "@/components/layout/Loading";
import PageBackground from "@/components/ui/PageBackground";

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
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [ktmPhoto, setKtmPhoto] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [ktmPreview, setKtmPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getRegistrationData();
      setRegistrationData(data);
    };
    loadData();
  }, []);

  const filteredPrograms = registrationData.find(u => u.slug === selectedUniversity)?.programs || [];
  const filteredClasses = filteredPrograms.find(p => p.slug === selectedProgram)?.classes || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: "profile" | "ktm") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (JPG, PNG, dll).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB.");
      return;
    }
    setError("");

    if (fileType === "profile") {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setKtmPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtmPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!selectedUniversity || !selectedProgram || !selectedClass) {
      setError("Silakan pilih universitas, program studi, dan kelas.");
      return;
    }
    if (!profilePhoto) {
      setError("Foto profil wajib diunggah.");
      return;
    }
    if (!ktmPhoto) {
      setError("Foto KTM wajib diunggah.");
      return;
    }

    formData.set("university", selectedUniversity);
    formData.set("program", selectedProgram);
    formData.set("class", selectedClass);
    formData.set("profilePhoto", profilePhoto);
    formData.set("ktmPhoto", ktmPhoto);

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
    <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950 p-4 relative">
      <PageBackground />

      <Loading
        isVisible={isLoading}
        message="Mendaftarkan anggota"
        subMessage="Mohon tunggu sebentar, proses sedang berjalan..."
      />

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative border border-dark-200/60 dark:border-dark-700">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
              Pendaftaran Member Berhasil!
            </h2>
            <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 mb-4">
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">Menunggu Persetujuan</span>
            </div>
            <p className="text-dark-600 dark:text-dark-400 mb-6 leading-relaxed">
              Akun member Anda berhasil didaftarkan untuk kelas{" "}
              <span className="font-semibold text-dark-900 dark:text-white">
                {selectedClass}
              </span>.
              {" "}Pendaftaran Anda sedang menunggu persetujuan admin/owner kelas.{" "}
              Setelah disetujui, link verifikasi akan dikirim ke email{" "}
              <span className="font-semibold text-dark-900 dark:text-white">
                (termasuk folder spam/promosi)
              </span>{" "}
              untuk mengaktifkan akun Anda.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-dark-700 border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-600 transition-colors font-medium"
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
            <p className="text-xs text-dark-400 dark:text-dark-500 mt-5">
              Link verifikasi berlaku selama 1 jam.
            </p>
          </div>
        </div>
      )}

      <div className={`bg-white/80 dark:bg-dark-800/70 backdrop-blur-md border border-dark-200/60 dark:border-dark-700 p-8 rounded-2xl shadow-2xl w-full max-w-md transition-opacity ${showPopup ? "opacity-40 blur-sm" : ""}`}>
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
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white font-display">
            Daftar Member
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-2">
            Bergabung dengan kelas yang sudah ada — pilih universitas, program studi, dan kelas Anda
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && !showPopup && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Nama Lengkap</label>
            <input
              type="text"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading || showPopup}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">NIM</label>
            <input
              type="text"
              name="nim"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              required
              disabled={isLoading || showPopup}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              placeholder="Masukkan NIM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Email (Gmail)</label>
            <input
              type="email"
              name="email"
              required
              disabled={isLoading || showPopup}
              className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              placeholder="nama@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                disabled={isLoading || showPopup}
                minLength={6}
                className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10 transition-colors"
                placeholder="Minimal 6 karakter"
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

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Ulangi Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                disabled={isLoading || showPopup}
                className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 pr-10 transition-colors"
                placeholder="Ulangi password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-dark-500 hover:text-dark-600 dark:hover:text-dark-300 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="border-t border-dark-200 dark:border-dark-700 pt-4">
            <h3 className="text-sm font-semibold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Kelas Anda
            </h3>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Universitas</label>
              <select
                value={selectedUniversity}
                onChange={(e) => {
                  setSelectedUniversity(e.target.value);
                  setSelectedProgram("");
                  setSelectedClass("");
                }}
                required
                disabled={isLoading || showPopup}
                className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              >
                <option value="">Pilih universitas</option>
                {registrationData.map((uni) => (
                  <option key={uni.slug} value={uni.slug}>{uni.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Program Studi</label>
              <select
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  setSelectedClass("");
                }}
                required
                disabled={isLoading || showPopup || !selectedUniversity}
                className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              >
                <option value="">Pilih program studi</option>
                {filteredPrograms.map((prog) => (
                  <option key={prog.slug} value={prog.slug}>{prog.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
                disabled={isLoading || showPopup || !selectedProgram}
                className="w-full px-3 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg text-dark-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              >
                <option value="">Pilih kelas</option>
                {filteredClasses.map((cls) => (
                  <option key={cls.slug} value={cls.slug}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-dark-200 dark:border-dark-700 pt-4">
            <h3 className="text-sm font-semibold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Dokumen Pendukung
            </h3>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Foto Profil</label>
              <div className="flex items-center gap-4">
                {profilePreview ? (
                  <div className="relative h-20 w-20 rounded-full overflow-hidden border border-dark-200 dark:border-dark-600">
                    <Image
                      src={profilePreview}
                      alt="Preview foto profil"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-dark-100 dark:bg-dark-700 flex items-center justify-center border border-dark-200 dark:border-dark-600">
                    <UserIcon className="h-8 w-8 text-dark-400 dark:text-dark-500" />
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    name="profilePhoto"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "profile")}
                    disabled={isLoading || showPopup}
                    className="hidden"
                    required
                  />
                  <div className="flex items-center gap-2 px-4 py-2 border border-dark-300 dark:border-dark-600 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors bg-white dark:bg-dark-700">
                    <Upload className="h-4 w-4 text-dark-500 dark:text-dark-400" />
                    <span className="text-sm text-dark-600 dark:text-dark-400">
                      {profilePhoto ? profilePhoto.name : "Pilih foto profil"}
                    </span>
                  </div>
                </label>
              </div>
              <p className="text-xs text-dark-400 dark:text-dark-500 mt-1">Format: JPG, PNG. Maksimal 5MB.</p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Foto KTM</label>
              <div className="flex items-center gap-4">
                {ktmPreview ? (
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-dark-200 dark:border-dark-600">
                    <Image
                      src={ktmPreview}
                      alt="Preview foto KTM"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-dark-100 dark:bg-dark-700 flex items-center justify-center border border-dark-200 dark:border-dark-600">
                    <CreditCard className="h-8 w-8 text-dark-400 dark:text-dark-500" />
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    name="ktmPhoto"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "ktm")}
                    disabled={isLoading || showPopup}
                    className="hidden"
                    required
                  />
                  <div className="flex items-center gap-2 px-4 py-2 border border-dark-300 dark:border-dark-600 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors bg-white dark:bg-dark-700">
                    <Upload className="h-4 w-4 text-dark-500 dark:text-dark-400" />
                    <span className="text-sm text-dark-600 dark:text-dark-400">
                      {ktmPhoto ? ktmPhoto.name : "Pilih foto KTM"}
                    </span>
                  </div>
                </label>
              </div>
              <p className="text-xs text-dark-400 dark:text-dark-500 mt-1">Format: JPG, PNG. Maksimal 5MB.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || showPopup || !selectedUniversity || !selectedProgram || !selectedClass || !profilePhoto || !ktmPhoto}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? "Memproses..." : "Daftar Member"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-dark-500 dark:text-dark-400">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              onClick={handleNavigateToLogin}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Masuk di sini
            </Link>
          </p>
          <p className="text-sm text-dark-500 dark:text-dark-400 mt-2">
            Ingin membuat kelas sendiri?{" "}
            <Link
              href="/signup"
              className="text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 font-medium"
            >
              Daftar sebagai owner di sini
            </Link>
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            <strong>Catatan:</strong> Pilih universitas, program studi, dan kelas yang ingin Anda ikuti.
            Setelah mendaftar, pendaftaran Anda akan menunggu persetujuan dari admin/owner kelas.
            Setelah disetujui, link verifikasi akan dikirim ke email Anda (cek inbox atau folder spam).
          </p>
        </div>
      </div>
    </div>
  );
}