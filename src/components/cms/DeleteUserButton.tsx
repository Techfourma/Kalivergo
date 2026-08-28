"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteUser } from "@/actions/cms/people";
import ActionFeedback from "@/components/cms/ActionFeedback";

export default function DeleteUserButton({
  userId,
  userName,
  tenantId,
  deleteAction,
}: {
  userId: string;
  userName: string;
  tenantId: string;
  deleteAction?: (formData: FormData) => Promise<{ success?: string; error?: string } | void>;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("tenantId", tenantId);
    if (deleteAction) {
      return await deleteAction(formData);
    }
    return await deleteUser(formData);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="text-sm text-red-600 hover:underline font-medium"
      >
        Hapus
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-dark-900 dark:border dark:border-dark-700 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white">
              Konfirmasi Hapus Akun
            </h3>
            <p className="mt-2 text-sm text-dark-600 dark:text-dark-300">
              Apakah anda yakin ingin menghapus akun tersebut?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-dark-200 dark:border-dark-700 px-4 py-2 text-sm font-medium text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
              >
                Tidak
              </button>
              <ActionFeedback
                actionType="delete-user"
                errorTitle="Gagal menghapus akun"
                customSubmit={handleDelete}
                refreshOnSuccess={false}
                onClose={() => {
                  setShowConfirm(false);
                  router.refresh();
                }}
                className="inline-block"
              >
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Ya
                </button>
              </ActionFeedback>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
