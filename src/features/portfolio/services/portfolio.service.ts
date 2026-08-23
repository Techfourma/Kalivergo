import "server-only";

import {
  findPortfolioById,
  findPortfolioByUsername,
  findPortfolioByUsernameInTenant,
  updatePortfolio,
} from "@/features/portfolio/repositories/portfolio.repository";

export const portfolioFields = [
  "bio",
  "workExperience",
  "skills",
  "instagramUrl",
  "githubUrl",
  "linkedinUrl",
  "websiteUrl",
] as const;

export async function getPortfolio(input: {
  username?: string | null;
  userId?: string | null;
}) {
  if (input.username) return findPortfolioByUsername(input.username);
  if (input.userId) return findPortfolioById(input.userId);
  return null;
}

export function getPortfolioInTenant(
  username: string,
  tenant: { university: string; program: string; class: string }
) {
  return findPortfolioByUsernameInTenant(username, tenant);
}

export function buildPortfolioUpdate(input: Record<string, unknown>) {
  const data: Record<string, string | null | undefined> = {};
  for (const field of portfolioFields) {
    if (input[field] !== undefined) {
      const value = input[field];
      data[field] =
        typeof value === "string"
          ? value
          : value === null
            ? null
            : undefined;
    }
  }
  return data;
}

export function updatePortfolioForUser(
  userId: string,
  data: Record<string, string | null | undefined>
) {
  return updatePortfolio(userId, data);
}