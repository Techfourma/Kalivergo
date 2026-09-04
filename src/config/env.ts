import "server-only";

export const env = {
  get nodeEnv(): "development" | "production" | "test" {
    const value = process.env.NODE_ENV;
    return value === "production" || value === "test" ? value : "development";
  },
  get nextAuthSecret(): string | undefined {
    return process.env.NEXTAUTH_SECRET;
  },
  get nextAuthUrl(): string | undefined {
    return process.env.NEXTAUTH_URL;
  },
  get baseUrl(): string | undefined {
    return process.env.NEXT_PUBLIC_BASE_URL ?? process.env.APP_URL;
  },
  get platformAdminRegistrationCode(): string | undefined {
    return process.env.PLATFORM_ADMIN_REGISTRATION_CODE;
  },
  get superAdminSecretKey(): string | undefined {
    return process.env.SUPER_ADMIN_SECRET_KEY;
  },
  get cloudinaryCloudName(): string | undefined {
    return process.env.CLOUDINARY_CLOUD_NAME;
  },
  get geminiApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  },
  get geminiModel(): string | undefined {
    return process.env.GEMINI_MODEL;
  },
  get groqApiKey(): string | undefined {
    return process.env.GROQ_API_KEY;
  },
  get groqModel(): string | undefined {
    return process.env.GROQ_MODEL;
  },
  get cerebrasApiKey(): string | undefined {
    return process.env.CEREBBRAS_API_KEY;
  },
  get cerebrasModel(): string | undefined {
    return process.env.CEREBBRAS_MODEL;
  },
  get openRouterApiKey(): string | undefined {
    return process.env.OPENROUTER_API_KEY;
  },
  get openRouterModel(): string | undefined {
    return process.env.OPENROUTER_MODEL;
  },
  get knowledgeBaseDir(): string | undefined {
    return process.env.KNOWLEDGE_BASE_DIR;
  },
  get aiMaxOutputTokens(): number {
    const value = Number(process.env.AI_MAX_OUTPUT_TOKENS);
    return Number.isFinite(value) && value > 0 ? value : 3000;
  },
  get aiMaxInputChars(): number {
    const value = Number(process.env.AI_MAX_INPUT_CHARS);
    return Number.isFinite(value) && value > 0 ? value : 6000;
  },
  get aiMaxHistoryMessages(): number {
    const value = Number(process.env.AI_MAX_HISTORY_MESSAGES);
    return Number.isFinite(value) && value > 0 ? value : 6;
  },
  get aiMaxMemoriesInContext(): number {
    const value = Number(process.env.AI_MAX_MEMORIES_IN_CONTEXT);
    return Number.isFinite(value) && value > 0 ? value : 5;
  },
  get aiMaxRequestsPerMinute(): number {
    const value = Number(process.env.AI_MAX_REQUESTS_PER_MINUTE);
    return Number.isFinite(value) && value > 0 ? value : 5;
  },
  get aiMaxRequestsPerHour(): number {
    const value = Number(process.env.AI_MAX_REQUESTS_PER_HOUR);
    return Number.isFinite(value) && value > 0 ? value : 30;
  },
  get aiMaxServerQueue(): number {
    const value = Number(process.env.AI_MAX_SERVER_QUEUE);
    return Number.isFinite(value) && value > 0 ? value : 2;
  },
  get aiMaxRetries(): number {
    const value = Number(process.env.AI_MAX_RETRIES);
    return Number.isFinite(value) && value >= 0 ? value : 2;
  },
  get aiRequestTimeoutMs(): number {
    const value = Number(process.env.AI_REQUEST_TIMEOUT_MS);
    return Number.isFinite(value) && value > 0 ? value : 60000;
  },
  get aiMockMode(): boolean {
    return process.env.AI_MOCK_MODE === "true";
  },
  get brevoApiKey(): string | undefined {
    return process.env.BREVO_API_KEY;
  },
  get emailFrom(): string | undefined {
    return process.env.EMAIL_FROM;
  },
  get smtpUser(): string | undefined {
    return process.env.SMTP_USER;
  },
  get databaseUrl(): string | undefined {
    return process.env.DATABASE_URL;
  },
  get cronSecret(): string | undefined {
    return process.env.CRON_SECRET;
  },
  get nextPublicBaseUrl(): string | undefined {
    return process.env.NEXT_PUBLIC_BASE_URL;
  },
  get cloudinaryApiKey(): string | undefined {
    return process.env.CLOUDINARY_API_KEY;
  },
  get cloudinaryApiSecret(): string | undefined {
    return process.env.CLOUDINARY_API_SECRET;
  },
};