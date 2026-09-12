import { routing } from '@/i18n/routing';
import { getRole } from '@/lib/auth';
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

const handleI18nRouting = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const role = getRole(request);
  if (role !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/admin/:path*'],
};
