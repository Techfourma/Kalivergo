import { prisma } from '@/lib/db';
import ActionFeedback from '@/components/cms/ActionFeedback';
import { resolveTenantFromRoute } from '@/lib/tenant';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type TenantCmsPeoplePageProps = {
  params: Promise<{
    university: string;
    program: string;
    class: string;
  }>;
};

export default async function PeoplePage({ params }: TenantCmsPeoplePageProps) {
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

  const tenantMemberships = await prisma.tenantMembership.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          nim: true,
          email: true,
          isVerified: true,
          createdAt: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const users = tenantMemberships.map(membership => ({
    ...membership.user,
    tenantRole: membership.role,
    cmsRole: membership.cmsRole,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900 font-display">People Management</h1>
        <p className="text-dark-500 mt-1">Tambah atau kelola anggota kelas</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6">
        <h2 className="text-lg font-semibold text-dark-900 mb-4">Tambah Anggota Baru</h2>

        <ActionFeedback actionType="people" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Masukkan nama lengkap"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              NIM
            </label>
            <input
              type="text"
              name="nim"
              required
              className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Masukkan NIM"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              Jabatan
            </label>
            <select
              name="role"
              required
              className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="MEMBER">Anggota</option>
              <option value="PRESIDENT">Ketua Kelas</option>
              <option value="VICE_PRESIDENT">Wakil Ketua</option>
              <option value="TREASURER">Bendahara</option>
              <option value="VICE_TREASURER">Wakil Bendahara</option>
              <option value="SECRETARY">Sekretaris</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Tambah Anggota
            </button>
          </div>
        </ActionFeedback>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-100">
            <thead className="bg-dark-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  NIM
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Jabatan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-dark-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-dark-500">
                    Belum ada data anggota
                  </td>
                </tr>
              ) : (
                users.map((user: any) => {
                  const roleLabels: Record<string, string> = {
                    PRESIDENT: 'Ketua Kelas',
                    VICE_PRESIDENT: 'Wakil Ketua',
                    TREASURER: 'Bendahara',
                    VICE_TREASURER: 'Wakil Bendahara',
                    SECRETARY: 'Sekretaris',
                    MEMBER: 'Anggota',
                    OWNER: 'Owner Kelas',
                  };
                  
                  const displayRole = (user.tenantRole === 'MEMBER' && user.cmsRole)
                    ? user.cmsRole
                    : (user.tenantRole || user.role || 'MEMBER');
                  return (
                    <tr key={user.id} className="hover:bg-dark-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-dark-900">
                          {user.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-dark-500">{user.nim || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-dark-500">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                          {roleLabels[displayRole] || displayRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.isVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                            Menunggu
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}