import jwt from 'jsonwebtoken';

// JWT secret should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// Token payload interface
export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'supervisor' | 'delegate';
}

/**
 * Generate a JWT token
 * @param payload - The data to encode in the token
 * @returns The generated JWT token
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, { expiresIn: '7d' });
}

/**
 * Verify a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded token payload
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as jwt.Secret);
    if (!isTokenPayload(decoded)) {
      throw new Error('Invalid token payload');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Type guard for TokenPayload
 */
function isTokenPayload(decoded: any): decoded is TokenPayload {
  return (
    decoded &&
    typeof decoded === 'object' &&
    typeof decoded.userId === 'string' &&
    typeof decoded.email === 'string' &&
    (decoded.role === 'user' || decoded.role === 'admin' || decoded.role === 'supervisor' || decoded.role === 'delegate')
  );
}

/**
 * Middleware to verify JWT token from request headers
 * @param req - The request object
 * @returns The decoded token payload
 */
export function getTokenFromHeader(req: Request): TokenPayload {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.split(' ')[1];
  return verifyToken(token);
} 