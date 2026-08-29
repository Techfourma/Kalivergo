import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import {
  Shield,
  ClipboardList,
  Wallet,
  GraduationCap,
  Users,
  FileText,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { resolveTenantFromRoute } from '@/lib/tenant';
import { notFound } from 'next/navigation';
import { getCurrentSessionUser } from '@/server/auth/session';
import type { CmsRole } from '@prisma/client';

import PageBackground from '@/components/ui/PageBackground';

export const dynamic = 'force-dynamic';

type TenantCmsOverviewPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CMSOverviewPage({
  params,
}: TenantCmsOverviewPageProps) {
  const routeParams = await params;
  const tenant = await resolveTenantFromRoute({
    slug: routeParams.slug,
  });

  if (!tenant) {
    notFound();
  }

  const tenantId = tenant.tenantId;
  const tenantPath = `/${routeParams.slug}`;

  const session = await getCurrentSessionUser();
  let hasFinanceAccess = false;
  let hasTasksAccess = false;
  if (session?.id) {
    const membership = await prisma.tenantMembership.findFirst({
      where: { userId: session.id, tenantId },
      select: { role: true, cmsRole: true },
    });

    if (membership) {
      if (membership.role === "OWNER") {
        hasFinanceAccess = true;
        hasTasksAccess = true;
      } else if (membership.cmsRole) {
        const financePermission = await prisma.cmsAccessPermission.findFirst({
          where: {
            tenantId,
            cmsRole: membership.cmsRole as CmsRole,
            module: "finance",
          },
        });
        hasFinanceAccess = !!financePermission;

        const tasksPermission = await prisma.cmsAccessPermission.findFirst({
          where: {
            tenantId,
            cmsRole: membership.cmsRole as CmsRole,
            module: "tasks",
          },
        });
        hasTasksAccess = !!tasksPermission;
      }
    }
  }

  const taskWhere = { tenantId };
  const transactionWhere = { tenantId };
  const seminarWhere = { tenantId };
  const memberWhere = { tenantMemberships: { some: { tenantId } } };

  const [tasksCount, transactions, seminarsCount, membersCount] = await Promise.all([
    prisma.task.count({ where: taskWhere }),
    prisma.transaction.findMany({ where: transactionWhere }),
    prisma.seminar.count({ where: seminarWhere }),
    prisma.user.count({ where: memberWhere }),
  ]);

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  return (
    <>
      <PageBackground />

      <div className="relative z-10 space-y-6">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              CMS Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Content Management System.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-dark-900 dark:border-dark-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Tugas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasksCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-dark-900 dark:border-dark-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Saldo Kas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(balance)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-dark-900 dark:border-dark-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Seminar Aktif</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{seminarsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-dark-900 dark:border-dark-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Anggota</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{membersCount}</p>
              </div>
            </div>
          </div>
        </div>

        {hasTasksAccess && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-dark-900 dark:border-dark-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Input Tugas
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tambah tugas baru untuk kelas
                </p>
              </div>
            </div>
            <Link
              href={`${tenantPath}/cms/tasks`}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <span>+</span>
              <span>Tambah Tugas</span>
            </Link>
          </div>
        </div>
        )}

        {hasFinanceAccess && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-dark-900 dark:border-dark-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Input Transaksi
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tambah pemasukan atau pengeluaran
                </p>
              </div>
            </div>
            <Link
              href={`${tenantPath}/cms/finance`}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
            >
              <span>+</span>
              <span>Tambah</span>
            </Link>
          </div>
        </div>
        )}
      </div>
    </>
  );
}