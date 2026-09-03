export type Message = { role: "user" | "assistant"; content: string };

export interface ProviderContext {
  knowledge?: string;
  history?: Message[];
}

export type GeminiContext = ProviderContext;

export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateAnswer(_message: string, _context: ProviderContext): Promise<string>;
  generateAnswerStream(_message: string, _context: ProviderContext): AsyncGenerator<string>;
}

export interface OpenAICompatibleConfig {
  apiKey: string | undefined;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
}
