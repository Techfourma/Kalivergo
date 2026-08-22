import "server-only";
import { env } from "@/config/env";

export const AIAssistantConfig = {
 
  url: env.aiAssistantUrl || 'http://localhost:4000',

 
  timeoutMs: parseInt(env.aiAssistantTimeoutMs || '30000', 10),

  
  maxMessageLength: 2000,

  
  maxUserRetries: 3,
} as const;

export function validateAIAssistantConfig(): { valid: boolean; missing?: string[] } {
  if (typeof window !== 'undefined') {
   
    return { valid: true };
  }

  const missing: string[] = [];

  if (!env.aiAssistantUrl) {
    missing.push('AI_ASSISTANT_URL');
  }

  if (!env.aiAssistantSecret) {
    missing.push('AI_ASSISTANT_SECRET');
  }

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  };
}