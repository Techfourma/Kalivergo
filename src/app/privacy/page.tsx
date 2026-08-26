"use client";
import { useState, useEffect } from "react";
import { Shield, Eye, Share2, Lock, UserCheck, Mail, Database, Cookie, ArrowUp, Menu, X } from "lucide-react";
import PageBackground from "@/components/ui/PageBackground";

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const sections = [
    { id: "intro", title: "Pendahuluan", icon: Shield },
    { id: "data-collected", title: "Data yang Dikumpulkan", icon: Database },
    { id: "data-usage", title: "Penggunaan Data", icon: Eye },
    { id: "data-sharing", title: "Berbagi Informasi", icon: Share2 },
    { id: "data-security", title: "Keamanan Data", icon: Lock },
    { id: "data-retention", title: "Penyimpanan Data", icon: Database },
    { id: "third-party", title: "Layanan Pihak Ketiga", icon: Share2 },
    { id: "cookies", title: "Cookies", icon: Cookie },
    { id: "your-rights", title: "Hak Anda", icon: UserCheck },
    { id: "contact", title: "Kontak", icon: Mail },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      const scrollPosition = window.scrollY + 100;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
      setMobileTocOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-950 relative overflow-hidden">
      {/* Wave Background */}
      <PageBackground />

      {/* Overlay gradient untuk depth */}

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header - Transparent Background */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-dark-100/80 dark:bg-dark-800/70 backdrop-blur-sm rounded-xl">
                <Shield className="h-8 w-8 text-dark-900 dark:text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-display text-dark-900 dark:text-white">Kebijakan Privasi</h1>
                <p className="text-muted mt-1">Transparansi dalam pengelolaan data Anda</p>
              </div>
            </div>
            <p className="text-muted mt-6 max-w-2xl">
              Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
          <div className="flex gap-8">
            {/* Table of Contents - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-8 bg-dark-100/80 dark:bg-dark-800/70 backdrop-blur-md rounded-2xl shadow-sm border border-dark-200/60 dark:border-dark-800 p-6">
                <h3 className="font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                  <Menu className="h-4 w-4" />
                  Daftar Isi
                </h3>
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeSection === section.id
                            ? "bg-primary-50 text-primary-300 font-medium"
                            : "text-muted hover:bg-dark-100/80 dark:bg-dark-800/70 hover:text-dark-900 dark:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Mobile TOC Button */}
            <div className="lg:hidden fixed bottom-6 right-6 z-40">
              <button
                onClick={() => setMobileTocOpen(!mobileTocOpen)}
                className="p-4 bg-primary-600 text-dark-900 dark:text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
              >
                {mobileTocOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Mobile TOC Panel */}
            {mobileTocOpen && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileTocOpen(false)}>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-dark-50 dark:bg-dark-950 rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto border-t border-dark-200/60 dark:border-dark-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="font-semibold text-dark-900 dark:text-white mb-4">Daftar Isi</h3>
                  <nav className="space-y-1">
                    {sections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted hover:bg-dark-100/80 dark:bg-dark-800/70 hover:text-dark-900 dark:text-white"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{section.title}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            )}

            {/* Main Content */}
            <main className="flex-1 max-w-3xl">
              <div className="bg-dark-100/80 dark:bg-dark-800/70 backdrop-blur-md rounded-2xl shadow-sm border border-dark-200/60 dark:border-dark-800 p-8 sm:p-12">
                {/* Introduction */}
                <section id="intro" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-primary-500/20 rounded-xl">
                      <Shield className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Pendahuluan</h2>
                      <p className="text-faint text-sm mt-1">Komitmen kami terhadap privasi Anda</p>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none text-muted leading-relaxed space-y-4">
                    <p>
                      Selamat datang di Kalivergo. Kami menghargai kepercayaan Anda dan berkomitmen untuk melindungi privasi data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat menggunakan platform kami.
                    </p>
                    <div className="bg-amber-500/10 border-l-4 border-amber-500/50 p-4 rounded-r-lg">
                      <p className="text-amber-200 text-sm">
                        <strong>Penting:</strong> Dengan menggunakan Kalivergo, Anda menyetujui pengumpulan dan penggunaan informasi sesuai dengan kebijakan ini.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Data Collected */}
                <section id="data-collected" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <Database className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Data yang Kami Kumpulkan</h2>
                      <p className="text-faint text-sm mt-1">Informasi yang kami butuhkan untuk layanan</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">Kami mengumpulkan informasi yang Anda berikan secara langsung:</p>
                    <div className="grid gap-3">
                      {[
                        { label: "Nama Lengkap", desc: "Untuk identifikasi dan komunikasi" },
                        { label: "Alamat Email", desc: "Untuk login dan notifikasi" },
                        { label: "Nomor Induk Mahasiswa (NIM)", desc: "Untuk verifikasi keanggotaan kelas" },
                        { label: "Foto Profil", desc: "Opsional, untuk personalisasi akun" },
                        { label: "Data Akademik", desc: "Informasi tugas dan aktivitas kelas" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-dark-100/80 dark:bg-dark-800/70 rounded-lg border border-dark-200/60 dark:border-dark-800">
                          <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-dark-900 dark:text-white">{item.label}</p>
                            <p className="text-sm text-faint">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Data Usage */}
                <section id="data-usage" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <Eye className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Bagaimana Kami Menggunakan Data</h2>
                      <p className="text-faint text-sm mt-1">Tujuan penggunaan informasi Anda</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">Informasi Anda digunakan untuk:</p>
                    <ul className="space-y-3">
                      {[
                        "Mengelola tugas dan kegiatan kelas",
                        "Monitoring keuangan kas kelas",
                        "Komunikasi antar anggota kelas",
                        "Verifikasi keanggotaan",
                        "Meningkatkan pengalaman pengguna",
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 bg-primary-400 rounded-full" />
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* Data Sharing */}
                <section id="data-sharing" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-orange-500/20 rounded-xl">
                      <Share2 className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Berbagi Informasi</h2>
                      <p className="text-faint text-sm mt-1">Dengan siapa data Anda dibagikan</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <div className="bg-red-500/10 border-l-4 border-red-500/50 p-4 rounded-r-lg mb-4">
                      <p className="text-red-200 font-medium">
                        Kami TIDAK menjual atau menyewakan data pribadi Anda kepada pihak ketiga.
                      </p>
                    </div>
                    <p className="mb-4">Informasi hanya dibagikan dengan:</p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-primary-400 rounded-full" />
                        </div>
                        <span>Anggota kelas Kalivergo untuk keperluan akademik</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-primary-400 rounded-full" />
                        </div>
                        <span>Pihak berwenang jika diwajibkan oleh hukum</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Data Security */}
                <section id="data-security" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <Lock className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Keamanan Data</h2>
                      <p className="text-faint text-sm mt-1">Langkah perlindungan yang kami ambil</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">
                      Kami menggunakan enkripsi dan langkah keamanan standar industri untuk melindungi data Anda:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { title: "Enkripsi SSL/TLS", desc: "Data dikirim dengan aman" },
                        { title: "Database Terenkripsi", desc: "Penyimpanan yang aman" },
                        { title: "Autentikasi Credentials", desc: "Login via NIM & Password" },
                        { title: "Backup Berkala", desc: "Data selalu tersedia" },
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 bg-dark-100/80 dark:bg-dark-800/70 rounded-lg border border-dark-200/60 dark:border-dark-800">
                          <p className="font-medium text-dark-900 dark:text-white text-sm">{item.title}</p>
                          <p className="text-xs text-faint mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Data Retention */}
                <section id="data-retention" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                      <Database className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Penyimpanan dan Penghapusan Data</h2>
                      <p className="text-faint text-sm mt-1">Berapa lama data disimpan</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <div className="space-y-4">
                      <div className="border-l-4 border-primary-500/50 pl-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-2">Periode Penyimpanan</h3>
                        <ul className="space-y-2 text-sm text-muted">
                          <li>• Data akun disimpan selama Anda menjadi anggota aktif</li>
                          <li>• Data tugas dan aktivitas disimpan sesuai kebutuhan akademik</li>
                          <li>• Akun tidak aktif selama 12 bulan akan dihapus</li>
                        </ul>
                      </div>
                      <div className="border-l-4 border-accent-500/50 pl-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-2">Penghapusan Data</h3>
                        <ul className="space-y-2 text-sm text-muted">
                          <li>• Anda dapat meminta penghapusan data kapan saja</li>
                          <li>• Permintaan diproses dalam 30 hari</li>
                          <li>• Hubungi kami untuk permintaan penghapusan</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Third Party */}
                <section id="third-party" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-cyan-500/20 rounded-xl">
                      <Share2 className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Layanan Pihak Ketiga</h2>
                      <p className="text-faint text-sm mt-1">Layanan yang kami gunakan</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">
                      Aplikasi ini menggunakan layanan berikut yang mungkin memproses data Anda:
                    </p>
                    <div className="space-y-3">
                      {[
                        { name: "Vercel", purpose: "Hosting dan deployment aplikasi" },
                        { name: "Neon/PostgreSQL", purpose: "Penyimpanan database" },
                        { name: "bcryptjs", purpose: "Enkripsi password" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-dark-100/80 dark:bg-dark-800/70 rounded-lg border border-dark-200/60 dark:border-dark-800">
                          <div>
                            <p className="font-medium text-dark-900 dark:text-white">{item.name}</p>
                            <p className="text-sm text-faint">{item.purpose}</p>
                          </div>
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Cookies */}
                <section id="cookies" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-yellow-500/20 rounded-xl">
                      <Cookie className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Cookies dan Teknologi Serupa</h2>
                      <p className="text-faint text-sm mt-1">Teknologi yang kami gunakan</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">Aplikasi ini menggunakan cookies untuk:</p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-primary-400 rounded-full" />
                        </div>
                        <span>Session management (status login)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-primary-400 rounded-full" />
                        </div>
                        <span>Preferensi pengguna</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-primary-400 rounded-full" />
                        </div>
                        <span>Keamanan dan autentikasi</span>
                      </li>
                    </ul>
                    <p className="mt-4 text-sm text-faint">
                      Anda dapat mengontrol cookies melalui pengaturan browser Anda.
                    </p>
                  </div>
                </section>

                {/* Your Rights */}
                <section id="your-rights" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-pink-500/20 rounded-xl">
                      <UserCheck className="h-6 w-6 text-pink-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Hak Anda</h2>
                      <p className="text-faint text-sm mt-1">Kontrol atas data Anda</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">Anda berhak untuk:</p>
                    <div className="grid gap-3">
                      {[
                        { title: "Akses Data", desc: "Melihat data pribadi yang kami simpan" },
                        { title: "Koreksi Data", desc: "Meminta perbaikan data yang tidak akurat" },
                        { title: "Hapus Akun", desc: "Menghapus akun dan data Anda" },
                        { title: "Export Data", desc: "Mendapatkan salinan data Anda" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-dark-100/80 dark:bg-dark-800/70 rounded-lg border border-dark-200/60 dark:border-dark-800">
                          <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-400 font-bold">{idx + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-dark-900 dark:text-white">{item.title}</p>
                            <p className="text-sm text-faint">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Contact */}
                <section id="contact" className="scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-primary-500/20 rounded-xl">
                      <Mail className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Kontak</h2>
                      <p className="text-faint text-sm mt-1">Hubungi kami</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">
                      Untuk pertanyaan tentang kebijakan privasi ini atau permintaan terkait data Anda, hubungi kami di:
                    </p>
                    <a
                      href="mailto:jundulloh2109@gmail.com"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-dark-900 dark:text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      <Mail className="h-4 w-4" />
                      jundulloh2109@gmail.com
                    </a>
                    <p className="text-sm text-faint mt-4">
                      Kami akan merespon permintaan Anda dalam waktu 30 hari.
                    </p>
                  </div>
                </section>
              </div>
            </main>
          </div>
        </div>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 bg-primary-600 text-dark-900 dark:text-white rounded-full shadow-lg hover:bg-primary-700 transition-all z-30"
            aria-label="Kembali ke atas"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}