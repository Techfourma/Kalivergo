"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full sm:my-auto sm:w-full rounded-t-2xl sm:rounded-2xl bg-white dark:bg-dark-900 shadow-2xl animate-slide-up max-h-[calc(100dvh-1rem)] sm:max-h-[90vh] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]",
          sizes[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-dark-200 dark:border-dark-700 px-4 py-3 sm:px-6 sm:py-4 sticky top-0 bg-white dark:bg-dark-900 z-10">
            <h3 className="text-base sm:text-lg font-semibold text-dark-900 dark:text-dark-50">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-dark-400 hover:bg-dark-100 hover:text-dark-600 dark:hover:bg-dark-800 dark:hover:text-dark-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}