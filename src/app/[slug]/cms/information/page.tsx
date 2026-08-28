import { prisma } from '@/lib/prisma';
import { getCurrentSessionUser } from '@/server/auth/session';
import { requireTenantMembership } from '@/lib/tenant';
import { CmsRole } from '@prisma/client';

export default async function InformationCMSPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const routeParams = await params;
  const session = await getCurrentSessionUser();

  if (!session?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please login to access CMS</p>
      </div>
    );
  }

  // Get tenant ID from slug
  const tenant = await prisma.tenant.findFirst({
    where: { customSlug: routeParams.slug },
    select: { id: true },
  });

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Tenant not found</p>
      </div>
    );
  }

  try {
    await requireTenantMembership(session.id, tenant.id);

    // Check if user has OWNER role or CMS access
    const membership = await prisma.tenantMembership.findFirst({
      where: { userId: session.id, tenantId: tenant.id },
    });

    if (!membership || (membership.role !== 'OWNER' && !membership.cmsRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Access denied: CMS access required</p>
        </div>
      );
    }
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Access denied</p>
      </div>
    );
  }

  // Fetch all information posts with details
  const informations = await prisma.information.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          comments: true,
          reactions: true,
          readMarks: true,
        },
      },
    },
  });

  // Dynamically import client component
  const InformationCMSList = (await import('@/components/cms/information/InformationCMSList')).default;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Information Management</h1>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {informations.map((info) => (
                  <tr key={info.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{info.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {info.content.substring(0, 100)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {info.user.image && (
                          <img
                            src={info.user.image}
                            alt={info.user.name}
                            className="h-8 w-8 rounded-full mr-2"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {info.user.name}
                          </div>
                          <div className="text-sm text-gray-500">{info.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        info.type === 'IMAGE' ? 'bg-green-100 text-green-800' :
                        info.type === 'VIDEO' ? 'bg-blue-100 text-blue-800' :
                        info.type === 'PDF' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {info.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(info.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>💬 {_count.comments}</div>
                      <div>❤️ {_count.reactions}</div>
                      <div>👁️ {_count.readMarks} read</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {}}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {informations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No information posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
