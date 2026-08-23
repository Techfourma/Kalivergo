import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { resolveTenantFromRoute } from "@/lib/tenant";
import CategoryManager from "@/components/cms/CategoryManager";
import { getCurrentSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type TenantCmsCategoriesPageProps = {
  params: Promise<{
    university: string;
    program: string;
    class: string;
  }>;
};

export default async function CategoriesPage({
  params,
}: TenantCmsCategoriesPageProps) {
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
  const session = await getCurrentSessionUser();

  if (!session?.id) {
    redirect("/unauthorized");
  }

  const membership = await prisma.tenantMembership.findFirst({
    where: { userId: session.id, tenantId, role: "OWNER" },
    select: { id: true },
  });

  if (!membership) {
    redirect("/unauthorized");
  }

  const incomeCategories = await prisma.category.findMany({
    where: { tenantId, type: "INCOME" },
    orderBy: { name: "asc" },
  });

  const expenseCategories = await prisma.category.findMany({
    where: { tenantId, type: "EXPENSE" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900 font-display">
          Kelola Kategori Kas
        </h1>
        <p className="text-dark-500 mt-1">
          Atur kategori pemasukan dan pengeluaran uang kas kelas Anda
        </p>
      </div>

      <CategoryManager
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
      />
    </div>
  );
}