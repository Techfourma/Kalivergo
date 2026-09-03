"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardCheck, Loader2, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { reviewTaskSubmissionAction } from "@/features/task/actions/task.action";
import { getTaskCategoryLabel } from "@/shared/task-category";

interface PendingSubmission {
  id: string;
  submittedAt: string;
  task: { id: string; title: string; category: string; pertemuan: { id: string; name: string }[] };
  pertemuan: { id: string; name: string } | null;
  user: { id: string; name: string; email: string | null; image: string | null };
}

export default function TaskSubmissionReview({ submissions }: { submissions: PendingSubmission[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const review = (submissionId: string, decision: "APPROVE" | "REJECT") => {
    setProcessingId(submissionId);
    setError(null);
    startTransition(async () => {
      const result = await reviewTaskSubmissionAction(submissionId, decision);
      if ("error" in result && result.error) setError(result.error);
      else router.refresh();
      setProcessingId(null);
    });
  };

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-dark-900 dark:text-white">Submission menunggu validasi</h2>
            <p className="text-sm text-dark-500 dark:text-dark-400">{submissions.length} pengajuan perlu diperiksa</p>
          </div>
        </div>
      </div>
      {error && <p className="mb-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      <div className="space-y-2">
        {submissions.map((submission) => {
          const processing = isPending && processingId === submission.id;
          return (
            <div key={submission.id} className="flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-white p-3 dark:border-amber-900/50 dark:bg-dark-900 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={submission.user.image} name={submission.user.name} id={submission.user.id} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-dark-900 dark:text-white">{submission.user.name}</p>
                  <p className="truncate text-xs text-dark-500 dark:text-dark-400">{submission.task.title}</p>
                  <p className="truncate text-xs font-medium text-primary-600 dark:text-primary-400">
                    Kategori: {getTaskCategoryLabel(submission.task.category)}
                  </p>
                  {(submission.pertemuan ? [submission.pertemuan] : submission.task.pertemuan).length > 0 && (
                    <p className="truncate text-xs font-medium text-primary-600 dark:text-primary-400">
                      {(submission.pertemuan ? [submission.pertemuan] : submission.task.pertemuan)
                        .map((pertemuan) => pertemuan.name)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <button type="button" disabled={isPending} onClick={() => review(submission.id, "REJECT")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/30 sm:flex-none">
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Kembalikan
                </button>
                <button type="button" disabled={isPending} onClick={() => review(submission.id, "APPROVE")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 sm:flex-none">
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Setujui
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}