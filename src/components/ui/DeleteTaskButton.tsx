"use client";

import { deleteTaskAction } from "@/features/task/actions/task.action";

export default function DeleteTaskButton({ 
  id, 
  title 
}: { 
  id: string; 
  title: string; 
}) {
  const handleDelete = async () => {
    if (confirm(`Yakin ingin menghapus tugas "${title}"?`)) {
      await deleteTaskAction(id);
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