"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { updateSeminarSubmissionsAction } from "@/features/seminar/actions/update-seminar-submissions.action";
import { Users, X, Search, CheckCircle2, Circle, Save, Loader2 } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

interface User {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
}

interface SeminarSubmissionManagerProps {
  seminarId: string;
  seminarTitle: string;
  submittedUserIds: string[];
  allUsers: User[];
  submissionCount: number;
}

export default function SeminarSubmissionManager({
  seminarId,
  seminarTitle,
  submittedUserIds,
  allUsers,
  submissionCount: initialCount,
}: SeminarSubmissionManagerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(submittedUserIds)
  );
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [savedCount, setSavedCount] = useState(initialCount);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const filtered = useMemo(
    () =>
      allUsers.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())
      ),
    [allUsers, search]
  );

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filtered.map((u) => u.id)));
  const clearAll = () => setSelected(new Set());

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSeminarSubmissionsAction(seminarId, Array.from(selected));
      if ("error" in result && result.error) {
        showToast("error", result.error);
      } else {
        setSavedCount(selected.size);
        showToast("success", "Submission seminar berhasil disimpan!");
        setIsOpen(false);
        router.refresh();
      }
    });
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const modal = (
    <>
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium flex items-center gap-2 transition-all animate-in slide-in-from-bottom-4 ${
            toast.type === "success"
              ? "bg-gradient-to-r from-green-500 to-emerald-500"
              : "bg-gradient-to-r from-red-500 to-rose-500"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          {toast.msg}
        </div>
      )}

      <div
        className="fixed inset-0 z-[100] bg-white dark:bg-dark-950 sm:bg-black/50 dark:sm:bg-black/70 sm:flex sm:items-center sm:justify-center"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <div className="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl flex flex-col overflow-hidden bg-white dark:bg-dark-900 sm:border sm:border-dark-100 dark:sm:border-dark-700/60">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-dark-100 dark:border-dark-700/60 shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-dark-900 dark:text-dark-50">Kelola Submission</h2>
              <p className="text-xs text-dark-500 dark:text-dark-400 mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">
                {seminarTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors text-dark-500 dark:text-dark-400 shrink-0 ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 pt-3 pb-2 sm:px-6 sm:pt-4 sm:pb-3 border-b border-dark-50 dark:border-dark-700/60 shrink-0 space-y-2 sm:space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 dark:text-dark-500" />
              <input
                type="text"
                placeholder="Cari nama anggota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-50 placeholder:text-dark-400 dark:placeholder:text-dark-500 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-dark-500 dark:text-dark-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400">{selected.size}</span>
                {" "}/{" "}{allUsers.length} dipilih
              </span>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs px-2 sm:px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs px-2 sm:px-2.5 py-1 rounded-md bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors font-medium"
                >
                  Hapus Semua
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 overscroll-contain">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-dark-400 dark:text-dark-500 text-sm">
                Tidak ada anggota ditemukan
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((user) => {
                  const isChecked = selected.has(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggle(user.id)}
                      className={`w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-left transition-all ${
                        isChecked
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50"
                          : "hover:bg-dark-50 dark:hover:bg-dark-800 border border-transparent"
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-dark-300 dark:text-dark-600 shrink-0" />
                      )}
                      <Avatar
                        src={user.image}
                        name={user.name}
                        id={user.id}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isChecked ? "text-blue-900 dark:text-blue-200" : "text-dark-900 dark:text-dark-50"}`}>
                          {user.name}
                        </p>
                        {user.email && (
                          <p className="text-xs text-dark-400 dark:text-dark-500 truncate hidden sm:block">{user.email}</p>
                        )}
                      </div>
                      {isChecked && (
                        <span className="text-xs bg-blue-600 dark:bg-blue-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-dark-100 dark:border-dark-700/60 shrink-0 flex items-center justify-between bg-dark-50/50 dark:bg-dark-800/50">
            <p className="text-xs text-dark-500 dark:text-dark-400 hidden sm:block">
              {selected.size} anggota akan tercatat sudah mendaftar
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-blue-500/30 disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelected(new Set(submittedUserIds));
          setSearch("");
          setIsOpen(true);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-sm font-medium transition-all hover:scale-105 active:scale-95"
      >
        <Users className="h-3.5 w-3.5" />
        <span>Submission</span>
        <span className="ml-1 bg-blue-600 dark:bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none">
          {savedCount}
        </span>
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(modal, document.body)}
    </>
  );
}