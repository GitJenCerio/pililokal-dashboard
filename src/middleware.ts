import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter: 10 attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries every 100 requests to prevent memory leak
let cleanupCounter = 0;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function middleware(req: NextRequest) {
  // Only rate-limit the credentials login endpoint
  if (req.nextUrl.pathname === '/api/auth/callback/credentials' && req.method === 'POST') {
    const ip = getClientIp(req);
    const now = Date.now();
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const MAX_ATTEMPTS = 10;

    // Cleanup stale entries periodically
    cleanupCounter++;
    if (cleanupCounter > 100) {
      cleanupCounter = 0;
      for (const [key, val] of Array.from(loginAttempts.entries())) {
        if (now > val.resetAt) loginAttempts.delete(key);
      }
    }

    const entry = loginAttempts.get(ip);
    if (entry && now < entry.resetAt) {
      if (entry.count >= MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(MAX_ATTEMPTS),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }
      entry.count++;
    } else {
      loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/:path*'],
};
