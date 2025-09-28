import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Simple in-memory store for rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

async function verifyToken(token: string): Promise<any | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Decode token to get user role
  const userData = token ? await verifyToken(token) : null;
  const userRole = userData?.role;

  // Protected routes configuration
  const protectedRoutes = {
    '/admin': ['admin'],
    '/supervisor': ['supervisor', 'admin'], // Admins can also access supervisor routes
    '/delegate-tasks': ['delegate', 'supervisor', 'admin'],
    '/services': ['user', 'supervisor', 'admin'],
    '/cart': ['user', 'supervisor', 'admin'],
    '/guardian-info': ['user', 'supervisor', 'admin'],
    '/contract': ['user', 'supervisor', 'admin'],
    '/payment': ['user', 'supervisor', 'admin'],
  };

  const isProtectedRoute = Object.keys(protectedRoutes).some(route => pathname.startsWith(route));
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

  // 1. Handling protected routes
  if (isProtectedRoute) {
    if (!userData) {
      // Not logged in, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check for role-based access
    const requiredRoles = Object.entries(protectedRoutes).find(([route]) => pathname.startsWith(route))?.[1];

    if (requiredRoles && !requiredRoles.includes(userRole)) {
      // Role not authorized, redirect to home or an unauthorized page
      return NextResponse.redirect(new URL('/', request.url));
    }

    // User is authenticated and authorized
    return NextResponse.next();
  }

  // 2. Handling auth routes for logged-in users
  if (isAuthRoute && userData) {
    // Redirect logged-in users away from auth pages
    let redirectUrl = '/';
    if (userRole === 'admin') redirectUrl = '/admin';
    else if (userRole === 'supervisor') redirectUrl = '/supervisor/dashboard';
    else if (userRole === 'delegate') redirectUrl = '/delegate-tasks';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
  
  // 3. Rate limiting for all other requests
  // Get client IP from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
  
  // Check rate limit
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  const requestData = rateLimit.get(ip) ?? { count: 0, resetTime: now };
  
  // Reset count if window has passed
  if (requestData.resetTime < windowStart) {
    requestData.count = 0;
    requestData.resetTime = now;
  }
  
  // Increment request count
  requestData.count++;
  rateLimit.set(ip, requestData);
  
  // Check if rate limit exceeded
  if (requestData.count > MAX_REQUESTS) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    );
  }

  // Get response
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 