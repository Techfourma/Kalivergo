import { prisma } from '@/lib/db';
import DeleteScheduleButton from '@/components/ui/DeleteScheduleButton';
import ActionFeedback from '@/components/cms/ActionFeedback';
import { resolveTenantFromRoute } from '@/lib/tenant';

import PageBackground from '@/components/ui/PageBackground';

export const dynamic = 'force-dynamic';

export default async function SchedulePage({
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
              Manage Schedule
            </h1>
            <p className="text-dark-500 dark:text-dark-400 mt-1">Kelola jadwal kegiatan kelas</p>
          </div>
          <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl p-6 text-center shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
            <p className="text-red-600 dark:text-red-400">Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].</p>
          </div>
        </div>
      </>
    );
  }

  const schedules = await prisma.schedule.findMany({
    where: { tenantId },
    orderBy: { date: 'asc' },
  });

  return (
    <>
      <PageBackground />
      <div className="relative z-10 space-y-6">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-dark-400 dark:text-dark-500 mb-1">
            CMS
          </p>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white font-display">
            Manage Schedule
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">Kelola jadwal kegiatan kelas</p>
        </div>

        {/* Tambah Jadwal */}
        <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl p-6 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />

          <h2 className="text-lg font-semibold mb-4 text-dark-900 dark:text-white">Tambah Jadwal</h2>
          <ActionFeedback actionType="schedule" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Judul Kegiatan
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white placeholder:text-dark-400 dark:placeholder:text-dark-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                placeholder="Contoh: Rapat Koordinasi"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Tanggal
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Waktu
                </label>
                <input
                  type="time"
                  name="time"
                  required
                  className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Tipe
                </label>
                <select
                  name="type"
                  className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                >
                  <option value="LECTURE">Perkuliahan</option>
                  <option value="MEETING">Rapat</option>
                  <option value="EVENT">Kegiatan</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Lokasi
              </label>
              <input
                type="text"
                name="location"
                required
                className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white placeholder:text-dark-400 dark:placeholder:text-dark-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                placeholder="Contoh: Ruang Kelas A"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              + Tambah Jadwal
            </button>
          </ActionFeedback>
        </div>

        {/* Daftar Jadwal */}
        <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl overflow-hidden shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />

          <div className="p-6 border-b border-dark-100 dark:border-dark-800">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Daftar Jadwal ({schedules.length})</h2>
          </div>
          <div className="divide-y divide-dark-100 dark:divide-dark-800">
            {schedules.length === 0 ? (
              <div className="p-6 text-center text-dark-500 dark:text-dark-400">
                Belum ada jadwal. Tambahkan jadwal pertama Anda!
              </div>
            ) : (
              schedules.map((schedule) => (
                <div key={schedule.id} className="p-6 flex items-center justify-between hover:bg-dark-50 dark:hover:bg-dark-800/40 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-dark-900 dark:text-white">{schedule.title}</h3>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {schedule.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-dark-500 dark:text-dark-400">
                      <span>📅 {new Date(schedule.date).toLocaleDateString('id-ID', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}</span>
                      <span>🕐 {new Date(schedule.date).toLocaleTimeString('id-ID', {
                        hour: '2-digit', minute: '2-digit'
                      })}</span>
                      <span>📍 {schedule.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DeleteScheduleButton
                      id={schedule.id}
                      title={schedule.title}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}