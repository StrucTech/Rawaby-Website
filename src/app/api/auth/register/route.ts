import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/UserSupabase';
import { sendVerificationEmail } from '@/lib/mailer';
import jwt, { Secret } from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET as Secret;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');

// دالة التحقق من قوة كلمة المرور
const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
  const requirements = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  let score = 0;
  if (requirements.minLength) score++;
  if (requirements.hasUppercase) score++;
  if (requirements.hasLowercase) score++;
  if (requirements.hasNumbers) score++;
  if (requirements.hasSpecialChar) score++;

  if (score < 4) {
    const missing = [];
    if (!requirements.minLength) missing.push('12 حرف على الأقل');
    if (!requirements.hasUppercase) missing.push('حرف كبير واحد');
    if (!requirements.hasLowercase) missing.push('حرف صغير واحد');
    if (!requirements.hasNumbers) missing.push('رقم واحد');
    if (!requirements.hasSpecialChar) missing.push('حرف خاص واحد');

    return {
      valid: false,
      message: `كلمة المرور ضعيفة جداً. المتطلبات الناقصة: ${missing.join('، ')}`
    };
  }

  return { valid: true };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, nationalId, password } = body;

    // تحقق من الحقول المطلوبة
    if (!name || !email || !phone || !nationalId || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    // التحقق من قوة كلمة المرور
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
    }

    // تحقق من صحة البريد
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صحيح' }, { status: 400 });
    }

    // تحقق من رقم الهاتف المصري
    const egyptPattern = /^(01)[0-9]{9}$/;
    if (!egyptPattern.test(phone)) {
      return NextResponse.json({ error: 'رقم الجوال غير صحيح (يجب أن يكون مصري)' }, { status: 400 });
    }

    // تحقق من الرقم القومي
    const nationalIdRegex = /^[0-9]{14}$/;
    if (!nationalIdRegex.test(nationalId)) {
      return NextResponse.json({ error: 'الرقم القومي المصري غير صحيح (14 رقم)' }, { status: 400 });
    }

    // تحقق من عدم وجود المستخدم مسبقًا
    const existingUserByEmail = await UserModel.findByEmail(email);
    if (existingUserByEmail) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم مسبقاً' }, { status: 400 });
    }

    // تحقق من رقم الجوال والهوية
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabase');
      const supabaseAdmin = getSupabaseAdmin();
      
      const { data: existingPhone } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', phone)
        .single();
      
      if (existingPhone) {
        return NextResponse.json({ error: 'رقم الجوال مستخدم مسبقاً' }, { status: 400 });
      }

      const { data: existingNationalId } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('national_id', nationalId)
        .single();
      
      if (existingNationalId) {
        return NextResponse.json({ error: 'رقم الهوية مستخدم مسبقاً' }, { status: 400 });
      }
    } catch (error: any) {
      // إذا لم يتم العثور على المستخدم، فهذا جيد
      if (!error.message?.includes('PGRST116')) {
        console.error('Database check error:', error);
      }
    }

    // توليد رمز التفعيل
    const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

    // إنشاء المستخدم
    const user = await UserModel.create({
      name,
      email,
      phone,
      national_id: nationalId,
      password,
      active: false,
      email_verified: false,
      email_verification_token: verificationToken,
    });

    // إرسال الإيميل (أو تجاهل الخطأ)
    let emailError = null;
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'خطأ غير معروف في إرسال البريد';
      console.error('Email sending error:', err);
    }

    return NextResponse.json({
      message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.',
      verificationUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${verificationToken}`,
      emailError
    }, { status: 200 });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // خطأ في قاعدة البيانات
    if (error.message?.includes('table "users" does not exist')) {
      return NextResponse.json({ 
        error: 'خطأ في إعداد قاعدة البيانات. يرجى التأكد من تنفيذ السكريپت SQL في Supabase.' 
      }, { status: 500 });
    }
    
    // Return detailed error in development/production for debugging
    const errorMessage = error.message || 'حدث خطأ أثناء إنشاء الحساب';
    const errorDetails = process.env.NODE_ENV === 'production' 
      ? { error: errorMessage, details: error.toString() }
      : { error: 'حدث خطأ أثناء إنشاء الحساب' };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
} 