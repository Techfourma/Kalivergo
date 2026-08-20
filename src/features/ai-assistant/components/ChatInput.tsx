"use client";

import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { forwardRef, TextareaHTMLAttributes } from "react";

interface ChatInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  isLoading?: boolean;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, isLoading, ...props }, ref) => {
    return (
      <div className="relative flex items-end gap-2">
        <textarea
          ref={ref}
          className={cn(
            "flex-1 resize-none rounded-xl bg-dark-800/50 border border-dark-700",
            "px-4 py-3 text-sm text-dark-200 placeholder:text-dark-500",
            "focus:outline-none focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "min-h-[48px] max-h-[120px]",
            className
          )}
          placeholder="Tanyakan tentang akademik, KRS, jadwal, atau peraturan kampus..."
          rows={1}
          disabled={isLoading}
          {...props}
        />

        <button
          type="submit"
          className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
            "bg-primary-600 text-white",
            "hover:bg-primary-700 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600"
          )}
          disabled={isLoading || props.disabled}
          aria-label="Kirim pesan"
        >
          <Send size={20} />
        </button>
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";