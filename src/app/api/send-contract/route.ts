import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromHeader } from '@/lib/auth';
import { UserModel } from '@/models/UserSupabase';
import { sendEmail } from '@/lib/mailer';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    // التحقق من المصادقة
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      const jwt = require('jsonwebtoken');
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    } catch (error) {
      return NextResponse.json({ error: 'رمز المصادقة غير صحيح' }, { status: 401 });
    }

    const userId = payload.userId;
    console.log('Sending contract files to user:', userId);

    // جلب بيانات المستخدم
    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // مسارات الملفات
    const contractFile1 = path.join(process.cwd(), 'عقد_وتوكيل_خدمات_استشارية_تعليمية_2025.docx');
    const contractFile2 = path.join(process.cwd(), 'نموذج توكيل خاص الراوبى.docx');

    // التحقق من وجود الملفات
    if (!fs.existsSync(contractFile1) || !fs.existsSync(contractFile2)) {
      return NextResponse.json({ error: 'ملفات العقد غير موجودة' }, { status: 404 });
    }

    // قراءة الملفات
    const file1Buffer = fs.readFileSync(contractFile1);
    const file2Buffer = fs.readFileSync(contractFile2);

    // إعداد المرفقات
    const attachments = [
      {
        filename: 'عقد_وتوكيل_خدمات_استشارية_تعليمية_2025.docx',
        content: file1Buffer
      },
      {
        filename: 'نموذج_توكيل_خاص_الراوبى.docx',
        content: file2Buffer
      }
    ];

    // محتوى الإيميل
    const emailSubject = 'عقود الخدمات التعليمية - يرجى التوقيع والإرسال';
    const emailText = `
عزيزي/عزيزتي ${user.name}،

مرفق طياً ملفات العقود الخاصة بالخدمات التعليمية:

1. عقد وتوكيل خدمات استشارية تعليمية 2025
2. نموذج توكيل خاص الراوبى

يرجى:
- طباعة الملفين
- ملء البيانات المطلوبة
- التوقيع عليهما
- رفعهما على الموقع لإكمال الطلب

شكراً لكم لثقتكم بخدماتنا.

مع تحيات فريق الخدمات التعليمية
    `;

    const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; direction: rtl; text-align: right; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .file-list { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .instructions { background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; color: #6b7280; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>عقود الخدمات التعليمية</h1>
        </div>
        <div class="content">
            <p>عزيزي/عزيزتي <strong>${user.name}</strong>،</p>
            
            <p>مرفق طياً ملفات العقود الخاصة بالخدمات التعليمية:</p>
            
            <div class="file-list">
                <h3>الملفات المرفقة:</h3>
                <ul>
                    <li>📄 عقد وتوكيل خدمات استشارية تعليمية 2025</li>
                    <li>📄 نموذج توكيل خاص الراوبى</li>
                </ul>
            </div>
            
            <div class="instructions">
                <h3>التعليمات:</h3>
                <ol>
                    <li>طباعة الملفين المرفقين</li>
                    <li>ملء البيانات المطلوبة بدقة</li>
                    <li>التوقيع على العقود</li>
                    <li>رفع الملفين الموقعين على الموقع</li>
                    <li>إكمال عملية الدفع</li>
                </ol>
            </div>
            
            <p>شكراً لكم لثقتكم بخدماتنا.</p>
        </div>
        <div class="footer">
            <p>مع تحيات فريق الخدمات التعليمية</p>
            <p>للاستفسارات: info@educational-services.com</p>
        </div>
    </div>
</body>
</html>
    `;

    // إرسال الإيميل
    await sendEmail({
      to: user.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      attachments: attachments
    });

    console.log('Contract files sent successfully to:', user.email);

    return NextResponse.json({
      message: 'تم إرسال ملفات العقد بنجاح',
      email: user.email
    }, { status: 200 });

  } catch (error: any) {
    console.error('Send contract files error:', error);

    // معالجة أخطاء المصادقة
    if (error.message === 'No token provided' || 
        error.message === 'Invalid token' || 
        error.message === 'Token expired') {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'حدث خطأ أثناء إرسال ملفات العقد',
      details: error.message 
    }, { status: 500 });
  }
} 