import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/UserSupabase';
import jwt, { Secret } from 'jsonwebtoken';
import { checkRateLimit, getClientIP, createRateLimitKey, rateLimitConfigs, clearRateLimit } from '@/lib/rateLimit';
import { sanitizeForDatabase, isValidEmail } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET as Secret;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');

export async function POST(req: NextRequest) {
  try {
    // Rate Limiting
    const clientIP = getClientIP(req);
    const rateLimitKey = createRateLimitKey(clientIP, 'login');
    const rateLimitResult = checkRateLimit(rateLimitKey, rateLimitConfigs.login);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    // تنظيف والتحقق من المدخلات
    const sanitizedEmail = sanitizeForDatabase(email?.toLowerCase()?.trim() || '');
    
    if (!sanitizedEmail || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صحيح' }, { status: 400 });
    }

    const user = await UserModel.findByEmail(sanitizedEmail);
    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    if (!user.active || !user.email_verified) {
      return NextResponse.json({ error: 'الحساب غير مفعل. يرجى تفعيل الحساب من خلال رابط التحقق المرسل إلى بريدك الإلكتروني.' }, { status: 403 });
    }

    // التحقق من حالة النشاط للمشرفين والمندوبين
    if (user.role === 'supervisor' || user.role === 'delegate') {
      // التحقق من active
      if (!user.active) {
        return NextResponse.json({ error: 'حسابك غير نشط. يرجى التواصل مع الإدارة لتفعيل الحساب.' }, { status: 403 });
      }
    }

    const isMatch = await UserModel.comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // مسح rate limit بعد تسجيل الدخول الناجح
    clearRateLimit(rateLimitKey);

    const token = jwt.sign({ 
      userId: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    const userResponse = { 
      _id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    };
    
    // إنشاء Response مع Cookie
    const response = NextResponse.json({ 
      message: 'تم تسجيل الدخول بنجاح', 
      user: userResponse, 
      token
    });

    // تعيين Cookie من جهة الخادم مع حماية SameSite
    // ملاحظة: نستخدم httpOnly: false لأن التطبيق يحتاج قراءة التوكن من JavaScript
    // الحماية تتم عبر SameSite: strict و secure في Production
    response.cookies.set('token', token, {
      httpOnly: false, // يجب أن يكون false لأن الكود يقرأ الـ cookie من JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // حماية من CSRF
      maxAge: 7 * 24 * 60 * 60, // 7 أيام بالثواني
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    
    // خطأ في قاعدة البيانات
    if (error.message?.includes('table "users" does not exist')) {
      return NextResponse.json({ 
        error: 'خطأ في إعداد قاعدة البيانات. يرجى التأكد من تنفيذ السكريپت SQL في Supabase.' 
      }, { status: 500 });
    }
    
    // Return detailed error for debugging
    const errorMessage = error.message || 'حدث خطأ أثناء تسجيل الدخول';
    const errorDetails = process.env.NODE_ENV === 'production'
      ? { error: errorMessage, details: error.toString(), stack: error.stack }
      : { error: 'حدث خطأ أثناء تسجيل الدخول' };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
} 