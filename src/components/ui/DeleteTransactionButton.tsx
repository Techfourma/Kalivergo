"use client";

import { useRouter } from "next/navigation";
import { deleteTransaction } from "@/actions/cms";
import ActionFeedback from "@/components/cms/ActionFeedback";

export default function DeleteTransactionButton({
  id,
  description,
}: {
  id: string;
  description: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm(`Yakin ingin menghapus transaksi "${description}"?`)) {
      return await deleteTransaction(id);
    }
  };

  return (
    <ActionFeedback
      actionType="transaction"
      errorTitle="Gagal menghapus transaksi"
      customSubmit={handleDelete}
      refreshOnSuccess={false}
      onClose={() => router.refresh()}
      className="inline-block"
    >
      <button
        type="submit"
        className="text-sm text-red-600 hover:underline mt-2 font-medium"
      >
        Hapus
      </button>
    </ActionFeedback>
  );
}