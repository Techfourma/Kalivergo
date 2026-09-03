import type { AIAssistantError } from "@/features/ai-assistant/types";
import { AIAssistantConfig, isProduction } from "./config";
import { generateWithFallback, streamWithFallback, isAnyProviderConfigured } from "./providers";
import { loadKnowledgeBase, retrieveRelevantContext } from "./knowledgeBase";

export interface AIServerRequest {
  message: string;
  userId: string;
  conversationId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AIServerResponse {
  success: boolean;
  data?: {
    response: string;
    conversationId?: string;
  };
  error?: AIAssistantError;
}

export interface AIServerResult {
  success: boolean;
  response?: AIServerResponse;
  error?: Error;
}

interface RateLimitEntry {
  timestamps: number[];
}

interface HistoryEntry {
  userId: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  updatedAt: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HISTORY_TTL_MS = 10 * 60 * 1000;

const historyStore = new Map<string, HistoryEntry>();

function generateUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof (crypto as { randomUUID?: () => string }).randomUUID === "function"
  ) {
    return (crypto as { randomUUID: () => string }).randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getMockReply(message: string): string {
  return `[MOCK MODE] Ini adalah respons simulasi. Pertanyaan Anda: "${message}". Dalam mode produksi, jawaban dihasilkan oleh Gemini dengan konteks dari dataset internal Kalivergo.`;
}

interface CacheEntry {
  response: string;
  createdAt: number;
}
const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_SIZE = 100;

const rateLimitStore = new Map<string, RateLimitEntry>();
const rateLimitMinuteMs = 60 * 1000;

function cleanupOldTimestamps(entry: RateLimitEntry, windowMs: number): void {
  const now = Date.now();
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);
}

function getRateLimitKey(userId: string): string {
  return userId;
}

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const key = getRateLimitKey(userId);
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry) {
    rateLimitStore.set(key, { timestamps: [now] });
    return { allowed: true };
  }

  cleanupOldTimestamps(entry, rateLimitMinuteMs);
  const minuteCount = entry.timestamps.length;

  if (minuteCount >= AIAssistantConfig.rateLimits.perMinute) {
    const oldest = entry.timestamps[0];
    return { allowed: false, retryAfter: Math.ceil((rateLimitMinuteMs - (now - oldest)) / 1000) };
  }

  entry.timestamps.push(now);
  return { allowed: true };
}


function getHistoryKey(userId: string): string {
  return userId;
}

function getConversationHistory(userId: string): Array<{ role: "user" | "assistant"; content: string }> {
  const key = getHistoryKey(userId);
  const entry = historyStore.get(key);
  if (!entry) return [];

  if (Date.now() - entry.updatedAt > HISTORY_TTL_MS) {
    historyStore.delete(key);
    return [];
  }

  return entry.history;
}

function saveConversationHistory(
  userId: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): void {
  historyStore.set(getHistoryKey(userId), {
    userId,
    history: history.slice(-AIAssistantConfig.maxHistoryMessages),
    updatedAt: Date.now(),
  });
}

function buildCacheKey(userId: string, message: string): string {
  return `${userId}:${message.trim().slice(0, 100)}`;
}

function getCachedResponse(userId: string, message: string): string | null {
  const key = buildCacheKey(userId, message);
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.response;
}

function setCachedResponse(userId: string, message: string, response: string): void {
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(buildCacheKey(userId, message), { response, createdAt: Date.now() });
}

export function clearAIAgentState(): void {
  responseCache.clear();
  rateLimitStore.clear();
  historyStore.clear();
}

export { checkRateLimit as _checkRateLimit, getCachedResponse as _getCachedResponse, getConversationHistory as _getConversationHistory };

export async function sendToAIAssistant(
  request: AIServerRequest
): Promise<AIServerResult> {
  try {
    const conversationId =
      request.conversationId && UUID_RE.test(request.conversationId)
        ? request.conversationId
        : generateUuid();

    const userId = request.userId;
    const trimmedMessage = request.message.trim();

    const { allowed } = checkRateLimit(userId);
    if (!allowed) {
      const aiError: AIAssistantError = {
        code: "RATE_LIMITED",
        message: "AI sedang sibuk. Silakan coba lagi beberapa saat.",
        isRetryable: true,
      };
      return {
        success: false,
        error: new Error(aiError.message),
        response: { success: false, error: aiError },
      };
    }

    const cached = getCachedResponse(userId, trimmedMessage);
    if (cached) {
      saveConversationHistory(userId, [
        ...getConversationHistory(userId),
        { role: "user", content: trimmedMessage },
        { role: "assistant", content: cached },
      ]);
      return {
        success: true,
        response: {
          success: true,
          data: { response: cached, conversationId },
        },
      };
    }

    const useMock = AIAssistantConfig.mockMode || (!isAnyProviderConfigured() && !isProduction());

    if (useMock) {
      const mockReply = getMockReply(trimmedMessage);
      saveConversationHistory(userId, [
        ...getConversationHistory(userId),
        { role: "user", content: trimmedMessage },
        { role: "assistant", content: mockReply },
      ]);
      return {
        success: true,
        response: {
          success: true,
          data: { response: mockReply, conversationId },
        },
      };
    }

    if (!isAnyProviderConfigured()) {
      return {
        success: false,
        error: new Error("No AI provider is configured in production."),
      };
    }

    await loadKnowledgeBase();
    const retrieved = retrieveRelevantContext(trimmedMessage, 3);

    const conversationHistory = request.history ?? getConversationHistory(userId);
    const maxHistory = AIAssistantConfig.maxHistoryMessages;
    const limitedHistory = conversationHistory.slice(-maxHistory);

    const result = await generateWithFallback(trimmedMessage, {
      knowledge: retrieved?.context,
      history: limitedHistory,
    });

    const answer = result.response;

    if (!answer) {
      return {
        success: false,
        error: new Error("AI gagal menghasilkan respons. Silakan coba lagi."),
      };
    }

    setCachedResponse(userId, trimmedMessage, answer);

    saveConversationHistory(userId, [
      ...getConversationHistory(userId),
      { role: "user", content: trimmedMessage },
      { role: "assistant", content: answer },
    ]);

    return {
      success: true,
      response: {
        success: true,
        data: { response: answer, conversationId },
      },
    };
  } catch (err) {
    const raw = err instanceof Error ? err.message : "";
    const aiError: AIAssistantError = {
      code: "AI_GENERATION_ERROR",
      message: friendlyError(raw),
      isRetryable: true,
    };
    return {
      success: false,
      error: new Error(aiError.message),
      response: { success: false, error: aiError },
    };
  }
}

export interface StreamResult {
  success: boolean;
  conversationId?: string;
  stream?: AsyncGenerator<string>;
  error?: AIAssistantError;
}

function resolveStreamContext(
  request: AIServerRequest,
  userId: string
): { conversationId: string; history: Array<{ role: "user" | "assistant"; content: string }> } {
  const conversationId =
    request.conversationId && UUID_RE.test(request.conversationId)
      ? request.conversationId
      : generateUuid();

  const conversationHistory = request.history ?? getConversationHistory(userId);
  const maxHistory = AIAssistantConfig.maxHistoryMessages;
  const limitedHistory = conversationHistory.slice(-maxHistory);

  return { conversationId, history: limitedHistory };
}

export async function streamFromAIAssistant(
  request: AIServerRequest
): Promise<StreamResult> {
  const userId = request.userId;
  const trimmedMessage = request.message.trim();

  const { allowed } = checkRateLimit(userId);
  if (!allowed) {
    return {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "AI sedang sibuk. Silakan coba lagi beberapa saat.",
        isRetryable: true,
      },
    };
  }

  const useMock = AIAssistantConfig.mockMode || (!isAnyProviderConfigured() && !isProduction());

  if (useMock) {
    const mockReply = getMockReply(trimmedMessage);
    const conversationId =
      request.conversationId && UUID_RE.test(request.conversationId)
        ? request.conversationId
        : generateUuid();

    saveConversationHistory(userId, [
      ...getConversationHistory(userId),
      { role: "user", content: trimmedMessage },
      { role: "assistant", content: mockReply },
    ]);

    async function* mockStream(): AsyncGenerator<string, void, void> {
      yield mockReply;
    }

    return { success: true, conversationId, stream: mockStream() };
  }

  if (!isAnyProviderConfigured()) {
    return {
      success: false,
      error: {
        code: "AI_NOT_CONFIGURED",
        message: "AI belum dikonfigurasi dengan benar. Hubunga administrator.",
        isRetryable: false,
      },
    };
  }

  const cached = getCachedResponse(userId, trimmedMessage);
  if (cached) {
    const { conversationId } = resolveStreamContext(request, userId);

    async function* cachedStream(): AsyncGenerator<string, void, void> {
      yield cached;
    }

    saveConversationHistory(userId, [
      ...getConversationHistory(userId),
      { role: "user", content: trimmedMessage },
      { role: "assistant", content: cached },
    ]);

    return { success: true, conversationId, stream: cachedStream() };
  }

  await loadKnowledgeBase();
  const retrieved = retrieveRelevantContext(trimmedMessage, 3);

  const { conversationId, history } = resolveStreamContext(request, userId);

  let answerBuffer = "";
  const stream = (async function* generateStream(): AsyncGenerator<string, void, void> {
    for await (const { chunk } of streamWithFallback(trimmedMessage, {
      knowledge: retrieved?.context,
      history,
    })) {
      answerBuffer += chunk;
      yield chunk;
    }

    if (answerBuffer.trim().length === 0) {
      throw new Error("AI gagal menghasilkan respons. Silakan coba lagi.");
    }

    setCachedResponse(userId, trimmedMessage, answerBuffer);
    saveConversationHistory(userId, [
      ...getConversationHistory(userId),
      { role: "user", content: trimmedMessage },
      { role: "assistant", content: answerBuffer },
    ]);
  })();

  return { success: true, conversationId, stream: stream };
}


function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("api key")) {
    return "AI belum dikonfigurasi dengan benar. Hubungi administrator.";
  }
  if (lower.includes("rate limit") || lower.includes("429")) {
    return "AI sedang sibuk. Silakan coba lagi beberapa saat.";
  }
  if (lower.includes("503") || lower.includes("unavailable")) {
    return "Layanan AI tidak tersedia sementara. Silakan coba lagi nanti.";
  }
  if (lower.includes("timed out") || lower.includes("timeout")) {
    return "AI membutuhkan waktu terlalu lama untuk merespons. Silakan coba lagi.";
  }
  return "Terjadi masalah saat memproses pertanyaan. Silakan coba lagi.";
}

export function validateAIResponse(data: unknown): data is AIServerResponse {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.success !== "boolean") return false;

  if (obj.error !== undefined) {
    if (typeof obj.error !== "object" || obj.error === null) return false;
    const err = obj.error as Record<string, unknown>;
    if (typeof err.code !== "string" || typeof err.message !== "string") {
      return false;
    }
  }

  if (obj.data !== undefined) {
    if (typeof obj.data !== "object" || obj.data === null) return false;
    const d = obj.data as Record<string, unknown>;
    if (typeof d.response !== "string") return false;
  }

  return true;
}