"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import {
  Building2,
  CheckCircle2,
  GraduationCap,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
  X,
  XCircle,
  Phone,
  Eye,
  ChevronLeft,
  ZoomIn,
} from "lucide-react";
import {
  getKycApplications,
  approveKycApplication,
  rejectKycApplication,
  type KycApplication,
} from "@/actions/platform-kyc";
import Loading from "@/components/layout/Loading";

interface KycReviewDashboardProps {
  initialApplications: KycApplication[];
  initialError: string | null;
}

type ImageViewer = {
  src: string;
  title: string;
  subtitle: string;
};

export default function KycReviewDashboard({
  initialApplications,
  initialError,
}: KycReviewDashboardProps) {
  const [applications, setApplications] = useState<KycApplication[]>(initialApplications);
  const [error, setError] = useState<string | null>(initialError);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<KycApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedApp, setSelectedApp] = useState<KycApplication | null>(null);
  const [imageViewer, setImageViewer] = useState<ImageViewer | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (imageViewer) {
        setImageViewer(null);
        return;
      }

      if (rejectTarget) {
        setRejectTarget(null);
        return;
      }

      if (selectedApp) {
        setSelectedApp(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [imageViewer, rejectTarget, selectedApp]);

  const refresh = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await getKycApplications();
      if (result.success) {
        setApplications(result.applications);
      } else {
        setError(result.error ?? "Gagal memuat data.");
      }
    });
  };

  const handleApprove = (id: string, name: string) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await approveKycApplication(id);
      if (result.success) {
        setSuccess(`Aplikasi "${name}" disetujui. Tenant kelas telah dibuat.`);
        setApplications((prev) => prev.filter((app) => app.id !== id));
      } else {
        setError(result.error ?? "Gagal menyetujui aplikasi.");
      }
    });
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await rejectKycApplication(rejectTarget.id, reason);
      if (result.success) {
        setSuccess(`Aplikasi "${rejectTarget.fullName}" ditolak.`);
        setApplications((prev) => prev.filter((app) => app.id !== rejectTarget.id));
        setRejectTarget(null);
        setRejectReason("");
      } else {
        setError(result.error ?? "Gagal menolak aplikasi.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Loading isVisible={isPending} message="Memproses permintaan" subMessage="Mohon tunggu..." />

      <div className="flex items-center justify-between">
        <p className="text-sm text-dark-500 dark:text-dark-400">
          {applications.length} aplikasi menunggu keputusan.
        </p>
        <button
          onClick={refresh}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-700 hover:bg-dark-50 disabled:opacity-50 transition-colors dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200 dark:hover:bg-dark-700"
        >
          <RefreshCw className="h-4 w-4" />
          Muat Ulang
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
          {success}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-dark-300 bg-white p-12 text-center dark:border-dark-700 dark:bg-dark-800">
          <ShieldCheck className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <h3 className="font-semibold text-dark-900 dark:text-dark-100">Tidak ada aplikasi menunggu</h3>
          <p className="text-sm text-dark-500 mt-1 dark:text-dark-400">
            Semua aplikasi owner sudah diproses. Periksa kembali nanti.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {applications.map((app) => (
            <div
              key={app.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedApp(app)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedApp(app);
                }
              }}
              className="rounded-2xl border border-dark-200 bg-white p-6 shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-dark-700 dark:bg-dark-800"
            >
              <div className="flex items-start gap-4">
                {app.selfieUrl ? (
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-dark-200 dark:border-dark-700">
                    <Image
                      src={app.selfieUrl}
                      alt="Selfie pelamar"
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-dark-100 text-dark-500 dark:bg-dark-700 dark:text-dark-300">
                    <User className="h-8 w-8" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-dark-900 truncate dark:text-dark-100">{app.fullName}</h3>
                  <p className="text-sm text-dark-500 flex items-center gap-1.5 dark:text-dark-400">
                    <Mail className="h-3.5 w-3.5" /> {app.email}
                  </p>
                  <p className="text-xs text-primary-600 mt-1 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Klik kartu untuk lihat detail registrasi
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-dark-700 dark:text-dark-300">
                  <Building2 className="h-4 w-4 text-primary-600" />
                  <span>
                    <strong>{app.universityName}</strong> — {app.programName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-dark-700 dark:text-dark-300">
                  <GraduationCap className="h-4 w-4 text-accent-600" />
                  <span>Kelas: <strong>{app.className}</strong></span>
                </div>
                {app.submittedAt && (
                  <p className="text-xs text-dark-400 dark:text-dark-500">
                    Diajukan: {new Date(app.submittedAt).toLocaleString("id-ID")}
                  </p>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(app.id, app.fullName);
                  }}
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Setujui
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRejectTarget(app);
                    setRejectReason("");
                  }}
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-900">
            <div className="flex items-center justify-between border-b border-dark-200 px-4 py-3 sm:px-6 dark:border-dark-700">
              <div>
                <h3 className="text-lg font-bold text-dark-900 dark:text-dark-100">Detail Registrasi Owner</h3>
                <p className="text-sm text-dark-500 dark:text-dark-400">Data sinkron dari form pendaftaran owner</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="rounded-lg p-2 text-dark-500 hover:bg-dark-100 hover:text-dark-900 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-dark-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="grid gap-5 md:grid-cols-[280px_1fr]">
                <div className="space-y-4">
                {selectedApp.selfieUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      setImageViewer({
                        src: selectedApp.selfieUrl!,
                        title: "Foto Selfie",
                        subtitle: selectedApp.fullName,
                      })
                    }
                    className="group w-full overflow-hidden rounded-2xl border border-dark-200 bg-dark-50 text-left shadow-sm transition hover:border-primary-300 hover:shadow-md dark:border-dark-700 dark:bg-dark-800"
                  >
                    <div className="flex items-center justify-between border-b border-dark-100 px-4 py-3 dark:border-dark-700">
                      <div>
                        <p className="text-sm font-semibold text-dark-900 dark:text-dark-100">Foto Selfie</p>
                        <p className="text-xs text-dark-500 dark:text-dark-400">{selectedApp.fullName}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600">
                        <ZoomIn className="h-3.5 w-3.5" />
                        Klik untuk fullscreen
                      </span>
                    </div>
                    <div className="relative aspect-[4/5] w-full bg-white dark:bg-dark-900">
                      <Image
                        src={selectedApp.selfieUrl}
                        alt="Selfie registrasi"
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                    </div>
                  </button>
                ) : (
                  <div className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-dark-200 bg-dark-50 text-dark-400 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-400">
                    <div className="text-center">
                      <User className="mx-auto h-12 w-12" />
                      <p className="mt-2 text-sm">Foto selfie tidak tersedia</p>
                    </div>
                  </div>
                )}

                {selectedApp.ktmUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setImageViewer({
                        src: selectedApp.ktmUrl!,
                        title: "Foto KTM",
                        subtitle: selectedApp.fullName,
                      })
                    }
                    className="group w-full overflow-hidden rounded-2xl border border-dark-200 bg-dark-50 text-left shadow-sm transition hover:border-primary-300 hover:shadow-md dark:border-dark-700 dark:bg-dark-800"
                  >
                    <div className="flex items-center justify-between border-b border-dark-100 px-4 py-3 dark:border-dark-700">
                      <div>
                        <p className="text-sm font-semibold text-dark-900 dark:text-dark-100">Foto KTM</p>
                        <p className="text-xs text-dark-500 dark:text-dark-400">{selectedApp.fullName}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600">
                        <ZoomIn className="h-3.5 w-3.5" />
                        Klik untuk fullscreen
                      </span>
                    </div>
                    <div className="relative aspect-[4/5] w-full bg-white dark:bg-dark-900">
                      <Image
                        src={selectedApp.ktmUrl}
                        alt="KTM registrasi"
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                    </div>
                  </button>
                )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-dark-400">Nama Lengkap</p>
                    <p className="mt-1 font-semibold text-dark-900 dark:text-dark-100">{selectedApp.fullName}</p>
                  </div>
                  <div className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-dark-400">Email</p>
                    <p className="mt-1 font-semibold text-dark-900 break-all dark:text-dark-100">{selectedApp.email}</p>
                  </div>
                  <div className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-dark-400">Nomor Telepon</p>
                    <p className="mt-1 font-semibold text-dark-900 flex items-center gap-2 dark:text-dark-100">
                      <Phone className="h-4 w-4 text-primary-600" />
                      {selectedApp.phone ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-dark-400">Universitas</p>
                    <p className="mt-1 font-semibold text-dark-900 dark:text-dark-100">{selectedApp.universityName}</p>
                  </div>
                  <div className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-dark-400">Program Studi</p>
                    <p className="mt-1 font-semibold text-dark-900 dark:text-dark-100">{selectedApp.programName}</p>
                  </div>
                  <div className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-dark-400">Nama Kelas</p>
                    <p className="mt-1 font-semibold text-dark-900 dark:text-dark-100">{selectedApp.className}</p>
                  </div>
                  {selectedApp.submittedAt && (
                    <div className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800">
                      <p className="text-xs font-semibold uppercase tracking-wide text-dark-400">Waktu Pengajuan</p>
                      <p className="mt-1 font-semibold text-dark-900 dark:text-dark-100">
                        {new Date(selectedApp.submittedAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-dark-200 px-4 py-3 sm:px-6 dark:border-dark-700">
              <button
                onClick={() => setSelectedApp(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-dark-200 px-4 py-2.5 text-sm font-medium text-dark-700 hover:bg-dark-50 transition-colors dark:border-dark-700 dark:text-dark-200 dark:hover:bg-dark-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <p className="text-xs text-dark-400">
                Tekan <span className="font-semibold">Esc</span> untuk menutup detail
              </p>
            </div>
          </div>
        </div>
      )}

      {imageViewer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-900">
            <div className="flex items-center justify-between border-b border-dark-200 px-4 py-3 sm:px-6 dark:border-dark-700">
              <div>
                <h3 className="text-base font-bold text-dark-900 sm:text-lg dark:text-dark-100">{imageViewer.title}</h3>
                <p className="text-xs text-dark-500 sm:text-sm dark:text-dark-400">{imageViewer.subtitle}</p>
              </div>
              <button
                onClick={() => setImageViewer(null)}
                className="rounded-lg p-2 text-dark-500 hover:bg-dark-100 hover:text-dark-900 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-dark-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex-1 bg-black">
              <Image
                src={imageViewer.src}
                alt={imageViewer.title}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-dark-200 px-4 py-3 sm:px-6 dark:border-dark-700">
              <p className="text-xs text-dark-500 dark:text-dark-400">
                Gunakan zoom browser untuk memperbesar, atau tekan <span className="font-semibold">Esc</span> untuk kembali.
              </p>
              <button
                onClick={() => setImageViewer(null)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-900">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-bold text-dark-900 dark:text-dark-100">
                Tolak {rejectTarget.fullName}
              </h3>
            </div>

            <label className="block text-sm font-medium text-dark-700 mb-1 dark:text-dark-300">
              Alasan Penolakan <span className="text-red-600">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              minLength={10}
              placeholder="Jelaskan alasan penolakan (min. 10 karakter)"
              className="w-full rounded-lg border border-dark-300 p-3 text-sm text-dark-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100"
            />
            {rejectReason.trim().length > 0 && rejectReason.trim().length < 10 && (
              <p className="mt-1 text-xs text-red-600">
                Alasan minimal 10 karakter.
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 rounded-xl border border-dark-200 px-4 py-2.5 text-sm font-medium text-dark-700 hover:bg-dark-50 transition-colors dark:border-dark-700 dark:text-dark-200 dark:hover:bg-dark-800"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={isPending || rejectReason.trim().length < 10}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}