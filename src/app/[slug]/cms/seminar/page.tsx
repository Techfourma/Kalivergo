import DeleteSeminarButton from '@/features/seminar/components/DeleteSeminarButton';
import SeminarSubmissionManager from '@/features/seminar/components/SeminarSubmissionManager';
import ActionFeedback from '@/components/cms/ActionFeedback';
import { resolveTenantFromRoute } from '@/lib/tenant';
import { getSeminarManagementData } from '@/features/seminar/services/list-seminars.service';

import PageBackground from '@/components/ui/PageBackground';

export const dynamic = 'force-dynamic';

export default async function SeminarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const routeParams = await params;
  const tenantContext = await resolveTenantFromRoute(routeParams);
  const tenantId = tenantContext?.tenantId;

  if (!tenantId) {
    return (
      <>
        <PageBackground />
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white font-display">
              Manage Seminar
            </h1>
            <p className="text-dark-500 dark:text-dark-400 mt-1">Kelola seminar dan kegiatan kelas</p>
          </div>
          <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl p-6 text-center shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
            <p className="text-red-600 dark:text-red-400">Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].</p>
          </div>
        </div>
      </>
    );
  }

  const { seminars, allUsers } = await getSeminarManagementData(tenantId);

  return (
    <>
      <PageBackground />
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-dark-400 dark:text-dark-500 mb-1">
              CMS
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-dark-900 dark:text-white font-display">
              Manage Seminar
            </h1>
            <p className="text-sm md:text-base text-dark-500 dark:text-dark-400 mt-1">
              Kelola seminar dan kegiatan kelas
            </p>
          </div>
        </div>

        {/* Form: Tambah Seminar */}
        <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl p-4 md:p-6 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />

          <h2 className="text-lg font-semibold mb-4 text-dark-900 dark:text-white">Tambah Seminar</h2>
          <ActionFeedback actionType="seminar" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Judul Seminar
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white placeholder:text-dark-400 dark:placeholder:text-dark-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow"
                placeholder="Contoh: Seminar AI & Machine Learning"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Tanggal
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Lokasi
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white placeholder:text-dark-400 dark:placeholder:text-dark-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow"
                  placeholder="Contoh: Ruang Aula A"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Deskripsi
              </label>
              <textarea
                name="description"
                rows={3}
                required
                className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white placeholder:text-dark-400 dark:placeholder:text-dark-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow"
                placeholder="Deskripsi seminar..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                URL
              </label>
              <input
                type="url"
                name="url"
                className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white placeholder:text-dark-400 dark:placeholder:text-dark-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow"
                placeholder="Contoh: https://event.unpam.ac.id"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all font-medium"
            >
              + Tambah Seminar
            </button>
          </ActionFeedback>
        </div>

        {/* Daftar Seminar */}
        <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl overflow-hidden shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />

          <div className="p-4 md:p-6 border-b border-dark-100 dark:border-dark-800">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Daftar Seminar ({seminars.length})</h2>
          </div>
          <div className="divide-y divide-dark-100 dark:divide-dark-800">
            {seminars.length === 0 ? (
              <div className="p-6 text-center text-dark-500 dark:text-dark-400">
                Belum ada seminar. Tambahkan seminar pertama Anda!
              </div>
            ) : (
              seminars.map((seminar) => {
                const submittedUserIds = seminar.submissions.map((s) => s.userId);
                return (
                  <div key={seminar.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 hover:bg-dark-50 dark:hover:bg-dark-800/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-dark-900 dark:text-white break-words line-clamp-2">
                        {seminar.title}
                      </h3>
                      <p className="text-sm text-dark-600 dark:text-dark-300 mt-1 break-words">
                        {seminar.description}
                      </p>
                      <div className="text-xs md:text-sm text-dark-500 dark:text-dark-400 mt-2 space-y-1">
                        <p className="text-primary-600 dark:text-primary-400">
                          📅{' '}
                          {new Date(seminar.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p>
                          📍 {seminar.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-0 border-dark-100 dark:border-dark-800">
                      <SeminarSubmissionManager
                        seminarId={seminar.id}
                        seminarTitle={seminar.title}
                        submittedUserIds={submittedUserIds}
                        allUsers={allUsers}
                        submissionCount={seminar.submissions.length}
                      />
                      <DeleteSeminarButton
                        id={seminar.id}
                        title={seminar.title}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}