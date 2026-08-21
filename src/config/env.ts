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
  get aiAssistantUrl(): string | undefined {
    return process.env.AI_ASSISTANT_URL;
  },
  get aiAssistantSecret(): string | undefined {
    return process.env.AI_ASSISTANT_SECRET;
  },
  get aiAssistantTimeoutMs(): string | undefined {
    return process.env.AI_ASSISTANT_TIMEOUT_MS;
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