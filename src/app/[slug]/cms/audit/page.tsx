import { getAuditLogs } from '@/actions/cms';
import AuditLogTable from '@/components/cms/AuditLogTable';
import { resolveTenantFromRoute } from '@/lib/tenant';

import PageBackground from '@/components/ui/PageBackground';

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

  const logs = await getAuditLogs(
    module === 'ALL' ? undefined : module,
    startDate,
    endDate,
    tenantId
  );

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
    <>
      <PageBackground />

      <div className="relative z-10 space-y-6">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-dark-400 dark:text-dark-500 mb-1">
            CMS
          </p>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white font-display">
            Audit Log
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Pantau semua perubahan dan aktivitas dalam sistem
          </p>
        </div>

        <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl p-6 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />

          <h2 className="text-lg font-semibold mb-4 text-dark-900 dark:text-white">Filter Audit Log</h2>
          <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Module
              </label>
              <select
                name="module"
                defaultValue={module}
                className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
              >
                {modules.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                name="startDate"
                defaultValue={formatDateInput(startDate)}
                className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                name="endDate"
                defaultValue={formatDateInput(endDate)}
                className="w-full px-4 py-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Filter
              </button>
            </div>
          </form>
        </div>

        <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl overflow-hidden shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />
          <AuditLogTable logs={logs} />
        </div>
      </div>
    </>
  );
}