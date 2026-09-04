export type PlatformRole = "SUPER_ADMIN_KYC" | "ADMIN_KYC";

export type TenantRole = "OWNER" | "MEMBER";

export type CmsRole =
  | "PRESIDENT"
  | "VICE_PRESIDENT"
  | "TREASURER"
  | "VICE_TREASURER"
  | "SECRETARY";

export type TenantStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type SubscriptionPlan = "FREE" | "PAID";

export type OwnerApplicationStatus =
  | "PENDING_EMAIL"
  | "PENDING_KYC"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type KycDecision = "APPROVED" | "REJECTED";

export interface University {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyProgram {
  id: string;
  universityId: string;
  name: string;
  slug: string;
  university: University;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  universityId: string;
  programId: string;
  name: string;
  slug: string;
  status: TenantStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionEndsAt: Date | null;
  subscriptionGraceEndsAt: Date | null;
  university: University;
  program: StudyProgram;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantMembership {
  id: string;
  userId: string;
  tenantId: string;
  role: TenantRole;
  cmsRole?: CmsRole | null; 
  user: User;
  tenant: Tenant;
  createdAt: Date;
}

export interface OwnerApplication {
  id: string;
  userId: string;
  tenantId: string | null;
  universityName: string;
  programName: string;
  className: string;
  selfieStorageKey: string;
  status: OwnerApplicationStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  user: User;
  tenant: Tenant | null;
  reviews: KycReview[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KycReview {
  id: string;
  applicationId: string;
  adminUserId: string;
  decision: KycDecision;
  reason: string;
  createdAt: Date;
  application: OwnerApplication;
}

export interface AuditLog {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  password: string | null;
  nim: string | null;
  platformRole: PlatformRole | null;
  image: string | null;
  isVerified: boolean;
  bio: string | null;
  workExperience: string | null;
  skills: string | null;
  instagramUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  address: string | null;
  phone: string | null;
  ktpStorageKey: string | null;
  kycStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  tenantMemberships: TenantMembership[];
  ownerApplications: OwnerApplication[];
  cashPayments: any[];
  submissions: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantContext {
  tenantId: string;
  universitySlug: string;
  programSlug: string;
  classSlug: string;
}

export interface TenantWithMembership extends Tenant {
  membership: TenantMembership;
}