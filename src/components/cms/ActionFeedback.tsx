"use client";

import {
  addUser,
  createSchedule,
  createSeminar,
  createTask,
  createTransaction,
  deleteTransaction,
  createCategory,
} from "@/actions/cms";
import Loading from "@/components/layout/Loading";
import { CheckCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useRef, useState } from "react";

type ActionType = "task" | "schedule" | "seminar" | "people" | "profile" | "portfolio" | "transaction" | "finance" | "category";

type ActionResult = {
  success?: string | boolean;
  error?: string;
};

const actions: Record<ActionType, (formData: FormData) => Promise<ActionResult>> = {
  task: createTask,
  schedule: createSchedule,
  seminar: createSeminar,
  people: addUser,
  finance: createTransaction,
  transaction: async (formData) => deleteTransaction(formData.get("id") as string),
  profile: async () => ({ success: "Perubahan berhasil" }),
  portfolio: async () => ({ success: "Berhasil disimpan" }),
  category: createCategory,
};

const actionLabels: Record<ActionType, { loading: string; success: string }> = {
  task: {
    loading: "Menambahkan tugas",
    success: "Tugas berhasil ditambahkan",
  },
  schedule: {
    loading: "Menambahkan jadwal",
    success: "Jadwal berhasil ditambahkan",
  },
  seminar: {
    loading: "Menambahkan seminar",
    success: "Seminar berhasil ditambahkan",
  },
  people: {
    loading: "Menambahkan anggota",
    success: "Anggota berhasil ditambahkan",
  },
  finance: {
    loading: "Menyimpan transaksi",
    success: "Transaksi berhasil ditambahkan",
  },
  transaction: {
    loading: "Menghapus transaksi",
    success: "Transaksi berhasil dihapus",
  },
  profile: {
    loading: "Menyimpan perubahan",
    success: "Perubahan berhasil",
  },
  portfolio: {
    loading: "Menyimpan",
    success: "Berhasil disimpan",
  },
  category: {
    loading: "Menyimpan kategori",
    success: "Kategori tersimpan",
  },
};

interface ActionFeedbackProps {
  actionType: ActionType;
  children: ReactNode;
  className?: string;
  customSubmit?: (formData: FormData) => Promise<ActionResult | void>;
  errorTitle?: string;
  refreshOnSuccess?: boolean;
  onClose?: () => void;
}

export default function ActionFeedback({
  actionType,
  children,
  className,
  customSubmit,
  errorTitle = "Gagal menambahkan data",
  refreshOnSuccess = true,
  onClose,
}: ActionFeedbackProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const labels = actionLabels[actionType];

  const handleAction = async (formData: FormData) => {
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const result = customSubmit ? await customSubmit(formData) : await actions[actionType](formData);
      if (result && typeof result === "object") {
        if (result.success) {
          formRef.current?.reset();
          setSuccess(true);
          if (refreshOnSuccess) router.refresh();
        } else if (result.error) {
          setError(result.error);
        }
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeFeedback = () => {
    setSuccess(false);
    setError("");
    onClose?.();
  };

  return (
    <>
      <form
        ref={formRef}
        action={handleAction}
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          if (isLoading) event.preventDefault();
        }}
        className={className}
      >
        {children}
      </form>

      <Loading
        isVisible={isLoading}
        message={labels.loading}
        subMessage="Mohon tunggu sebentar, proses sedang berjalan..."
      />

      {(success || error) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-dark-900 dark:border dark:border-dark-700 p-8 text-center shadow-2xl">
            <button
              type="button"
              onClick={closeFeedback}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-dark-400 dark:text-dark-500 transition-colors hover:bg-dark-100 dark:hover:bg-dark-800 hover:text-dark-600 dark:hover:text-dark-200"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>

            {success ? (
              <>
                <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-bold text-dark-900 dark:text-white">{labels.success}</h2>
                <button
                  type="button"
                  onClick={closeFeedback}
                  className="mt-6 rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Tutup
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">{errorTitle}</h2>
                <p className="mt-2 text-sm text-dark-600 dark:text-dark-300">{error}</p>
                <button
                  type="button"
                  onClick={closeFeedback}
                  className="mt-6 rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Tutup
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}