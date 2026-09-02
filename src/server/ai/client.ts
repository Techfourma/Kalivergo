import type { AIAssistantError } from "@/features/ai-assistant/types";
import { AIAssistantConfig, isProduction } from "./config";
import { generateAnswer } from "./gemini";
import { loadKnowledgeBase, retrieveRelevantContext } from "./knowledgeBase";

export interface AIServerRequest {
  message: string;
  userId: string;
  conversationId?: string;
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Development-only reply used when Gemini is not configured. */
function getMockReply(message: string): string {
  return `[MOCK MODE] Ini adalah respons simulasi. Pertanyaan Anda: "${message}". Dalam mode produksi, jawaban dihasilkan oleh Gemini dengan konteks dari dataset internal Kalivergo.`;
}

/**
 * Process a user message entirely in-process: retrieve relevant context from
 * the internal Kalivergo dataset and answer using Gemini. No external AI
 * service is contacted.
 */
export async function sendToAIAssistant(
  request: AIServerRequest
): Promise<AIServerResult> {
  try {
    const conversationId =
      request.conversationId && UUID_RE.test(request.conversationId)
        ? request.conversationId
        : generateUuid();

    if (!AIAssistantConfig.geminiApiKey && !isProduction()) {
      return {
        success: true,
        response: {
          success: true,
          data: { response: getMockReply(request.message), conversationId },
        },
      };
    }

    if (!AIAssistantConfig.geminiApiKey) {
      return {
        success: false,
        error: new Error("Gemini API key is not configured in production."),
      };
    }

    await loadKnowledgeBase();
    const retrieved = retrieveRelevantContext(request.message, 3);

    const answer = await generateAnswer(request.message, {
      knowledge: retrieved?.context,
    });

    if (!answer) {
      return {
        success: false,
        error: new Error("AI gagal menghasilkan respons. Silakan coba lagi."),
      };
    }

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