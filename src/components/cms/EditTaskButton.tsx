"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { CheckCircle2, Pencil } from "lucide-react";
import { updateTask } from "@/actions/cms";
import { formatDateTimeLocalInput } from "@/lib/date-time";

interface Task {
  id: string;
  title: string;
  description: string;
  url?: string | null;
  category?: string;
  startDate: string | Date;
  deadline: string | Date;
  pertemuan?: { id: string; name: string }[];
}

interface EditTaskButtonProps {
  task: Task;
}

export default function EditTaskButton({ task }: EditTaskButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const formatDateTimeLocal = (value: string | Date) => formatDateTimeLocalInput(value);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateTask(task.id, formData);

    if (result && "success" in result) {
      setIsOpen(false);
      setShowSuccessPopup(true);
      setFeedback({ type: "success", message: result.success });
      router.refresh();
    } else if (result && "error" in result) {
      setFeedback({ type: "error", message: result.error });
    }

    setIsLoading(false);
  };

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFeedback(null);
          setShowSuccessPopup(false);
          setIsOpen(true);
        }}
        className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium inline-flex items-center gap-1"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Tugas" size="md">
        <div className="space-y-4">
          {feedback && (
            <div
              className={`rounded-xl border px-3 py-2 text-sm ${
                feedback.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Judul Tugas</label>
              <input
                type="text"
                name="title"
                defaultValue={task.title}
                className="w-full rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-100 placeholder:text-dark-400 dark:placeholder:text-dark-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Deskripsi</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={task.description}
                className="w-full rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-100 placeholder:text-dark-400 dark:placeholder:text-dark-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">URL</label>
              <input
                type="url"
                name="url"
                defaultValue={task.url ?? ""}
                className="w-full rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-100 placeholder:text-dark-400 dark:placeholder:text-dark-500 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Contoh: https://mentari.unpam.ac.id/tugas/1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Kategori</label>
              <select
                name="category"
                defaultValue={task.category ?? "E_LEARNING"}
                className="w-full rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              >
                <option value="E_LEARNING">E-Learning</option>
                <option value="TATAP_MUKA">Tatap Muka</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Start Date Time</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  defaultValue={formatDateTimeLocal(task.startDate)}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Deadline</label>
                <input
                  type="datetime-local"
                  name="deadline"
                  defaultValue={formatDateTimeLocal(task.deadline)}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div className="border-t border-dark-200 dark:border-dark-700 pt-4">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Pertemuan</label>
              <input
                type="text"
                name="pertemuan"
                defaultValue={task.pertemuan?.[0]?.name ?? ""}
                placeholder="Contoh: Pertemuan 1"
                className="w-full rounded-xl border border-dark-200 dark:border-dark-700 px-4 py-2.5 text-sm bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                Satu pertemuan per tugas. Mengubah nama pertemuan akan memperbarui pertemuan tersebut pada tugas ini.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsOpen(false)} className="flex-1 px-4 py-2 border border-dark-200 dark:border-dark-700 text-dark-700 dark:text-dark-200 rounded-xl text-sm font-medium hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors">
                Batal
              </button>
              <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {showSuccessPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <h2 className="text-xl font-bold text-dark-900">Tugas berhasil diperbarui</h2>
            <p className="mt-2 text-sm text-dark-600">Perubahan tugas telah berhasil disimpan.</p>
            <button
              type="button"
              onClick={closeSuccessPopup}
              className="mt-6 rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
