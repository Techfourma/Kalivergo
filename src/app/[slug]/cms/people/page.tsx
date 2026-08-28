import { prisma } from '@/lib/db';
import { resolveTenantFromRoute } from '@/lib/tenant';
import { notFound } from 'next/navigation';
import { acceptUser, rejectUser, updateUserRole } from '@/actions/cms/people';
import MemberReviewCard from '@/components/cms/MemberReviewCard';
import DeleteUserButton from '@/components/cms/DeleteUserButton';
import { env } from '@/config/env';

import PageBackground from '@/components/ui/PageBackground';

export const dynamic = 'force-dynamic';

type TenantCmsPeoplePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PeoplePage({ params }: TenantCmsPeoplePageProps) {
  const routeParams = await params;
  const tenant = await resolveTenantFromRoute({
    slug: routeParams.slug,
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

  const memberApplications = await prisma.memberApplication.findMany({
    where: { tenantId, status: 'PENDING_APPROVAL' },
    orderBy: { createdAt: 'desc' },
  });

  const cloudName = env.cloudinaryCloudName;

  const reviews = memberApplications.map((application) => ({
    id: application.id,
    userId: application.userId,
    fullName: application.fullName,
    nim: application.nim,
    email: application.email,
    profilePhotoUrl: cloudName
      ? `https://res.cloudinary.com/${cloudName}/image/upload/${application.profilePhotoStorageKey}`
      : null,
    ktmPhotoUrl: cloudName
      ? `https://res.cloudinary.com/${cloudName}/image/upload/${application.ktmPhotoStorageKey}`
      : null,
    createdAt: application.createdAt.toISOString(),
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
    <>
      <PageBackground />

      <div className="relative z-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50 font-display">People Management</h1>
          <p className="text-dark-500 dark:text-dark-300 mt-1">Kelola anggota kelas - Approve/Reject dan ubah jabatan</p>
        </div>

        <div className="relative rounded-xl border-2 border-dark-100 dark:border-dark-700/60 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent" />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-100 dark:divide-dark-700/60">
              <thead className="bg-dark-50 dark:bg-dark-800/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">
                    NIM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">
                    Jabatan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-700/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-dark-500 dark:text-dark-400">
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
                      <tr key={user.id} className="hover:bg-dark-50 dark:hover:bg-dark-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-dark-900 dark:text-dark-50">
                            {user.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-dark-500 dark:text-dark-300">{user.nim || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-dark-500 dark:text-dark-300">{user.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          {!isOwner ? (
                            <form action={updateUserRole} className="flex items-center gap-2">
                              <input type="hidden" name="userId" value={user.id} />
                              <input type="hidden" name="tenantId" value={tenantId} />
                              <select
                                name="role"
                                defaultValue={user.cmsRole || 'MEMBER'}
                                disabled={isPending}
                                className="px-3 py-1.5 text-sm bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-50 border border-dark-200 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark]"
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
                                className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                              >
                                Ubah
                              </button>
                            </form>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              {roleLabels[displayRole] || displayRole}
                            </span>
                          )}
                        </td>
                         <td className="px-6 py-4">
                           {isPending ? (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                               Menunggu Approval
                             </span>
                           ) : (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                               Aktif
                             </span>
                           )}
                           {!isPending && !isOwner && (
                             <div className="mt-2">
                               <DeleteUserButton
                                 userId={user.id}
                                 userName={user.name}
                                 tenantId={tenantId}
                               />
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

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-dark-900 dark:text-dark-50 font-display">Review Pendaftaran Anggota</h2>
            <p className="text-dark-500 dark:text-dark-300 mt-1">Periksa data dan dokumen member-signup sebelum menyetujui pendaftaran.</p>
          </div>
          {reviews.length === 0 ? (
            <div className="relative rounded-xl border-2 border-dark-100 dark:border-dark-700/60 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl px-6 py-8 text-center text-dark-500 dark:text-dark-400 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
              Tidak ada pendaftaran anggota yang menunggu review
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {reviews.map((review) => (
                <MemberReviewCard key={review.id} review={review} tenantId={tenantId} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}