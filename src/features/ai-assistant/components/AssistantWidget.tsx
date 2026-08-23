"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, X } from "lucide-react";
import { ChatWindow } from "./ChatWindow";

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className={cn(
          "fixed !bottom-4 !right-4 !top-auto !left-auto z-50",
          "w-14 h-14 rounded-full",
          "flex items-center justify-center",
          "bg-primary-600 text-white",
          "hover:bg-primary-700 transition-all duration-200",
          "shadow-lg shadow-primary-600/30",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900",
          "group"
        )}
        aria-label={isOpen ? "Tutup AI Assistant" : "Buka AI Assistant"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X size={24} className="transition-transform group-hover:rotate-90" />
        ) : (
          <MessageSquare size={24} className="transition-transform group-hover:scale-110" />
        )}
      </button>

      <ChatWindow isOpen={isOpen} onClose={handleClose} />
    </>
  );
}