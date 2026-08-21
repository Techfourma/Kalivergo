import { prisma } from '@/lib/db';
import DeleteScheduleButton from '@/components/ui/DeleteScheduleButton';
import ActionFeedback from '@/components/cms/ActionFeedback';
import { resolveTenantFromRoute } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ university: string; program: string; class: string }>;
}) {
  const routeParams = await params;
  const tenantContext = await resolveTenantFromRoute(routeParams);
  const tenantId = tenantContext?.tenantId;

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 font-display">
            Manage Schedule
          </h1>
          <p className="text-dark-500 mt-1">Kelola jadwal kegiatan kelas</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6 text-center">
          <p className="text-red-600">Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].</p>
        </div>
      </div>
    );
  }

  const schedules = await prisma.schedule.findMany({
    where: { tenantId },
    orderBy: { date: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900 font-display">
          Manage Schedule
        </h1>
        <p className="text-dark-500 mt-1">Kelola jadwal kegiatan kelas</p>
      </div>

      {/* Form Tambah Jadwal */}
      <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Tambah Jadwal</h2>
        <ActionFeedback actionType="schedule" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Judul Kegiatan
            </label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Contoh: Rapat Koordinasi"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Tanggal
              </label>
              <input
                type="date"
                name="date"
                required
                className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Waktu
              </label>
              <input
                type="time"
                name="time"
                required
                className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Tipe
              </label>
              <select
                name="type"
                className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="LECTURE">Perkuliahan</option>
                <option value="MEETING">Rapat</option>
                <option value="EVENT">Kegiatan</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Lokasi
            </label>
            <input
              type="text"
              name="location"
              required
              className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Contoh: Ruang Kelas A"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Tambah Jadwal
          </button>
        </ActionFeedback>
      </div>

      {/* List Jadwal */}
      <div className="bg-white rounded-xl shadow-sm border border-dark-100">
        <div className="p-6 border-b border-dark-100">
          <h2 className="text-lg font-semibold">Daftar Jadwal ({schedules.length})</h2>
        </div>
        <div className="divide-y divide-dark-100">
          {schedules.length === 0 ? (
            <div className="p-6 text-center text-dark-500">
              Belum ada jadwal. Tambahkan jadwal pertama Anda!
            </div>
          ) : (
            schedules.map((schedule) => (
              <div key={schedule.id} className="p-6 flex items-center justify-between hover:bg-dark-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dark-900">{schedule.title}</h3>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      {schedule.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-dark-500">
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
                  {/* ✅ Menggunakan Client Component untuk menangani confirm() dengan aman */}
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
  );
}