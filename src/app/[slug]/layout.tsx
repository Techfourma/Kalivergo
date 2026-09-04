import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SlugLayoutProps = {
  params: Promise<{
    slug: string;
  }>;
  children: React.ReactNode;
};

export default async function SlugLayout({
  params,
  children,
}: SlugLayoutProps) {
  const routeParams = await params;

  const tenant = await prisma.tenant.findFirst({
    where: {
      customSlug: routeParams.slug,
      status: "ACTIVE",
    },
    select: {
      id: true,
      slug: true,
      name: true,
      university: { select: { slug: true, name: true } },
      program: { select: { slug: true, name: true } },
    },
  });

  if (!tenant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950" suppressHydrationWarning>
      <main>{children}</main>
    </div>
  );
}
