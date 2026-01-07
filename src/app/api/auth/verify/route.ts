import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      
      // التحقق من وجود المستخدم في قاعدة البيانات
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, active')
        .eq('id', payload.userId)
        .single();

      if (error || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (!user.active) {
        return NextResponse.json({ error: 'User account is disabled' }, { status: 403 });
      }

      return NextResponse.json({ 
        valid: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}