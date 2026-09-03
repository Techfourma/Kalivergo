import { AIAssistantConfig } from "../config";
import { OpenAICompatibleProvider } from "./base";

export const openRouterProvider = new OpenAICompatibleProvider(
  "openrouter",
  {
    apiKey: AIAssistantConfig.openRouterApiKey,
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    model: AIAssistantConfig.openRouterModel,
    timeoutMs: AIAssistantConfig.requestTimeoutMs,
    maxRetries: AIAssistantConfig.maxRetries,
  }
);
