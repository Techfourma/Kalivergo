import {
  getValidatedCurrentTenant,
  resolveTenantFromRoute,
  type TenantContext,
  type TenantRouteParams,
} from '@/server/tenant/context';

export type { TenantContext, TenantRouteParams } from '@/server/tenant/context';

export async function getCurrentTenant(
  params: TenantRouteParams
): Promise<TenantContext | null> {
  return resolveTenantFromRoute(params);
}

export async function getCurrentTenantForUser(
  userId?: string | null
): Promise<TenantContext | null> {
  return getValidatedCurrentTenant(userId);
}

export async function requireTenant(params: TenantRouteParams): Promise<TenantContext> {
  const tenant = await getCurrentTenant(params);
  if (!tenant) {
    throw new Error('Tenant context required. Please access via /[slug] route.');
  }
  return tenant;
}