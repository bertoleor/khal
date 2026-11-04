import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Default rate limit configurations by route type
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - very strict
  auth: {
    maxRequests: 5,
    windowSeconds: 60,
    keyPrefix: 'auth',
  },
  // Login/OTP endpoints - very strict
  login: {
    maxRequests: 5,
    windowSeconds: 60,
    keyPrefix: 'login',
  },
  // OTP verification
  verifyOtp: {
    maxRequests: 5,
    windowSeconds: 300,
    keyPrefix: 'verify',
  },
  // Booking endpoints
  booking: {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'booking',
  },
  // Admin endpoints
  admin: {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: 'admin',
  },
  // Payment endpoints
  payment: {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'payment',
  },
  // General API
  api: {
    maxRequests: 60,
    windowSeconds: 60,
    keyPrefix: 'api',
  },
} as const;

type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from session/cookies
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  return ip;
}

function getRateLimitKey(request: NextRequest, type: RateLimitType, userId?: string): string {
  const config = RATE_LIMIT_CONFIGS[type];
  const identifier = userId || getClientIdentifier(request);
  return config.keyPrefix + ':' + identifier;
}

export function checkRateLimit(
  request: NextRequest,
  type: RateLimitType,
  userId?: string
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[type];
  const key = getRateLimitKey(request, type, userId);
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

export function createRateLimitHeaders(result: RateLimitResult, config: typeof RATE_LIMIT_CONFIGS[keyof typeof RATE_LIMIT_CONFIGS]): HeadersInit {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };

  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

export function rateLimitMiddleware(
  request: NextRequest,
  type: RateLimitType,
  userId?: string
): NextResponse | null {
  const config = RATE_LIMIT_CONFIGS[type];
  const result = checkRateLimit(request, type, userId);

  if (!result.allowed) {
    const headers = createRateLimitHeaders(result, config);
    return NextResponse.json(
      {
        error: 'rate_limit_exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter,
      },
      { status: 429, headers }
    );
  }

  // Add rate limit headers to successful responses
  const headers = createRateLimitHeaders(result, config);
  const response = NextResponse.next();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// CSRF Protection
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getCsrfToken(request: NextRequest): string {
  // Try to get from cookie first
  const cookieToken = request.cookies.get('csrf_token')?.value;
  if (cookieToken) return cookieToken;

  // Generate new token
  return generateCsrfToken();
}

export function setCsrfTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export function validateCsrfToken(request: NextRequest): boolean {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  // Get token from header
  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf_token')?.value;

  if (!headerToken || !cookieToken) {
    return false;
  }

  // Constant-time comparison
  return timingSafeEqual(headerToken, cookieToken);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function csrfMiddleware(request: NextRequest): NextResponse | null {
  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      { error: 'csrf_invalid', message: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  return null;
}

// Helper to add CSRF token to form responses
export function withCsrfToken(formElement: string, token: string): string {
  return formElement.replace('<form', '<form><input type="hidden" name="_csrf" value="' + token + '" />');
}

// Reset function for testing
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

