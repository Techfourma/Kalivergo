import { getKycAuditLogs } from '@/actions/platform-kyc';
import KycAuditLogTable from '@/components/platform/KycAuditLogTable';

export const dynamic = 'force-dynamic';

export default async function KycAuditPage({
  searchParams,
}: {
  searchParams: { action?: string; startDate?: string; endDate?: string };
}) {
  const action = searchParams.action || 'ALL';
  const startDate = searchParams.startDate ? new Date(searchParams.startDate) : undefined;
  const endDate = searchParams.endDate ? new Date(searchParams.endDate) : undefined;

 
  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  const logs = await getKycAuditLogs(
    action === 'ALL' ? undefined : action,
    startDate,
    endDate
  );

  const actions = [
    { value: 'ALL', label: 'Semua Aksi' },
    { value: 'APPROVE', label: 'Persetujuan' },
    { value: 'REJECT', label: 'Penolakan' },
    { value: 'SUBMIT', label: 'Pengajuan' },
    { value: 'CANCEL', label: 'Pembatalan' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900 font-display">
          Audit Log KYC
        </h1>
        <p className="text-dark-500 mt-1">
          Pantau semua aktivitas verifikasi dan review KYC owner kelas
        </p>
      </div>

      
      <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Filter Audit Log KYC</h2>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Aksi
            </label>
            <select
              name="action"
              defaultValue={action}
              className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {actions.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              name="startDate"
              defaultValue={searchParams.startDate}
              className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              name="endDate"
              defaultValue={searchParams.endDate}
              className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      
      <KycAuditLogTable logs={logs} />
    </div>
  );
}