import { prisma } from "@/lib/db";
import DeleteInformationButton from "@/components/ui/DeleteInformationButton";
import ActionFeedback from "@/components/cms/ActionFeedback";
import { resolveTenantFromRoute } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { getCmsInformation } from "@/actions/cms/information";
import { getCurrentSessionUser } from "@/server/auth/session";

import PageBackground from "@/components/ui/PageBackground";
import Avatar from "@/components/ui/Avatar";

export const dynamic = "force-dynamic";

type TenantCmsInformationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatJakartaTime(date: Date): string {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Jakarta",
  });
}

export default async function InformationCMSPage({
  params,
}: TenantCmsInformationPageProps) {
  const routeParams = await params;
  const tenantContext = await resolveTenantFromRoute(routeParams);
  const tenantId = tenantContext?.tenantId;

  if (!tenantId) {
    return (
      <>
        <PageBackground />
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-dark-900 font-display">
              Manage Information
            </h1>
            <p className="text-dark-500 mt-1">
              Kelola seluruh postingan informasi kelas
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6 text-center">
            <p className="text-red-600">
              Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL
              /[universitas]/[prodi]/[kelas].
            </p>
          </div>
        </div>
      </>
    );
  }

  const { data: informations } = await getCmsInformation(tenantId);

  const session = await getCurrentSessionUser();
  const dbUser = session?.id
    ? await prisma.user.findUnique({
        where: { id: session.id },
        select: { id: true, name: true, image: true },
      })
    : null;

  const currentUser = {
    id: session?.id || dbUser?.id || '',
    name: dbUser?.name || session?.name || 'User',
    image: dbUser?.image || session?.image,
  };

  return (
    <>
      <PageBackground />

      <div className="relative z-10 space-y-6">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-dark-400 dark:text-dark-500 mb-1">
            CMS
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-dark-900 dark:text-white font-display">
            Manage Information
          </h1>
          <p className="text-sm md:text-base text-dark-500 dark:text-dark-400 mt-1">
            Kelola seluruh postingan informasi dan pengumuman kelas
          </p>
        </div>

        {/* Form: Create New Post */}
        <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl p-4 md:p-6 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />

          <h2 className="text-lg font-semibold mb-4 text-dark-900 dark:text-white">
            Buat Postingan Baru
          </h2>
          <ActionFeedback actionType="information" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Judul
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white placeholder:text-dark-400 dark:placeholder:text-dark-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow"
                placeholder="Contoh: Pengumuman Rapat Bulanan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Konten
              </label>
              <textarea
                name="content"
                rows={4}
                required
                className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white placeholder:text-dark-400 dark:placeholder:text-dark-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow"
                placeholder="Tulis konten postingan..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Tipe Postingan
              </label>
              <select
                name="type"
                className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow"
              >
                <option value="TEXT">Teks Saja</option>
                <option value="IMAGE">Gambar</option>
                <option value="VIDEO">Video</option>
                <option value="PDF">Dokumen PDF</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Upload File (opsional)
              </label>
              <input
                type="file"
                name="file"
                className="w-full px-4 py-2.5 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base transition-shadow"
              />
            </div>
            <input type="hidden" name="tenantId" value={tenantId} />
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all font-medium"
            >
              Buat Postingan
            </button>
          </ActionFeedback>
        </div>

        {/* Information List */}
        <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl overflow-hidden shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />

          <div className="p-4 md:p-6 border-b border-dark-100 dark:border-dark-800">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white">
              Daftar Postingan ({informations?.length || 0})
            </h2>
          </div>
          <div className="divide-y divide-dark-100 dark:divide-dark-800">
            {!informations || informations.length === 0 ? (
              <div className="p-6 text-center text-dark-500 dark:text-dark-400">
                Belum ada postingan. Buat postingan pertama Anda!
              </div>
            ) : (
              informations.map((info) => (
                <div
                  key={info.id}
                  className="p-4 md:p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 hover:bg-dark-50 dark:hover:bg-dark-800/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-dark-900 dark:text-white break-words">
                        {info.title}
                      </h3>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          info.type === "IMAGE"
                            ? "bg-green-100 text-green-800"
                            : info.type === "VIDEO"
                            ? "bg-blue-100 text-blue-800"
                            : info.type === "PDF"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {info.type}
                      </span>
                    </div>
                    <p className="text-sm text-dark-600 dark:text-dark-300 mt-1 break-words line-clamp-2">
                      {info.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-dark-500 dark:text-dark-400">
                      <span className="flex items-center gap-1">
                        <Avatar src={info.user.image} name={info.user.name} id={info.user.id} size="sm" />
                        {info.user.name}
                      </span>
                      <span>{formatJakartaTime(info.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        👁️ {info._count.readMarks} read
                      </span>
                      <span className="flex items-center gap-1">
                        💬 {info._count.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        ❤️ {info._count.reactions}
                      </span>
                    </div>

                    {/* Read Marks Detail */}
                    {info.readMarks.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-dark-500 dark:text-dark-400 mb-1">
                          Dibaca oleh:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {info.readMarks.map((rm) => (
                            <span
                              key={rm.userId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                            >
                              <Avatar src={rm.user.image} name={rm.user.name} id={rm.userId} size="sm" />
                              {rm.user.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex md:flex-col items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-0 border-dark-100 dark:border-dark-800">
                    <DeleteInformationButton id={info.id} title={info.title} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
