import type { AIProvider, ProviderContext } from "./types";
import { groqProvider } from "./groq";
import { cerebrasProvider } from "./cerebras";
import { geminiProvider } from "./gemini";
import { openRouterProvider } from "./openrouter";
import { AIAssistantConfig } from "../config";

export type { AIProvider, ProviderContext, Message } from "./types";
export { withTimeout, withStreamTimeout } from "./utils";

const PROVIDERS: Record<string, AIProvider> = {
  groq: groqProvider,
  cerebras: cerebrasProvider,
  gemini: geminiProvider,
  openrouter: openRouterProvider,
};

export function getProviderOrder(): AIProvider[] {
  return AIAssistantConfig.providerOrder
    .map((name) => PROVIDERS[name])
    .filter((p) => p && p.isConfigured()) as AIProvider[];
}

export function getActiveProviders(): AIProvider[] {
  return getProviderOrder();
}

export function isAnyProviderConfigured(): boolean {
  return getProviderOrder().length > 0;
}

function isFallbackError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("rate limit") ||
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("daily limit") ||
      msg.includes("monthly limit") ||
      msg.includes("503") ||
      msg.includes("unavailable") ||
      msg.includes("timeout") ||
      msg.includes("timed out") ||
      msg.includes("502") ||
      msg.includes("500") ||
      msg.includes("504") ||
      msg.includes("network") ||
      msg.includes("temporarily") ||
      msg.includes("404") ||
      msg.includes("model_not_found") ||
      msg.includes("does not exist") ||
      msg.includes("do not have access")
    ) {
      return true;
    }
  }
  return false;
}

export interface GenerationResult {
  response: string;
  provider: string;
  fallbackUsed: boolean;
  fallbackChain: string[];
}

export async function generateWithFallback(
  message: string,
  context: ProviderContext = {}
): Promise<GenerationResult> {
  const providers = getProviderOrder();

  if (providers.length === 0) {
    throw new Error("No AI provider is configured.");
  }

  let lastError: unknown;
  const fallbackChain: string[] = [];
  let isFirst = true;

  for (const provider of providers) {
    if (!isFirst) {
      fallbackChain.push(provider.name);
    }
    isFirst = false;

    try {
      console.info(`[AI] Provider: ${provider.name}`);
      const response = await provider.generateAnswer(message, context);
      if (response && response.trim().length > 0) {
        console.info(`[AI] ${provider.name} success`);
        return {
          response: response.trim(),
          provider: provider.name,
          fallbackUsed: fallbackChain.length > 0,
          fallbackChain,
        };
      }
      lastError = new Error(`Provider ${provider.name} returned empty response`);
    } catch (err) {
      lastError = err;
      console.warn(`[AI] ${provider.name} failed, trying next provider`);
      if (!isFallbackError(err)) {
        throw err;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All AI providers failed to generate a response.");
}

export interface StreamResultWithProvider {
  chunk: string;
  provider: string;
  fallbackUsed: boolean;
  fallbackChain: string[];
}

export async function* streamWithFallback(
  message: string,
  context: ProviderContext = {}
): AsyncGenerator<StreamResultWithProvider, void, void> {
  const providers = getProviderOrder();

  if (providers.length === 0) {
    throw new Error("No AI provider is configured.");
  }

  let lastError: unknown;
  const fallbackChain: string[] = [];
  let isFirst = true;

  for (const provider of providers) {
    if (!isFirst) {
      fallbackChain.push(provider.name);
    }
    isFirst = false;

    let hasYielded = false;
    try {
      console.info(`[AI] Provider: ${provider.name}`);
      for await (const chunk of provider.generateAnswerStream(message, context)) {
        hasYielded = true;
        yield {
          chunk,
          provider: provider.name,
          fallbackUsed: fallbackChain.length > 0,
          fallbackChain: [...fallbackChain],
        };
      }
      if (hasYielded) {
        console.info(`[AI] ${provider.name} stream success`);
        return;
      }
      lastError = new Error(`Provider ${provider.name} returned empty stream`);
    } catch (err) {
      lastError = err;
      console.warn(`[AI] ${provider.name} stream failed, trying next provider`);
      if (hasYielded) {
        return;
      }
      if (!isFallbackError(err)) {
        throw err;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All AI providers failed to stream a response.");
}
