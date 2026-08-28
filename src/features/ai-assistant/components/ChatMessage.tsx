"use client";

import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
        {isUser ? (
          <p className="text-sm text-dark-200 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          <MarkdownContent content={message.content} />
        )}
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

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-body text-sm text-dark-200 leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-1.5">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-1.5 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-1.5 space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => <li className="my-0.5">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-dark-100">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => (
            <h1 className="text-base font-semibold text-dark-100 mt-3 mb-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold text-dark-100 mt-3 mb-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-dark-100 mt-3 mb-1">{children}</h3>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-dark-700/70 text-primary-300 text-[13px]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-2 p-3 rounded-lg bg-dark-950 border border-dark-700 overflow-x-auto text-[13px] text-dark-200">
              {children}
            </pre>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 underline underline-offset-2 hover:text-primary-300"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 pl-3 border-l-2 border-primary-500/50 text-dark-400 italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-dark-700" />,
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-dark-600 px-2 py-1 text-dark-100 font-semibold bg-dark-800/60">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-dark-600 px-2 py-1 text-dark-300">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}