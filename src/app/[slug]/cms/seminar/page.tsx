import DeleteSeminarButton from '@/features/seminar/components/DeleteSeminarButton';
import ActionFeedback from '@/components/cms/ActionFeedback';
import { resolveTenantFromRoute } from '@/lib/tenant';
import { listSeminars } from '@/features/seminar/services/list-seminars.service';

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 font-display">
            Manage Seminar
          </h1>
          <p className="text-dark-500 mt-1">Kelola seminar dan kegiatan kelas</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6 text-center">
          <p className="text-red-600">Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].</p>
        </div>
      </div>
    );
  }

  const seminars = await listSeminars(tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900 font-display">
          Manage Seminar
        </h1>
        <p className="text-dark-500 mt-1">Kelola seminar dan kegiatan kelas</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Tambah Seminar</h2>
        <ActionFeedback actionType="seminar" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Judul Seminar
            </label>
            <input
              type="text"
              name="title"
              required
              className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Contoh: Seminar AI & Machine Learning"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Lokasi
              </label>
              <input
                type="text"
                name="location"
                required
                className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Contoh: Ruang Aula A"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Deskripsi
            </label>
            <textarea
              name="description"
              rows={3}
              required
              className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Deskripsi seminar..."
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Tambah Seminar
          </button>
        </ActionFeedback>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-dark-100">
        <div className="p-6 border-b border-dark-100">
          <h2 className="text-lg font-semibold">Daftar Seminar ({seminars.length})</h2>
        </div>
        <div className="divide-y divide-dark-100">
          {seminars.length === 0 ? (
            <div className="p-6 text-center text-dark-500">
              Belum ada seminar. Tambahkan seminar pertama Anda!
            </div>
          ) : (
            seminars.map((seminar) => (
              <div key={seminar.id} className="p-6 flex items-center justify-between hover:bg-dark-50">
                <div className="flex-1">
                  <h3 className="font-semibold text-dark-900">{seminar.title}</h3>
                  <p className="text-sm text-dark-600 mt-1">{seminar.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-dark-500">
                    <span>📅 {new Date(seminar.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                    <span>📍 {seminar.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DeleteSeminarButton
                    id={seminar.id}
                    title={seminar.title}
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