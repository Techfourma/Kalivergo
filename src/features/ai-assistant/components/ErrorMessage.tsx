"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ message, onRetry, className }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-2xl bg-red-600/10 border border-red-600/20",
        className
      )}
    >
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-400">{message}</p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <RefreshCw size={12} />
            Coba Lagi
          </button>
        )}
      </div>
    </div>
  );
}