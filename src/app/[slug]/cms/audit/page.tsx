import { getAuditLogs } from '@/actions/cms';
import AuditLogTable from '@/components/cms/AuditLogTable';
import { resolveTenantFromRoute } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ module?: string; startDate?: string; endDate?: string }>;
}) {
  const routeParams = await params;
  const filters = await searchParams;
  const module = filters.module || 'ALL';
  const today = new Date();
  const defaultStartDate = new Date(today);
  defaultStartDate.setDate(today.getDate() - 3);
  defaultStartDate.setHours(0, 0, 0, 0);
  const startDate = filters.startDate
    ? new Date(filters.startDate)
    : defaultStartDate;
  const endDate = filters.endDate ? new Date(filters.endDate) : today;

  const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const tenantContext = await resolveTenantFromRoute(routeParams);
  const tenantId = tenantContext?.tenantId;

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  const logs = await getAuditLogs(module === 'ALL' ? undefined : module, startDate, endDate, tenantId);

  const modules = [
    { value: 'ALL', label: 'Semua Module' },
    { value: 'FINANCE', label: 'Finance' },
    { value: 'TASKS', label: 'Tasks' },
    { value: 'PEOPLE', label: 'People Management' },
    { value: 'SCHEDULE', label: 'Schedule' },
    { value: 'SEMINAR', label: 'Seminar' },
    { value: 'ACCESS', label: 'Access Control' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900 font-display">
          Audit Log
        </h1>
        <p className="text-dark-500 mt-1">
          Pantau semua perubahan dan aktivitas dalam sistem
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Filter Audit Log</h2>
        <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Module
            </label>
            <select
              name="module"
              defaultValue={module}
              className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {modules.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
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
              defaultValue={formatDateInput(startDate)}
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
              defaultValue={formatDateInput(endDate)}
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

      <AuditLogTable logs={logs} />
    </div>
  );
}