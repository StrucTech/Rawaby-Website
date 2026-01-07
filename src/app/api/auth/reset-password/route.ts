import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: 'الرمز وكلمة المرور الجديدة مطلوبان' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // التحقق من صحة الرمز
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      
      // التحقق من أن الرمز مخصص لإعادة تعيين كلمة المرور
      if (decoded.purpose !== 'password-reset') {
        return NextResponse.json(
          { message: 'رمز غير صالح' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { message: 'رمز غير صالح أو منتهي الصلاحية' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', decoded.userId)
      .eq('email', decoded.email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { message: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // تحديث كلمة المرور في قاعدة البيانات
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id);

    if (updateError) {
      console.error('خطأ في تحديث كلمة المرور:', updateError);
      return NextResponse.json(
        { message: 'حدث خطأ في تحديث كلمة المرور' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'تم تغيير كلمة المرور بنجاح' },
      { status: 200 }
    );

  } catch (error) {
    console.error('خطأ في إعادة تعيين كلمة المرور:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم. حاول مرة أخرى لاحقاً' },
      { status: 500 }
    );
  }
}
