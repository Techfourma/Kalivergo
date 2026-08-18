"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, ReactNode } from "react";

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

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative my-auto w-full rounded-2xl bg-white shadow-2xl animate-slide-up",
          sizes[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-dark-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-dark-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-dark-400 hover:bg-dark-100 hover:text-dark-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="max-h-[75vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}