import { authMiddleware } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: '/api/services/:path*'
}; 