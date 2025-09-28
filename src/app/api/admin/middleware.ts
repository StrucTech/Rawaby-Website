import { authMiddleware } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { User } from '@/models/User';

export async function middleware(request: NextRequest) {
  try {
    // First check authentication
    const authResponse = await authMiddleware(request);
    if (authResponse instanceof NextResponse) {
      return authResponse;
    }

    const user = request.user;
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'غير مصرح لك بالوصول' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is admin
    await connectDB();
    const adminUser = await User.findById(user.userId);
    
    if (!adminUser || adminUser.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'غير مصرح لك بالوصول' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return null;
  } catch (error) {
    console.error('Admin middleware error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'حدث خطأ أثناء التحقق من الصلاحيات' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export const config = {
  matcher: '/api/admin/:path*'
}; 