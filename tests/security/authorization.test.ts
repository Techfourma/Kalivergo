import assert from "node:assert/strict";
import test from "node:test";

import {
  hasCmsAccessInTenant,
  hasPlatformRole,
  hasTenantMembership,
} from "@/shared/auth/authorization";
import { parseSessionCookie } from "@/shared/auth/session";

test("tenant membership is scoped to the requested tenant", () => {
  const user = {
    id: "user-a",
    memberships: [{ tenantId: "tenant-a", role: "MEMBER" }],
  };

  assert.equal(hasTenantMembership(user, "tenant-a"), true);
  assert.equal(hasTenantMembership(user, "tenant-b"), false);
});

test("CMS access does not cross tenant boundaries", () => {
  const user = {
    id: "owner-a",
    memberships: [
      { tenantId: "tenant-a", role: "OWNER" },
      { tenantId: "tenant-b", role: "MEMBER", cmsRole: null },
    ],
  };

  assert.equal(hasCmsAccessInTenant(user, "tenant-a"), true);
  assert.equal(hasCmsAccessInTenant(user, "tenant-b"), false);
});

test("platform access requires an allowed platform role", () => {
  assert.equal(
    hasPlatformRole({ platformRole: "SUPER_ADMIN_KYC" }),
    true
  );
  assert.equal(hasPlatformRole({ platformRole: "MEMBER" }), false);
  assert.equal(hasPlatformRole(null), false);
});

test("session parsing rejects malformed or identity-less cookies", () => {
  assert.equal(parseSessionCookie(undefined), null);
  assert.equal(parseSessionCookie("not-json"), null);
  assert.equal(parseSessionCookie(JSON.stringify({ role: "OWNER" })), null);
  assert.deepEqual(parseSessionCookie(JSON.stringify({ id: "user-a" })), {
    id: "user-a",
  });
});