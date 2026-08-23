import { AIAssistantConfig } from './config';
import { buildAssistantUrl } from './url';
import type { AIAssistantError } from '@/features/ai-assistant/types';

export { buildAssistantUrl };

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

function generateUuid(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof (crypto as { randomUUID?: () => string }).randomUUID === 'function'
  ) {
    return (crypto as { randomUUID: () => string }).randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function sendToAIAssistant(
  request: AIServerRequest,
  secret: string
): Promise<{ success: boolean; response?: AIServerResponse; error?: Error }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AIAssistantConfig.timeoutMs);

  try {
    const requestId = generateUuid();
    const conversationId =
      request.conversationId && UUID_RE.test(request.conversationId)
        ? request.conversationId
        : generateUuid();

    const response = await fetch(buildAssistantUrl(AIAssistantConfig.url || ''), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({
        requestId,
        conversationId,
        message: request.message,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let backendMessage: string | undefined;
      const errorData = (await response.json().catch(() => ({} as Record<string, unknown>))) as
        | Record<string, unknown>
        | undefined;
      if (errorData && typeof errorData === 'object' && typeof errorData.message === 'string') {
        backendMessage = errorData.message;
      }

      const aiError: AIAssistantError = {
        code: `HTTP_${response.status}`,
        message: backendMessage || mapHTTPErrorToMessage(response.status),
        isRetryable: response.status >= 500 || response.status === 429,
      };

      return {
        success: false,
        error: new Error(aiError.message),
        response: {
          success: false,
          error: aiError,
        },
      };
    }

    const data = (await response.json()) as Record<string, unknown>;

    if (data.success === false) {
      const message =
        typeof data.message === 'string' ? data.message : 'Terjadi masalah saat memproses pertanyaan.';
      const code = typeof data.error === 'string' ? data.error : 'AI_BACKEND_ERROR';
      const aiError: AIAssistantError = { code, message, isRetryable: false };

      return {
        success: false,
        error: new Error(message),
        response: { success: false, error: aiError },
      };
    }

    const answer = typeof data.answer === 'string' ? data.answer : '';

    return {
      success: true,
      response: {
        success: true,
        data: {
          response: answer,
          conversationId,
        },
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: new Error('AI Assistant timeout. Silakan coba lagi.'),
      };
    }

    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          success: false,
          error: new Error('AI Assistant tidak tersedia. Silakan coba lagi nanti.'),
        };
      }

      return {
        success: false,
        error,
      };
    }

    return {
      success: false,
      error: new Error('Terjadi masalah saat menghubungi AI Assistant.'),
    };
  }
}

function mapHTTPErrorToMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Permintaan tidak valid.';
    case 401:
      return 'Tidak diizinkan mengakses AI Assistant.';
    case 429:
      return 'AI Assistant sedang sibuk. Silakan tunggu beberapa saat.';
    case 500:
      return 'Terjadi kesalahan pada AI Assistant.';
    case 503:
      return 'AI Assistant tidak tersedia sementara.';
    default:
      return 'Terjadi masalah saat memproses pertanyaan.';
  }
}

export function validateAIResponse(data: unknown): data is AIServerResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.success !== 'boolean') {
    return false;
  }

  if (obj.error !== undefined) {
    if (typeof obj.error !== 'object' || obj.error === null) {
      return false;
    }
    const error = obj.error as Record<string, unknown>;
    if (typeof error.code !== 'string' || typeof error.message !== 'string') {
      return false;
    }
  }

  if (obj.data !== undefined) {
    if (typeof obj.data !== 'object' || obj.data === null) {
      return false;
    }
    const data = obj.data as Record<string, unknown>;
    if (typeof data.response !== 'string') {
      return false;
    }
  }

  return true;
}