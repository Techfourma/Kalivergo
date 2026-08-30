import assert from "node:assert/strict";
import test from "node:test";

import { registerSchema, loginSchema, resetPasswordSchema } from "@/features/auth/validators/auth.schema";
import { createSeminarSchema } from "@/features/seminar/validators/seminar.schema";
import {
  ownerApplicationSchema,
  kycReviewSchema,
  validateSelfieFile,
  MAX_SELFIE_SIZE,
} from "@/lib/kyc/validation";

test("auth schemas validate credentials and matching passwords", () => {
  assert.equal(registerSchema.safeParse({
    fullName: "Test User",
    nim: "12345",
    email: "user@example.com",
    password: "secret1",
    confirmPassword: "secret1",
  }).success, true);

  assert.equal(registerSchema.safeParse({
    fullName: "Test User",
    nim: "12345",
    email: "bad-email",
    password: "secret1",
    confirmPassword: "different",
  }).success, false);

  assert.equal(loginSchema.safeParse({ nim: "12345", password: "secret1" }).success, true);
  assert.equal(resetPasswordSchema.safeParse({
    nim: "12345",
    email: "user@example.com",
    newPassword: "secret1",
    confirmPassword: "secret1",
  }).success, true);
});

test("seminar schema coerces valid dates and rejects missing fields", () => {
  const result = createSeminarSchema.safeParse({
    title: "Tech Talk",
    description: "A useful talk",
    date: "2026-08-19",
    location: "Room A",
  });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.date instanceof Date, true);
  assert.equal(createSeminarSchema.safeParse({ title: "", description: "", date: "bad", location: "" }).success, false);
});

test("seminar schema accepts valid/empty url and rejects invalid url", () => {
  const base = {
    title: "Tech Talk",
    description: "A useful talk",
    date: "2026-08-19",
    location: "Room A",
  };

  const validUrl = createSeminarSchema.safeParse({ ...base, url: "https://zoom.us/j/123456789" });
  assert.equal(validUrl.success, true);
  if (validUrl.success) assert.equal(validUrl.data.url, "https://zoom.us/j/123456789");

  const emptyUrl = createSeminarSchema.safeParse({ ...base, url: "" });
  assert.equal(emptyUrl.success, true);
  if (emptyUrl.success) assert.equal(emptyUrl.data.url, undefined);

  const missingUrl = createSeminarSchema.safeParse({ ...base });
  assert.equal(missingUrl.success, true);

  const invalidUrl = createSeminarSchema.safeParse({ ...base, url: "bukan-url" });
  assert.equal(invalidUrl.success, false);
});

test("KYC review schema validates decisions and reason length", () => {
  assert.equal(kycReviewSchema.safeParse({
    applicationId: "clh1234567890123456789012",
    decision: "APPROVED",
    reason: "Documents were verified successfully",
  }).success, true);
  assert.equal(kycReviewSchema.safeParse({
    applicationId: "bad",
    decision: "WAITING",
    reason: "short",
  }).success, false);
});

test("selfie validation enforces type and size limits", () => {
  const valid = new File(["image"], "selfie.jpg", { type: "image/jpeg" });
  const invalidType = new File(["image"], "selfie.gif", { type: "image/gif" });
  const tooLarge = new File([new Uint8Array(MAX_SELFIE_SIZE + 1)], "large.jpg", { type: "image/jpeg" });

  assert.deepEqual(validateSelfieFile(valid), { valid: true });
  assert.equal(validateSelfieFile(invalidType).valid, false);
  assert.equal(validateSelfieFile(tooLarge).valid, false);
});

test("owner application schema requires matching credentials and a selfie", () => {
  const base = {
    fullName: "Owner User",
    email: "owner@example.com",
    password: "secret1",
    confirmPassword: "secret1",
    nim: "12345",
    universityName: "University",
    programName: "Computer Science",
    className: "Class A",
    selfieFile: new File(["image"], "selfie.jpg", { type: "image/jpeg" }),
  };

  assert.equal(ownerApplicationSchema.safeParse(base).success, true);
  assert.equal(ownerApplicationSchema.safeParse({ ...base, confirmPassword: "wrong" }).success, false);
});