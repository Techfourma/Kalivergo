"use client";

import { useRouter } from "next/navigation";
import { deleteSeminar } from "@/features/seminar/actions/delete-seminar.action";

export default function DeleteSeminarButton({ 
  id, 
  title 
}: { 
  id: string; 
  title: string; 
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm(`Yakin ingin menghapus seminar "${title}"?`)) {
      await deleteSeminar(id);
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
    >
      Hapus
    </button>
  );
}