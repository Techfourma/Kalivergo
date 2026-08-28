"use client";

import { useRouter } from "next/navigation";
import { deleteInformation } from "@/actions/cms/information";
import ActionFeedback from "@/components/cms/ActionFeedback";

export default function DeleteInformationButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm(`Yakin ingin menghapus postingan "${title}"?`)) {
      return await deleteInformation(id);
    }
  };

  return (
    <ActionFeedback
      actionType="information"
      errorTitle="Gagal menghapus postingan"
      customSubmit={handleDelete}
      refreshOnSuccess={false}
      onClose={() => router.refresh()}
      className="inline-block"
    >
      <button
        type="submit"
        className="text-sm text-red-600 hover:underline font-medium"
      >
        Hapus
      </button>
    </ActionFeedback>
  );
}
