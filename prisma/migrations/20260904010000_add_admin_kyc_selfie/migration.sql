-- Selfie storage key for platform admin KYC registrations.
-- The selfie is synced to the user profile image (User.image) upon approval.
ALTER TABLE "users" ADD COLUMN "selfieStorageKey" TEXT;
