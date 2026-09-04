-- Subscription fields are nullable so existing tenants remain active until an
-- administrator assigns a subscription end date.
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PAID');

ALTER TABLE "tenants"
  ADD COLUMN "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3),
  ADD COLUMN "subscriptionGraceEndsAt" TIMESTAMP(3),
  ADD COLUMN "subscriptionNoticeSentAt" TIMESTAMP(3),
  ADD COLUMN "subscriptionExpiredNoticeSentAt" TIMESTAMP(3);
