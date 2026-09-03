import "server-only";
import { env } from "@/config/env";

export const AIAssistantConfig = {
  geminiApiKey: env.geminiApiKey?.trim(),

  geminiModel: env.geminiModel || "gemini-3.6-flash",

  groqApiKey: env.groqApiKey?.trim(),

  groqModel: env.groqModel || "openai/gpt-oss-120b",

  cerebrasApiKey: env.cerebrasApiKey?.trim(),

  cerebrasModel: env.cerebrasModel || "gpt-oss-120b",

  openRouterApiKey: env.openRouterApiKey?.trim(),

  openRouterModel: env.openRouterModel || "google/gemini-2.0-flash",

  knowledgeBaseDir: env.knowledgeBaseDir || "dataset",

  maxMessageLength: env.aiMaxInputChars,

  maxInputChars: env.aiMaxInputChars,

  maxHistoryMessages: env.aiMaxHistoryMessages,

  maxMemoriesInContext: env.aiMaxMemoriesInContext,

  generation: {
    maxOutputTokens: env.aiMaxOutputTokens,
    temperature: 0.3,
    topP: 0.8,
  },

  maxRetries: env.aiMaxRetries,

  requestTimeoutMs: env.aiRequestTimeoutMs,

  rateLimits: {
    perMinute: env.aiMaxRequestsPerMinute,
    perHour: env.aiMaxRequestsPerHour,
    maxQueue: env.aiMaxServerQueue,
  },

  mockMode: env.aiMockMode,

  providerOrder: ["groq", "cerebras", "gemini", "openrouter"] as const,
} as const;

export function isAIConfigured(): boolean {
  return Boolean(
    AIAssistantConfig.groqApiKey ||
      AIAssistantConfig.cerebrasApiKey ||
      AIAssistantConfig.geminiApiKey ||
      AIAssistantConfig.openRouterApiKey
  );
}

export function isProduction(): boolean {
  return env.nodeEnv === "production";
}
