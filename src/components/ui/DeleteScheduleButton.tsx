"use client";

import { deleteSchedule } from "@/actions/cms";

export default function DeleteScheduleButton({ 
  id, 
  title 
}: { 
  id: string; 
  title: string; 
}) {
  const handleDelete = async () => {
    if (confirm(`Yakin ingin menghapus jadwal "${title}"?`)) {
      await deleteSchedule(id);
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