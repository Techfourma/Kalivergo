"use client";
import { useState, useEffect } from "react";
import { FileText, UserCheck, Shield, AlertTriangle, Scale, Mail, ArrowUp, Menu, X, CheckCircle2, XCircle } from "lucide-react";
import PageBackground from "@/components/ui/PageBackground";

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const sections = [
    { id: "acceptance", title: "Penerimaan Syarat", icon: FileText },
    { id: "membership", title: "Keanggotaan", icon: UserCheck },
    { id: "responsibilities", title: "Tanggung Jawab", icon: Shield },
    { id: "acceptable-use", title: "Penggunaan yang Diterima", icon: CheckCircle2 },
    { id: "prohibited", title: "Dilarang", icon: XCircle },
    { id: "intellectual", title: "Kekayaan Intelektual", icon: Shield },
    { id: "liability", title: "Batasan Tanggung Jawab", icon: AlertTriangle },
    { id: "termination", title: "Pengakhiran", icon: XCircle },
    { id: "changes", title: "Perubahan Syarat", icon: FileText },
    { id: "dispute", title: "Penyelesaian Sengketa", icon: Scale },
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
                <FileText className="h-8 w-8 text-dark-900 dark:text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold font-display text-dark-900 dark:text-white">Syarat dan Ketentuan</h1>
                <p className="text-muted mt-1">Aturan penggunaan platform Kalivergo </p>
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
                            ? "bg-accent-50 text-accent-300 font-medium"
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
                className="p-4 bg-accent-600 text-dark-900 dark:text-white rounded-full shadow-lg hover:bg-accent-700 transition-colors"
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
                {/* Acceptance */}
                <section id="acceptance" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-primary-500/20 rounded-xl">
                      <FileText className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">1. Penerimaan Syarat</h2>
                      <p className="text-faint text-sm mt-1">Persetujuan Anda</p>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none text-muted leading-relaxed space-y-4">
                    <p>
                      Dengan mengakses atau menggunakan platform Kalivergo, Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat dengan Syarat dan Ketentuan ini. Jika Anda tidak menyetujui syarat ini, mohon untuk tidak menggunakan layanan kami.
                    </p>
                    <div className="bg-amber-500/10 border-l-4 border-amber-500/50 p-4 rounded-r-lg">
                      <p className="text-amber-200 text-sm">
                        <strong>Penting:</strong> Syarat ini merupakan perjanjian hukum yang mengikat antara Anda dan Kalivergo.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Membership */}
                <section id="membership" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <UserCheck className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">2. Keanggotaan</h2>
                      <p className="text-faint text-sm mt-1">Siapa yang dapat menggunakan layanan</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">Layanan ini hanya tersedia untuk:</p>
                    <div className="space-y-3">
                      {[
                        { title: "Anggota Terdaftar", desc: "Hanya anggota kelas Kalivergo yang terdaftar" },
                        { title: "Usia Minimal", desc: "Berusia minimal 17 tahun atau memiliki izin orang tua/wali" },
                        { title: "Akun Google Valid", desc: "Memiliki akun Google yang aktif dan valid" },
                        { title: "Informasi Akurat", desc: "Memberikan data yang benar saat pendaftaran" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-dark-100/80 dark:bg-dark-800/70 rounded-lg border border-dark-200/60 dark:border-dark-800">
                          <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-400 font-bold text-sm">{idx + 1}</span>
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

                {/* Responsibilities */}
                <section id="responsibilities" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <Shield className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">3. Tanggung Jawab Pengguna</h2>
                      <p className="text-faint text-sm mt-1">Kewajiban Anda sebagai pengguna</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">Anda setuju untuk:</p>
                    <ul className="space-y-3">
                      {[
                        "Memberikan informasi yang akurat dan lengkap saat pendaftaran",
                        "Menjaga kerahasiaan akun dan kata sandi Anda",
                        "Tidak membagikan akun kepada pihak lain",
                        "Menggunakan platform sesuai tujuan akademik",
                        "Menghormati privasi dan hak anggota lain",
                        "Melaporkan aktivitas mencurigakan atau pelanggaran",
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* Acceptable Use */}
                <section id="acceptable-use" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">4. Penggunaan yang Diterima</h2>
                      <p className="text-faint text-sm mt-1">Cara penggunaan yang diperbolehkan</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">Penggunaan yang diperbolehkan termasuk:</p>
                    <div className="grid gap-3">
                      {[
                        "Mengelola dan melacak tugas kelas",
                        "Monitoring keuangan kas kelas",
                        "Komunikasi antar anggota kelas",
                        "Pendaftaran dan manajemen seminar",
                        "Akses materi dan sumber daya kelas",
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                          <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                          <span className="text-green-100">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Prohibited */}
                <section id="prohibited" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-red-500/20 rounded-xl">
                      <XCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">5. Dilarang</h2>
                      <p className="text-faint text-sm mt-1">Aktivitas yang tidak diperbolehkan</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">Anda TIDAK diperbolehkan:</p>
                    <ul className="space-y-3">
                      {[
                        "Menggunakan platform untuk tujuan ilegal atau melanggar hukum",
                        "Mengirim konten yang menyinggung, melecehkan, atau merugikan",
                        "Mencoba mengakses akun orang lain tanpa izin",
                        "Menggunakan bot, scraper, atau sistem otomatis",
                        "Mengganggu atau membebani infrastruktur server",
                        "Menyebarkan malware atau konten berbahaya",
                        "Melakukan reverse engineering pada platform",
                        "Menjual atau menyewakan akses ke platform",
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 bg-red-500/10 border-l-4 border-red-500/50 p-4 rounded-r-lg">
                      <p className="text-red-200 text-sm">
                        <strong>Peringatan:</strong> Pelanggaran terhadap ketentuan ini dapat mengakibatkan penangguhan atau pengakhiran akun.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Intellectual Property */}
                <section id="intellectual" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-orange-500/20 rounded-xl">
                      <Shield className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">6. Kekayaan Intelektual</h2>
                      <p className="text-faint text-sm mt-1">Hak cipta dan kepemilikan</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <div className="space-y-4">
                      <div className="border-l-4 border-primary-500/50 pl-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-2">Kepemilikan Platform</h3>
                        <p className="text-sm text-muted">
                          Semua konten, fitur, desain, dan kode platform Kalivergo adalah milik Kalivergo dan dilindungi oleh hukum hak cipta serta kekayaan intelektual.
                        </p>
                      </div>
                      <div className="border-l-4 border-accent-500/50 pl-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-2">Konten Pengguna</h3>
                        <p className="text-sm text-muted">
                          Anda tetap memiliki hak atas konten yang Anda posting, namun memberikan lisensi kepada Kalivergo untuk menampilkan dan mendistribusikan konten tersebut dalam platform.
                        </p>
                      </div>
                      <div className="border-l-4 border-green-500/50 pl-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-2">Larangan</h3>
                        <p className="text-sm text-muted">
                          Dilarang menyalin, memodifikasi, mendistribusikan, atau membuat karya turunan dari platform tanpa izin tertulis.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Liability */}
                <section id="liability" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-yellow-500/20 rounded-xl">
                      <AlertTriangle className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">7. Batasan Tanggung Jawab</h2>
                      <p className="text-faint text-sm mt-1">Batas tanggung jawab kami</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500/50 p-4 rounded-r-lg mb-4">
                      <p className="text-yellow-200 font-medium">
                        Platform ini disediakan "sebagaimana adanya" (as-is) tanpa jaminan apapun.
                      </p>
                    </div>
                    <p className="mb-4">Kami tidak bertanggung jawab atas:</p>
                    <ul className="space-y-3">
                      {[
                        "Kehilangan data akibat force majeure atau bencana alam",
                        "Gangguan teknis yang tidak terhindarkan",
                        "Konten yang diposting oleh pengguna lain",
                        "Kerugian tidak langsung atau konsekuensial",
                        "Akses yang tidak sah oleh pihak ketiga",
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* Termination */}
                <section id="termination" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-red-500/20 rounded-xl">
                      <XCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">8. Pengakhiran</h2>
                      <p className="text-faint text-sm mt-1">Penghentian layanan</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <div className="space-y-4">
                      <div className="border-l-4 border-red-500/50 pl-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-2">Oleh Kalivergo</h3>
                        <p className="text-sm text-muted">
                          Kami dapat menangguhkan atau mengakhiri akun Anda jika melanggar syarat ini, dengan atau tanpa pemberitahuan terlebih dahulu.
                        </p>
                      </div>
                      <div className="border-l-4 border-primary-500/50 pl-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-2">Oleh Pengguna</h3>
                        <p className="text-sm text-muted">
                          Anda dapat menghentikan penggunaan layanan kapan saja dengan menghapus akun atau menghubungi kami.
                        </p>
                      </div>
                      <div className="border-l-4 border-accent-500/50 pl-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-2">Efek Pengakhiran</h3>
                        <p className="text-sm text-muted">
                          Setelah pengakhiran, hak Anda untuk menggunakan layanan akan segera berakhir. Ketentuan yang seharusnya tetap berlaku akan tetap berlaku.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Changes */}
                <section id="changes" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                      <FileText className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">9. Perubahan Syarat</h2>
                      <p className="text-faint text-sm mt-1">Update kebijakan</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">
                      Kami dapat mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan efektif setelah dipublikasikan di platform.
                    </p>
                    <div className="bg-indigo-500/10 border-l-4 border-indigo-500/50 p-4 rounded-r-lg">
                      <p className="text-indigo-200 text-sm">
                        <strong>Notifikasi:</strong> Perubahan material akan diberitahukan melalui email atau notifikasi di platform.
                      </p>
                    </div>
                    <p className="mt-4">
                      Dengan terus menggunakan layanan setelah perubahan, Anda menyetujui syarat yang telah diperbarui.
                    </p>
                  </div>
                </section>

                {/* Dispute */}
                <section id="dispute" className="mb-12 scroll-mt-20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-cyan-500/20 rounded-xl">
                      <Scale className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">10. Penyelesaian Sengketa</h2>
                      <p className="text-faint text-sm mt-1">Cara menyelesaikan masalah</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <div className="space-y-4">
                      <div className="border-l-4 border-cyan-500/50 pl-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-2">Hukum yang Berlaku</h3>
                        <p className="text-sm text-muted">
                          Syarat dan ketentuan ini tunduk pada dan ditafsirkan sesuai dengan hukum Republik Indonesia.
                        </p>
                      </div>
                      <div className="border-l-4 border-primary-500/50 pl-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-2">Musyawarah</h3>
                        <p className="text-sm text-muted">
                          Segala sengketa akan diselesaikan terlebih dahulu melalui musyawarah untuk mencapai mufakat.
                        </p>
                      </div>
                      <div className="border-l-4 border-accent-500/50 pl-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-2">Jalur Hukum</h3>
                        <p className="text-sm text-muted">
                          Jika musyawarah tidak mencapai kesepakatan, sengketa akan diselesaikan melalui jalur hukum yang berlaku di Indonesia.
                        </p>
                      </div>
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
                      <h2 className="text-2xl font-bold text-dark-900 dark:text-white">11. Kontak</h2>
                      <p className="text-faint text-sm mt-1">Hubungi kami</p>
                    </div>
                  </div>
                  <div className="text-muted leading-relaxed">
                    <p className="mb-4">
                      Untuk pertanyaan tentang syarat dan ketentuan ini, hubungi kami di:
                    </p>
                    <a
                      href="mailto:jundulloh2109@gmail.com"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 text-dark-900 dark:text-white rounded-lg hover:bg-accent-700 transition-colors font-medium"
                    >
                      <Mail className="h-4 w-4" />
                      jundulloh2109@gmail.com
                    </a>
                    <p className="text-sm text-faint mt-4">
                      Kami akan merespon pertanyaan Anda dalam waktu 30 hari.
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
            className="fixed bottom-6 right-6 p-3 bg-accent-600 text-dark-900 dark:text-white rounded-full shadow-lg hover:bg-accent-700 transition-all z-30"
            aria-label="Kembali ke atas"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}