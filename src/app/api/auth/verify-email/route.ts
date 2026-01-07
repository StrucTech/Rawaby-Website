import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/models/UserSupabase';
import jwt, { Secret } from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET as Secret;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    function htmlMsg({ color, icon, title, msg, btnText, btnHref }: { color: string, icon: string, title: string, msg: string, btnText: string, btnHref: string }) {
      return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 500px;
      width: 100%;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .icon {
      width: 60px;
      height: 60px;
      margin: 0 auto 15px;
      color: white;
    }
    .content {
      padding: 30px 20px;
      text-align: center;
    }
    h2 {
      font-size: 24px;
      color: #333;
      margin-bottom: 15px;
    }
    .message {
      font-size: 15px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 25px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    .success .header {
      background: linear-gradient(135deg, #34a853 0%, #1e8449 100%);
    }
    .success h2 {
      color: #34a853;
    }
    .error .header {
      background: linear-gradient(135deg, #ea4335 0%, #c5221f 100%);
    }
    .error h2 {
      color: #ea4335;
    }
    .info .header {
      background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%);
    }
    .info h2 {
      color: #4285f4;
    }
  </style>
</head>
<body>
  <div class="container" id="container">
    <div class="header">
      <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        ${icon}
      </svg>
    </div>
    <div class="content">
      <h2>${title}</h2>
      <p class="message">${msg}</p>
      <a href="${btnHref}" class="btn">${btnText}</a>
    </div>
  </div>
  <script>
    // تحديد نوع الرسالة تلقائياً
    const title = '${title}';
    const container = document.getElementById('container');
    if (title.includes('نجاح') || title.includes('مفعل')) {
      container.classList.add('success');
    } else if (title.includes('خطأ')) {
      container.classList.add('error');
    } else {
      container.classList.add('info');
    }
  </script>
</body>
</html>`;
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