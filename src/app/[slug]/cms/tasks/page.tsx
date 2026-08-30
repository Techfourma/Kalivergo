import DeleteTaskButton from '@/components/ui/DeleteTaskButton';
import EditTaskButton from '@/components/cms/EditTaskButton';
import TaskListWithSearch from '@/components/cms/TaskListWithSearch';
import TaskSubmissionManager from '@/components/ui/TaskSubmissionManager';
import ActionFeedback from '@/components/cms/ActionFeedback';
import { resolveTenantFromRoute } from '@/lib/tenant';
import { notFound } from 'next/navigation';
import { getTaskManagementData } from '@/features/task/services/task.service';

import PageBackground from '@/components/ui/PageBackground';

export const dynamic = 'force-dynamic';

type TenantCmsTasksPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TasksPage({ params }: TenantCmsTasksPageProps) {
  const routeParams = await params;
  const tenant = await resolveTenantFromRoute({
    slug: routeParams.slug,
  });

  if (!tenant) {
    notFound();
  }

  const tenantId = tenant.tenantId;
  const { tasks, allUsers } = await getTaskManagementData(tenantId);

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
              Manage Tasks
            </h1>
            <p className="text-sm md:text-base text-dark-500 dark:text-dark-400 mt-1">
              Kelola seluruh tugas dan assignment kelas
            </p>
          </div>
        </div>

        {/* Form: Buat Tugas Baru */}
        <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl p-4 md:p-6 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />

          <h2 className="text-lg font-semibold mb-4 text-dark-900 dark:text-white">Buat Tugas Baru</h2>
          <ActionFeedback actionType="task" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Nama Tugas
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white placeholder:text-dark-400 dark:placeholder:text-dark-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow"
                    placeholder="Contoh: Algoritma Pemograman II"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Kategori
                  </label>
                  <select
                    name="category"
                    defaultValue="E_LEARNING"
                    className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                  >
                    <option value="E_LEARNING">E-Learning</option>
                    <option value="TATAP_MUKA">Tatap Muka</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Start Date Time
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    required
                    className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    required
                    className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow"
                  />
                </div>
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
                placeholder="Contoh: E-Learning - Pertemuan 1"
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
                placeholder="Contoh: https://mentari.unpam.ac.id/tugas/1"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all font-medium"
            >
              Simpan Tugas
            </button>
          </ActionFeedback>
        </div>

        {/* Daftar Tugas */}
        <TaskListWithSearch tasks={tasks} allUsers={allUsers} />
      </div>
    </>
  );
}