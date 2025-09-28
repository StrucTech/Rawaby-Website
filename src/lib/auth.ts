import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt, { Secret } from 'jsonwebtoken';
import { IUser } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET as Secret;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// Extend NextRequest to include user
declare module 'next/server' {
  interface NextRequest {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}

// Define the token payload interface
export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

/**
 * Verify a JWT token and return its payload
 * @param token - The JWT token to verify
 * @returns The decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Type guard to ensure decoded token matches our payload interface
    if (!isTokenPayload(decoded)) {
      throw new Error('Invalid token payload');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Type guard to check if decoded token matches our payload interface
 */
function isTokenPayload(decoded: any): decoded is TokenPayload {
  return (
    decoded &&
    typeof decoded === 'object' &&
    typeof decoded.userId === 'string' &&
    typeof decoded.email === 'string' &&
    (decoded.role === 'user' || decoded.role === 'admin')
  );
}

/**
 * Middleware to verify JWT token from request headers
 * @param req - The request object
 * @returns The decoded token payload
 * @throws Error if no token provided or token is invalid
 */
export function getTokenFromHeader(req: Request): TokenPayload {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

export async function authMiddleware(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'غير مصرح لك بالوصول' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'غير مصرح لك بالوصول' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return new NextResponse(
        JSON.stringify({ error: 'غير مصرح لك بالوصول' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Add user to request
    request.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    // Continue to the API route
    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'غير مصرح لك بالوصول' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Helper function to check if user is admin
export function isAdmin(user: { role: string }): boolean {
  return user.role === 'admin';
}

// Helper function to check if user is the owner of the resource
export function isOwner(user: { userId: string }, resourceUserId: string): boolean {
  return user.userId === resourceUserId;
} 