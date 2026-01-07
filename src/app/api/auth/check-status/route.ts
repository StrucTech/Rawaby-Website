import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - التحقق من حالة نشاط المستخدم
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ active: false, error: 'غير مصرح' }, { status: 401 });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (error) {
      return NextResponse.json({ active: false, error: 'رمز غير صالح' }, { status: 401 });
    }

    // جلب بيانات المستخدم
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role, is_active, active_from, active_to')
      .eq('id', payload.userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ active: false, error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // المشرفين والمندوبين فقط يحتاجون التحقق من حالة النشاط
    if (user.role !== 'supervisor' && user.role !== 'delegate') {
      return NextResponse.json({ active: true });
    }

    // التحقق من is_active
    if (user.is_active === false) {
      return NextResponse.json({ 
        active: false, 
        reason: 'disabled',
        message: 'حسابك غير نشط. يرجى التواصل مع الإدارة لتفعيل الحساب.' 
      });
    }

    // التحقق من المدى التاريخي
    const now = new Date();
    
    if (user.active_from && new Date(user.active_from) > now) {
      return NextResponse.json({ 
        active: false, 
        reason: 'not_started',
        message: 'حسابك غير نشط بعد. سيتم تفعيله في التاريخ المحدد.',
        active_from: user.active_from
      });
    }

    if (user.active_to && new Date(user.active_to) < now) {
      return NextResponse.json({ 
        active: false, 
        reason: 'expired',
        message: 'انتهت فترة نشاط حسابك. يرجى التواصل مع الإدارة.',
        active_to: user.active_to
      });
    }

    return NextResponse.json({ active: true });

  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json({ active: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
