"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Pencil } from "lucide-react";
import { updateTask } from "@/actions/cms";
import ActionFeedback from "@/components/cms/ActionFeedback";

interface Task {
  id: string;
  title: string;
  description: string;
  url?: string | null;
  category?: string;
  startDate: string | Date;
  deadline: string | Date;
}

interface EditTaskButtonProps {
  task: Task;
}

export default function EditTaskButton({ task }: EditTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatDateTimeLocal = (value: string | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    await updateTask(task.id, formData);
    setIsLoading(false);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium inline-flex items-center gap-1"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Tugas" size="md">
        <ActionFeedback actionType="task" errorTitle="Gagal memperbarui tugas" className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Judul Tugas</label>
              <input
                type="text"
                name="title"
                defaultValue={task.title}
                className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Deskripsi</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={task.description}
                className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">URL</label>
              <input
                type="url"
                name="url"
                defaultValue={task.url ?? ""}
                className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Contoh: https://mentari.unpam.ac.id/tugas/1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Kategori</label>
              <select
                name="category"
                defaultValue={task.category ?? "E_LEARNING"}
                className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              >
                <option value="E_LEARNING">E-Learning</option>
                <option value="TATAP_MUKA">Tatap Muka</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Start Date Time</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  defaultValue={formatDateTimeLocal(task.startDate)}
                  className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Deadline</label>
                <input
                  type="datetime-local"
                  name="deadline"
                  defaultValue={formatDateTimeLocal(task.deadline)}
                  className="w-full rounded-xl border border-dark-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2 border border-dark-200 rounded-xl text-sm font-medium hover:bg-dark-50 transition-colors">
                Batal
              </button>
              <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </ActionFeedback>
      </Modal>
    </>
  );
}
