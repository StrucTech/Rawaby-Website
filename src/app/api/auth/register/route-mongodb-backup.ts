import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { User } from '@/models/User';
import { sendVerificationEmail } from '@/lib/mailer';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as Secret;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, phone, nationalId, password } = body;

    // تحقق من الحقول المطلوبة
    if (!name || !email || !phone || !nationalId || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
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
    const existingUser = await User.findOne({ $or: [ { email }, { phone }, { nationalId } ] });
    if (existingUser) {
      let errorMessage = 'المستخدم موجود مسبقاً';
      if (existingUser.email === email) errorMessage = 'البريد الإلكتروني مستخدم مسبقاً';
      else if (existingUser.phone === phone) errorMessage = 'رقم الجوال مستخدم مسبقاً';
      else if (existingUser.nationalId === nationalId) errorMessage = 'رقم الهوية مستخدم مسبقاً';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // توليد رمز التفعيل
    const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

    // إنشاء المستخدم
    const user = new User({
      name,
      email,
      phone,
      nationalId,
      password,
      active: false,
      emailVerified: false,
      emailVerificationToken: verificationToken,
    });
    await user.save();

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
      verificationUrl,
      emailError
    }, { status: 200 });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الحساب' }, { status: 500 });
  }
} 