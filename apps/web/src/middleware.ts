import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Security headers
const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://epykihchzlbbptrvvawg.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // HTTP Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',

  // Cross-Origin policies
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
} as const;

// Rate limit configs by route pattern
const RATE_LIMIT_ROUTES = [
  { pattern: /^\/api\/auth/, type: 'auth' as const },
  { pattern: /^\/api\/webhooks/, type: 'api' as const },
  { pattern: /^\/api\/booking/, type: 'booking' as const },
  { pattern: /^\/api\/payment/, type: 'payment' as const },
  { pattern: /^\/admin\/api/, type: 'admin' as const },
  { pattern: /^\/api/, type: 'api' as const },
];

function matchRateLimitType(pathname: string): string | null {
  for (const { pattern, type } of RATE_LIMIT_ROUTES) {
    if (pattern.test(pathname)) {
      return type;
    }
  }
  return null;
}

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const nextResponse = NextResponse.next({ request });
  const url = new URL(request.url);

  // Add security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    nextResponse.headers.set(key, value);
  });

  // Apply rate limiting to API routes
  const rateLimitType = matchRateLimitType(url.pathname);
  if (rateLimitType) {
    // In a full implementation, we'd use a proper rate limiter here
    // For now, we'll rely on the API route handlers to enforce rate limits
  }

  return nextResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};
