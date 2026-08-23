import { AIAssistantConfig } from './config';
import type { AIAssistantError } from '@/features/ai-assistant/types';

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





export async function sendToAIAssistant(
  request: AIServerRequest,
  secret: string
): Promise<{ success: boolean; response?: AIServerResponse; error?: Error }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AIAssistantConfig.timeoutMs);

  try {
    const url = `${AIAssistantConfig.url}/api/chat`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      const aiError: AIAssistantError = {
        code: `HTTP_${response.status}`,
        message: mapHTTPErrorToMessage(response.status),
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

    const data: AIServerResponse = await response.json();

    return {
      success: true,
      response: data,
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