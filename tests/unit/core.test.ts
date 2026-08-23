import assert from "node:assert/strict";
import test from "node:test";

import {
  hasCmsAccessInTenant,
  hasPlatformRole,
  hasTenantMembership,
  isCmsRole,
} from "@/shared/auth/authorization";
import { parseSessionCookie } from "@/shared/auth/session";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getDaysRemaining,
} from "@/lib/utils";
import { generateSlug } from "@/lib/tenant/resolve-tenant";
import { extractPublicIdFromUrl } from "@/lib/cloudinary";
import { buildPortfolioUpdate } from "@/features/portfolio/services/portfolio.service";
import { isUangKasName, UANG_KAS_AMOUNT } from "@/features/finance/validators/finance.utils";

test("authorization helpers enforce tenant and role boundaries", () => {
  const user = {
    id: "user-a",
    role: "MEMBER",
    platformRole: "ADMIN_KYC",
    memberships: [
      { tenantId: "tenant-a", role: "OWNER", cmsRole: null },
      { tenantId: "tenant-b", role: "MEMBER", cmsRole: null },
    ],
  };

  assert.equal(hasPlatformRole(user), true);
  assert.equal(hasPlatformRole(user, "SUPER_ADMIN_KYC"), false);
  assert.equal(hasTenantMembership(user, "tenant-a"), true);
  assert.equal(hasTenantMembership(user, "tenant-c"), false);
  assert.equal(hasCmsAccessInTenant(user, "tenant-a"), true);
  assert.equal(hasCmsAccessInTenant(user, "tenant-b"), false);
  assert.equal(isCmsRole("TREASURER"), true);
  assert.equal(isCmsRole("MEMBER"), false);
});

test("session cookies accept only JSON identities", () => {
  assert.equal(parseSessionCookie(undefined), null);
  assert.equal(parseSessionCookie("invalid"), null);
  assert.equal(parseSessionCookie(JSON.stringify({ name: "No ID" })), null);
  assert.deepEqual(parseSessionCookie(JSON.stringify({ id: "user-a", role: "MEMBER" })), {
    id: "user-a",
    role: "MEMBER",
  });
});

test("formatting utilities produce Indonesian output", () => {
  assert.equal(formatCurrency(10000), "Rp\u00a010.000");
  assert.match(formatDate("2024-01-10T00:00:00.000Z"), /2024/);
  assert.match(formatDateTime("2024-01-10T12:30:00.000Z"), /2024/);
});

test("deadline utility returns a useful future-day range", () => {
  const days = getDaysRemaining(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
  assert.ok(days >= 1 && days <= 3);
});

test("slug and Cloudinary helpers normalize supported inputs", () => {
  assert.equal(generateSlug("  Web Development & Design  "), "web-development-design");
  assert.equal(
    extractPublicIdFromUrl("https://res.cloudinary.com/demo/image/upload/v123/folder/avatar.jpg"),
    "folder/avatar"
  );
  assert.equal(extractPublicIdFromUrl("not-a-cloudinary-url"), null);
});

test("portfolio updates whitelist fields and preserve valid values", () => {
  assert.deepEqual(
    buildPortfolioUpdate({ bio: "Hello", githubUrl: null, skills: ["TypeScript"], ignored: "x" }),
    { bio: "Hello", githubUrl: null, skills: undefined }
  );
});

test("cash category helper is case-insensitive", () => {
  assert.equal(isUangKasName("UANG KAS Januari"), true);
  assert.equal(isUangKasName("Donasi"), false);
  assert.equal(UANG_KAS_AMOUNT, 10000);
});