"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-4 rounded-2xl bg-dark-800/50 mr-auto max-w-[85%]",
        className
      )}
    >
      <div className="flex gap-1">
        <span
          className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-sm text-dark-500">AI sedang mengetik...</span>
    </div>
  );
}