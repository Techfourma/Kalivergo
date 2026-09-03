export interface AIAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface AIAssistantRequest {
  message: string;
  conversationId?: string;
  history?: AIAssistantMessage[];
}

export interface AIAssistantResponse {
  success: boolean;
  data?: {
    response: string;
    conversationId?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface AIAssistantError {
  code: string;
  message: string;
  isRetryable?: boolean;
}

export type AIAssistantStatus = 'idle' | 'loading' | 'success' | 'error';