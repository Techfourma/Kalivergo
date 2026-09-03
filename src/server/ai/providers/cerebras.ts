import { AIAssistantConfig } from "../config";
import { OpenAICompatibleProvider } from "./base";

export const cerebrasProvider = new OpenAICompatibleProvider(
  "cerebras",
  {
    apiKey: AIAssistantConfig.cerebrasApiKey,
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
    model: AIAssistantConfig.cerebrasModel,
    timeoutMs: AIAssistantConfig.requestTimeoutMs,
    maxRetries: AIAssistantConfig.maxRetries,
  }
);
