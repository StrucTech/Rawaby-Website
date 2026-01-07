import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail } from '@/lib/mailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    // البحث عن المستخدم في قاعدة البيانات
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email.toLowerCase())
      .single();

    // حتى لو لم يكن المستخدم موجود، نرسل رسالة نجاح لمنع اكتشاف البريد الإلكتروني
    if (error || !user) {
      return NextResponse.json(
        { message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة تعيين كلمة المرور إليه' },
        { status: 200 }
      );
    }

    // إنشاء token لإعادة تعيين كلمة المرور (صالح لمدة ساعة واحدة)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // إرسال البريد الإلكتروني
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    await sendPasswordResetEmail(user.email, user.name, resetLink);

    return NextResponse.json(
      { message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة تعيين كلمة المرور إليه' },
      { status: 200 }
    );

  } catch (error) {
    console.error('خطأ في طلب إعادة تعيين كلمة المرور:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم. حاول مرة أخرى لاحقاً' },
      { status: 500 }
    );
  }
}
