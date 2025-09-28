import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/UserSupabase';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as Secret;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    function htmlMsg({ color, icon, title, msg, btnText, btnHref }: { color: string, icon: string, title: string, msg: string, btnText: string, btnHref: string }) {
      return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-50 min-h-screen flex items-center justify-center"><div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center"><div class="${color} mb-4">${icon}</div><h2 class="text-xl font-bold text-gray-900 mb-2">${title}</h2><p class="text-gray-600 mb-4">${msg}</p><a href="${btnHref}" class="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">${btnText}</a></div></body></html>`;
    }

    if (!token) {
      return new NextResponse(htmlMsg({
        color: 'text-red-500',
        icon: '<svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>',
        title: 'خطأ في التفعيل',
        msg: 'رمز التحقق مفقود',
        btnText: 'تسجيل الدخول',
        btnHref: '/login'
      }), { headers: { 'Content-Type': 'text/html' } });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      return new NextResponse(htmlMsg({
        color: 'text-red-500',
        icon: '<svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>',
        title: 'خطأ في التفعيل',
        msg: 'رمز التحقق غير صالح أو منتهي الصلاحية',
        btnText: 'تسجيل الدخول',
        btnHref: '/login'
      }), { headers: { 'Content-Type': 'text/html' } });
    }

    const { email } = payload;
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return new NextResponse(htmlMsg({
        color: 'text-red-500',
        icon: '<svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>',
        title: 'خطأ في التفعيل',
        msg: 'المستخدم غير موجود',
        btnText: 'تسجيل حساب جديد',
        btnHref: '/register'
      }), { headers: { 'Content-Type': 'text/html' } });
    }

    if (user.email_verified) {
      return new NextResponse(htmlMsg({
        color: 'text-blue-500',
        icon: '<svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
        title: 'الحساب مفعل بالفعل',
        msg: 'يمكنك الآن تسجيل الدخول',
        btnText: 'تسجيل الدخول',
        btnHref: '/login'
      }), { headers: { 'Content-Type': 'text/html' } });
    }

    if (user.email_verification_token !== token) {
      return new NextResponse(htmlMsg({
        color: 'text-red-500',
        icon: '<svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>',
        title: 'خطأ في التفعيل',
        msg: 'رمز التحقق غير صحيح',
        btnText: 'تسجيل الدخول',
        btnHref: '/login'
      }), { headers: { 'Content-Type': 'text/html' } });
    }

    // تفعيل الحساب
    await UserModel.update(user.id, {
      active: true,
      email_verified: true,
      email_verification_token: null,
    });

    return new NextResponse(htmlMsg({
      color: 'text-green-500',
      icon: '<svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>',
      title: 'تم تفعيل الحساب بنجاح! 🎉',
      msg: 'يمكنك الآن تسجيل الدخول والاستفادة من خدماتنا التعليمية',
      btnText: 'تسجيل الدخول',
      btnHref: '/login'
    }), { headers: { 'Content-Type': 'text/html' } });

  } catch (error: any) {
    console.error('Verification error:', error);
    
    // رسالة خطأ مخصصة حسب نوع الخطأ
    let errorMsg = 'حدث خطأ أثناء تفعيل الحساب';
    if (error.message?.includes('table "users" does not exist')) {
      errorMsg = 'خطأ في إعداد قاعدة البيانات';
    }
    
    return new NextResponse(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>خطأ في التفعيل</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-50 min-h-screen flex items-center justify-center"><div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center"><div class="text-red-500 mb-4"><svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg></div><h2 class="text-xl font-bold text-gray-900 mb-2">خطأ في التفعيل</h2><p class="text-gray-600 mb-4">${errorMsg}</p><a href="/login" class="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">تسجيل الدخول</a></div></body></html>`, { headers: { 'Content-Type': 'text/html' } });
  }
} 