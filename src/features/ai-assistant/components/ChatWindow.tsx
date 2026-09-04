"use client";

import { X, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { ErrorMessage } from "./ErrorMessage";
import type { AIAssistantMessage, AIAssistantStatus } from "@/features/ai-assistant/types";

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<AIAssistantMessage[]>([]);
  const [status, setStatus] = useState<AIAssistantStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const buildHistory = (): Array<{ role: "user" | "assistant"; content: string }> => {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const message = formData.get('message') as string;

    if (!message || !message.trim() || status === 'loading') {
      return;
    }

    const trimmedMessage = message.trim();

    const userMessage: AIAssistantMessage = {
      role: 'user',
      content: trimmedMessage,
      timestamp: Date.now(),
    };

    const assistantMessage: AIAssistantMessage = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setStatus('loading');
    setError(null);

    e.currentTarget.reset();
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    await streamResponse(trimmedMessage, assistantMessage);
  };

  const streamResponse = async (
    trimmedMessage: string,
    assistantMessage: AIAssistantMessage
  ) => {
    try {
      const response = await fetch('/api/ai-assistant/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedMessage,
          conversationId,
          history: buildHistory(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || 'Terjadi masalah saat memproses pertanyaan.';
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming tidak didukung oleh server.');
      }

      let accumulatedText = '';
      const decoder = new TextDecoder();
      let eventBuffer = '';
      let streamEnded = false;
      let streamError: string | null = null;

      const processEvent = (event: string) => {
        const lines = event.split(/\r?\n/);
        const eventName = lines.find((line) => line.startsWith('event:'))?.slice(6).trim();
        const dataLine = lines.find((line) => line.startsWith('data:'));
        if (!eventName || !dataLine) return;

        const data = dataLine.slice(5).trim();

        if (eventName === 'conversationId') {
          try {
            setConversationId(JSON.parse(data));
          } catch {
            // ignore malformed id
          }
        } else if (eventName === 'chunk') {
          try {
            const text = JSON.parse(data);
            if (typeof text === 'string' && text.length > 0) {
              accumulatedText += text;
              setMessages((prev) =>
                prev.map((m) =>
                  m === assistantMessage ? { ...m, content: accumulatedText } : m
                )
              );
            }
          } catch {
            // ignore malformed chunk
          }
        } else if (eventName === 'error') {
          try {
            streamError = JSON.parse(data);
          } catch {
            streamError = data;
          }
          streamEnded = true;
        } else if (eventName === 'done') {
          streamEnded = true;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          eventBuffer += decoder.decode();
          if (eventBuffer.trim()) processEvent(eventBuffer);
          break;
        }

        eventBuffer += decoder.decode(value, { stream: true });
        const events = eventBuffer.split(/\r?\n\r?\n/);
        eventBuffer = events.pop() ?? '';

        for (const event of events) {
          if (event.trim()) processEvent(event);
        }

        if (streamEnded) break;
      }

      reader.releaseLock();

      // If the stream failed mid-way we keep the partial answer that was
      // already received instead of discarding it (the previous behaviour
      // removed the whole assistant message).
      if (streamError) {
        const message = streamError.trim() || 'Terjadi masalah saat memproses pertanyaan.';
        if (accumulatedText.trim().length > 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m === assistantMessage
                ? { ...m, content: `${accumulatedText}\n\n⚠️ _Respon terputus._ ${message}` }
                : m
            )
          );
        }
        setError(message);
        setStatus('error');
        return;
      }

      if (accumulatedText.trim().length === 0) {
        throw new Error('AI tidak menghasilkan respons.');
      }

      setStatus('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi masalah saat memproses pertanyaan.';
      setError(errorMessage);
      setStatus('error');

      setMessages((prev) => prev.filter((m) => m !== assistantMessage));
    }
  };

  const handleRetry = () => {
    setError(null);
    setStatus('idle');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed !bottom-20 !right-4 !top-auto !left-auto w-[calc(100%-2rem)] max-w-md z-50">
      <div className="bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl shadow-primary-950/60 ring-1 ring-primary-500/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-400" />
            <h3 className="font-semibold text-dark-200">AI Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            aria-label="Tutup chat"
          >
            <X size={20} className="text-dark-400" />
          </button>
        </div>

        <div className="h-[400px] overflow-y-auto p-4 space-y-3 bg-dark-900/50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-dark-600 mb-3" />
              <p className="text-dark-300 text-sm leading-relaxed max-w-[260px]">
                Ada yang bisa saya bantu terkait Kalivergo?<br />
                Silakan tulis pertanyaan Anda di bawah ini, dan saya akan berusaha memberikan jawaban terbaik.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}

          {status === 'loading' && <TypingIndicator />}

          {error && (
            <ErrorMessage message={error} onRetry={handleRetry} />
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-dark-800/50 border-t border-dark-700">
          <ChatInput
            ref={inputRef}
            name="message"
            isLoading={status === 'loading'}
            disabled={status === 'loading'}
          />
        </form>
      </div>
    </div>
  );
}