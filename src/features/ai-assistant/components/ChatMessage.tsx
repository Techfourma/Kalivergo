"use client";

import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import type { AIAssistantMessage } from "@/features/ai-assistant/types";

interface ChatMessageProps {
  message: AIAssistantMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-2xl",
        isUser
          ? "bg-primary-600/10 ml-auto max-w-[85%]"
          : "bg-dark-800/50 mr-auto max-w-[85%]"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-primary-600 text-white"
            : "bg-dark-700 text-primary-400"
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-dark-200 whitespace-pre-wrap break-words">
          {message.content}
        </p>
        {message.timestamp && (
          <p className="text-xs text-dark-500 mt-2">
            {new Date(message.timestamp).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
}