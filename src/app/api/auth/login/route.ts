import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/UserSupabase';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as Secret;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    if (!user.active || !user.email_verified) {
      return NextResponse.json({ error: 'الحساب غير مفعل. يرجى تفعيل الحساب من خلال رابط التحقق المرسل إلى بريدك الإلكتروني.' }, { status: 403 });
    }

    const isMatch = await UserModel.comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

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
    
    return NextResponse.json({ 
      message: 'تم تسجيل الدخول بنجاح', 
      user: userResponse, 
      token 
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // خطأ في قاعدة البيانات
    if (error.message?.includes('table "users" does not exist')) {
      return NextResponse.json({ 
        error: 'خطأ في إعداد قاعدة البيانات. يرجى التأكد من تنفيذ السكريپت SQL في Supabase.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 });
  }
} 