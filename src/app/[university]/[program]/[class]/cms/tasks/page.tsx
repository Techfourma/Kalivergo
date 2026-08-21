import DeleteTaskButton from '@/components/ui/DeleteTaskButton';
import TaskSubmissionManager from '@/components/ui/TaskSubmissionManager';
import ActionFeedback from '@/components/cms/ActionFeedback';
import { resolveTenantFromRoute } from '@/lib/tenant';
import { notFound } from 'next/navigation';
import { getTaskManagementData } from '@/features/task/services/task.service';

export const dynamic = 'force-dynamic';

type TenantCmsTasksPageProps = {
  params: Promise<{
    university: string;
    program: string;
    class: string;
  }>;
};

export default async function TasksPage({ params }: TenantCmsTasksPageProps) {
  const routeParams = await params;
  const tenant = await resolveTenantFromRoute({
    university: routeParams.university,
    program: routeParams.program,
    class: routeParams.class,
  });

  if (!tenant) {
    notFound();
  }

  const tenantId = tenant.tenantId;

  const { tasks, allUsers } = await getTaskManagementData(tenantId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-dark-900 font-display">
            Manage Tasks
          </h1>
          <p className="text-sm md:text-base text-dark-500 mt-1">
            Kelola seluruh tugas dan assignment kelas
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Buat Tugas Baru</h2>
        <ActionFeedback actionType="task" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Nama Tugas
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-2.5 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                placeholder="Contoh: Algoritma Pemograman II"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Deadline
              </label>
              <input
                type="datetime-local"
                name="deadline"
                required
                className="w-full px-4 py-2.5 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
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
              className="w-full px-4 py-2.5 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
              placeholder="Contoh: E-Learning - Pertemuan 1"
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Simpan Tugas
          </button>
        </ActionFeedback>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-dark-100">
          <h2 className="text-lg font-semibold">
            Daftar Tugas ({tasks.length})
          </h2>
        </div>
        <div className="divide-y divide-dark-100">
          {tasks.length === 0 ? (
            <div className="p-6 text-center text-dark-500">
              Belum ada tugas. Tambahkan tugas pertama Anda!
            </div>
          ) : (
            tasks.map((task) => {
              const submittedUserIds = task.submissions.map((s) => s.userId);
              return (
                <div
                  key={task.id}
                  className="p-4 md:p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 hover:bg-dark-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dark-900 break-words line-clamp-2">
                      {task.title}
                    </h3>
                    <p className="text-sm text-dark-600 mt-1 break-words">
                      {task.description}
                    </p>
                    <p className="text-xs md:text-sm text-primary-600 mt-2">
                      Deadline:{' '}
                      {new Date(task.deadline).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-row items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-0 border-dark-100">
                    <TaskSubmissionManager
                      taskId={task.id}
                      taskTitle={task.title}
                      submittedUserIds={submittedUserIds}
                      allUsers={allUsers}
                      submissionCount={task.submissions.length}
                    />
                    <DeleteTaskButton id={task.id} title={task.title} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );}