import "server-only";
import { env } from "@/config/env";

export const AIAssistantConfig = {
  geminiApiKey: env.geminiApiKey?.trim(),

  geminiModel: env.geminiModel || "gemini-2.5-flash",

  knowledgeBaseDir: env.knowledgeBaseDir || "dataset",

  maxMessageLength: 2000,

  generation: {
    maxOutputTokens: env.aiMaxOutputTokens,
    temperature: 0.3,
    topP: 0.8,
  },

  maxRetries: 2,
} as const;

export function isAIConfigured(): boolean {
  return Boolean(AIAssistantConfig.geminiApiKey);
}

export function isProduction(): boolean {
  return env.nodeEnv === "production";
}