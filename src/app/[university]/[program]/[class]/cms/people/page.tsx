import { prisma } from '@/lib/db';
import ActionFeedback from '@/components/cms/ActionFeedback';
import { resolveTenantFromRoute } from '@/lib/tenant';
import { notFound } from 'next/navigation';
import { acceptUser, rejectUser, updateUserRole } from '@/actions/cms/people';
import { CLASS_ROLES } from '@/actions/cms/role-model';

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
    membershipId: membership.id,
  }));

  const roleLabels: Record<string, string> = {
    PRESIDENT: 'Ketua Kelas',
    VICE_PRESIDENT: 'Wakil Ketua',
    TREASURER: 'Bendahara',
    VICE_TREASURER: 'Wakil Bendahara',
    SECRETARY: 'Sekretaris',
    MEMBER: 'Anggota',
    OWNER: 'Owner Kelas',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900 font-display">People Management</h1>
        <p className="text-dark-500 mt-1">Kelola anggota kelas - Approve/Reject dan ubah jabatan</p>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-dark-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-dark-500">
                    Belum ada data anggota
                  </td>
                </tr>
              ) : (
                users.map((user: any) => {
                  const displayRole = (user.tenantRole === 'MEMBER' && user.cmsRole)
                    ? user.cmsRole
                    : (user.tenantRole || user.role || 'MEMBER');

                  const isPending = !user.isVerified;
                  const isOwner = user.tenantRole === 'OWNER';

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
                        {!isOwner ? (
                          <form action={updateUserRole} className="flex items-center gap-2">
                            <input type="hidden" name="userId" value={user.id} />
                            <select
                              name="role"
                              defaultValue={user.cmsRole || 'MEMBER'}
                              disabled={isPending}
                              className="px-3 py-1.5 text-sm border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                              <option value="MEMBER">Anggota</option>
                              <option value="PRESIDENT">Ketua Kelas</option>
                              <option value="VICE_PRESIDENT">Wakil Ketua</option>
                              <option value="TREASURER">Bendahara</option>
                              <option value="VICE_TREASURER">Wakil Bendahara</option>
                              <option value="SECRETARY">Sekretaris</option>
                            </select>
                            <button
                              type="submit"
                              disabled={isPending}
                              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                            >
                              Ubah
                            </button>
                          </form>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                            {roleLabels[displayRole] || displayRole}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isPending ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                            Menunggu Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!isOwner && (
                          <div className="flex items-center gap-2">
                            {isPending ? (
                              <>
                                <form action={acceptUser}>
                                  <input type="hidden" name="userId" value={user.id} />
                                  <button
                                    type="submit"
                                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                  >
                                    Approve
                                  </button>
                                </form>
                                <form action={rejectUser}>
                                  <input type="hidden" name="userId" value={user.id} />
                                  <button
                                    type="submit"
                                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </form>
                              </>
                            ) : (
                              <span className="text-xs text-dark-400">-</span>
                            )}
                          </div>
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