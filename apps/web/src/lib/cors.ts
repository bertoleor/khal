import { NextResponse, type NextRequest } from 'next/server';

/**
 * CORS configuration for API routes.
 * Explicit allowlist for origins, methods, and headers.
 */

// Allowed origins - configured via env var or defaults
function getAllowedOrigins(): string[] {
  const env = process.env.CORS_ALLOWED_ORIGINS;
  if (env) {
    return env.split(',').map((o) => o.trim()).filter(Boolean);
  }
  // Default: same-origin only (no CORS)
  return [];
}

// CORS headers to apply
const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
} as const;

/**
 * Handles CORS preflight (OPTIONS) requests.
 * Returns a 204 response with CORS headers if origin is allowed.
 */
export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();

  // If no allowed origins configured, deny CORS (same-origin only)
  if (allowedOrigins.length === 0) {
    return null;
  }

  // Check if origin is allowed
  const isAllowed = allowedOrigins.includes(origin);
  if (!isAllowed) {
    return null;
  }

  // Return preflight response
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', origin);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Applies CORS headers to an existing response.
 * Call this after your route handler logic.
 */
export function applyCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();

  // If no allowed origins configured, don't add CORS headers (same-origin only)
  if (allowedOrigins.length === 0) {
    return response;
  }

  // Check if origin is allowed
  const isAllowed = origin && allowedOrigins.includes(origin);
  if (!isAllowed) {
    return response;
  }

  response.headers.set('Access-Control-Allow-Origin', origin!);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Wrapper for API route handlers that automatically handles CORS.
 * Usage:
 *   export const GET = withCors(async (request) => { ... });
 *   export const POST = withCors(async (request) => { ... });
 */
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      const preflight = handleCorsPreflight(request);
      if (preflight) return preflight;
    }

    // Call the actual handler
    const response = await handler(request);

    // Apply CORS headers to the response
    return applyCorsHeaders(response, request);
  };
}
