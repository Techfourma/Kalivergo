import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  hasCmsAccessInTenant,
  hasPlatformRole,
  hasTenantMembership,
} from '@/shared/auth/authorization';
import { parseSessionCookie } from '@/shared/auth/session';
import { env } from '@/config/env';

function setNoStore(response: NextResponse): NextResponse {
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

async function resolveTenantFromPath(pathname: string): Promise<{
  tenantId: string;
  universitySlug: string;
  programSlug: string;
  classSlug: string;
  subscriptionGraceEndsAt: Date | null;
} | null> {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 1) return null;

  const [slug] = parts;
  const knownRoutes = ['api', 'auth', 'signup', 'login', 'platform', 'portofolio', 'verify-forgot-password', 'forgot-password', 'callback', 'terms', 'privacy', 'unauthorized', 'cms'];
  if (knownRoutes.includes(slug)) return null;

  try {
    const { prisma } = await import('@/lib/prisma');
    const tenant = await prisma.tenant.findFirst({
      where: {
        customSlug: slug,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        slug: true,
        university: { select: { slug: true } },
        program: { select: { slug: true } },
        subscriptionGraceEndsAt: true,
      },
    });

    return tenant
      ? {
          tenantId: tenant.id,
          universitySlug: tenant.university.slug,
          programSlug: tenant.program.slug,
          classSlug: tenant.slug,
          subscriptionGraceEndsAt: tenant.subscriptionGraceEndsAt,
        }
      : null;
  } catch (error) {
    console.error('Error resolving tenant from path:', error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next();
  }

  const tenantContext = await resolveTenantFromPath(pathname);

  let response: NextResponse;
  if (tenantContext) {
    response = NextResponse.next();
    response.cookies.set('kalivergo_tenant', JSON.stringify(tenantContext), {
      httpOnly: false,
      secure: env.nodeEnv === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });
  } else {
    response = NextResponse.next();
  }

  const isPlatformPath = pathname.startsWith('/platform');
  const isCmsPath = pathname.includes('/cms');

  const isTenantRoute = tenantContext !== null;

  const pathSegments = pathname.split('/').filter(Boolean);
  const isTenantLandingPath = isTenantRoute && pathSegments.length === 1;
  const isTenantPublicPath = isTenantLandingPath || pathname.includes('/portofolio');

  const isProtectedPath = isTenantRoute && !isTenantPublicPath;

  const sessionUser = parseSessionCookie(req.cookies.get('kalivergo_user')?.value);

  if (isPlatformPath) {
    if (pathname === '/platform/login' || pathname === '/platform/register') {
      return setNoStore(response);
    }

    const platformRole = sessionUser?.platformRole ?? null;
    if (hasPlatformRole(sessionUser)) {
      const isAdminKyc = platformRole === 'ADMIN_KYC';
      const isMemberManagementPage = pathname.includes('/members') || pathname.includes('/admin-kyc');
      if (isAdminKyc && isMemberManagementPage) {
        const url = req.nextUrl.clone();
        url.pathname = '/unauthorized';
        return setNoStore(NextResponse.redirect(url));
      }
      return setNoStore(response);
    }

    const url = req.nextUrl.clone();
    url.pathname = '/unauthorized';
    return setNoStore(NextResponse.redirect(url));
  }

  if (isCmsPath) {
    if (!sessionUser?.id) {
      const url = req.nextUrl.clone();
      url.pathname = '/unauthorized';
      return setNoStore(NextResponse.redirect(url));
    }

    const activeTenantId = tenantContext?.tenantId ?? null;
    if (hasCmsAccessInTenant(sessionUser, activeTenantId)) {
      return setNoStore(response);
    }

    const url = req.nextUrl.clone();
    url.pathname = '/unauthorized';
    return setNoStore(NextResponse.redirect(url));
  }
  if (isProtectedPath) {
    if (!sessionUser?.id) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return setNoStore(NextResponse.redirect(url));
    }

    if (tenantContext && !hasTenantMembership(sessionUser, tenantContext.tenantId)) {
      const url = req.nextUrl.clone();
      url.pathname = '/unauthorized';
      return setNoStore(NextResponse.redirect(url));
    }

    if (tenantContext?.subscriptionGraceEndsAt && tenantContext.subscriptionGraceEndsAt <= new Date()) {
      const url = req.nextUrl.clone();
      url.pathname = '/unauthorized';
      url.searchParams.set('reason', 'subscription-expired');
      return setNoStore(NextResponse.redirect(url));
    }

    return setNoStore(response);
  }

  return response;
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/platform',
    '/platform/:path*',
    '/cms',
    '/cms/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/profil',
    '/profil/:path*',
    '/home',
    '/home/:path*',
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};