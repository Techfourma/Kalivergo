import { AIAssistantConfig } from "../config";
import { OpenAICompatibleProvider } from "./base";

export const groqProvider = new OpenAICompatibleProvider(
  "groq",
  {
    apiKey: AIAssistantConfig.groqApiKey,
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: AIAssistantConfig.groqModel,
    timeoutMs: AIAssistantConfig.requestTimeoutMs,
    maxRetries: AIAssistantConfig.maxRetries,
  }
);
