import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { User } from '@/models/User';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as Secret;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    if (!user.active || !user.emailVerified) {
      return NextResponse.json({ error: 'الحساب غير مفعل. يرجى تفعيل الحساب من خلال رابط التحقق المرسل إلى بريدك الإلكتروني.' }, { status: 403 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const token = jwt.sign({ userId: user._id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const userResponse = { _id: user._id, name: user.name, email: user.email, role: user.role };
    return NextResponse.json({ message: 'تم تسجيل الدخول بنجاح', user: userResponse, token });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 });
  }
} 