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

export const dynamic = 'force-dynamic';

type TenantCmsOverviewPageProps = {
  params: Promise<{
    university: string;
    program: string;
    class: string;
  }>;
};

export default async function CMSOverviewPage({
  params,
}: TenantCmsOverviewPageProps) {
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
  const tenantPath = `/${routeParams.university}/${routeParams.program}/${routeParams.class}`;

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
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
          <Shield className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            CMS Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Content Management System.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Tugas</p>
              <p className="text-2xl font-bold text-gray-900">{tasksCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Saldo Kas</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Seminar Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{seminarsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Anggota</p>
              <p className="text-2xl font-bold text-gray-900">{membersCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Input Tugas
              </h3>
              <p className="text-sm text-gray-500">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Input Transaksi
              </h3>
              <p className="text-sm text-gray-500">
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
    </div>
  );
}