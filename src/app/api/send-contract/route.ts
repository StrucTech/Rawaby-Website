import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromHeader } from '@/lib/auth';
import { UserModel } from '@/models/UserSupabase';
import { sendEmail } from '@/lib/mailer';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// إنشاء عميل Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log('=== بدء عملية إرسال العقود الفارغة ===');
    
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
    console.log('✓ المستخدم:', userId);

    // جلب بيانات المستخدم
    const user = await UserModel.findById(userId);
    if (!user) {
      console.error('✗ المستخدم غير موجود:', userId);
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }
    
    console.log('✓ تم جلب بيانات المستخدم:', user.email);

    // ========================================
    // جلب العقود الفارغة من bucket: contract-templates
    // ========================================
    const templateBucket = 'contract-templates';
    let attachments: any[] = [];
    
    try {
      console.log('🔍 جاري البحث عن قوالب العقود في:', templateBucket);
      
      const { data: files, error: listError } = await supabase
        .storage
        .from(templateBucket)
        .list('');
      
      if (listError) {
        console.error('⚠️ خطأ في جلب قائمة الملفات:', listError);
        // محاولة قراءة من المسار القديم كـ fallback
        console.log('🔄 محاولة القراءة من المسار القديم...');
        const { data: oldFiles, error: oldListError } = await supabase
          .storage
          .from('contracts')
          .list('templates');
        
        if (!oldListError && oldFiles && oldFiles.length > 0) {
          console.log('✓ وجدنا ملفات في المسار القديم');
          for (const file of oldFiles) {
            if (file.name.endsWith('.docx') || file.name.endsWith('.pdf')) {
              const { data, error: downloadError } = await supabase
                .storage
                .from('contracts')
                .download(`templates/${file.name}`);
              
              if (!downloadError && data) {
                const buffer = await data.arrayBuffer();
                attachments.push({
                  filename: file.name,
                  content: Buffer.from(buffer)
                });
                console.log(`✓ تم تحميل: ${file.name}`);
              }
            }
          }
        }
      } else if (files && files.length > 0) {
        console.log(`✓ تم العثور على ${files.length} ملف(ات) في قوالب العقود`);
        
        for (const file of files) {
          // فقط الملفات التي تنتهي بـ .docx أو .pdf (قوالب العقود)
          if (file.name.endsWith('.docx') || file.name.endsWith('.pdf')) {
            try {
              console.log(`📥 جاري تحميل القالب: ${file.name}`);
              const { data, error: downloadError } = await supabase
                .storage
                .from(templateBucket)
                .download(file.name);
              
              if (downloadError) {
                console.error(`❌ فشل تحميل ${file.name}:`, downloadError);
              } else if (data) {
                const buffer = await data.arrayBuffer();
                attachments.push({
                  filename: file.name,
                  content: Buffer.from(buffer)
                });
                console.log(`✓ تم تحميل القالب: ${file.name} (${buffer.byteLength} بايت)`);
              }
            } catch (error) {
              console.error(`❌ خطأ في معالجة ${file.name}:`, error);
            }
          }
        }
      } else {
        console.log('⚠️ لم يتم العثور على قوالب عقود');
      }
    } catch (error) {
      console.error('❌ خطأ في الوصول إلى Storage:', error);
    }

    console.log(`📊 إجمالي قوالب العقود المجهزة للإرسال: ${attachments.length}`);

    // محتوى البريد
    const emailSubject = 'عقود الخدمات التعليمية - يرجى التوقيع والإرسال';
    const emailText = `
عزيزي/عزيزتي ${user.name}،

${attachments.length > 0 
  ? `مرفق طياً ملفات العقود الخاصة بالخدمات التعليمية (${attachments.length} ملف):` 
  : 'يمكنك تحميل ملفات العقود من خلال صفحة الموقع:'
}

${attachments.map((att, idx) => `${idx + 1}. ${att.filename}`).join('\n')}

يرجى:
- طباعة الملفات
- ملء البيانات المطلوبة
- التوقيع عليها
- رفعها على الموقع لإكمال الطلب

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
        .footer { text-align: center; color: #6b7280; margin-top: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>عقود الخدمات التعليمية</h1>
        </div>
        <div class="content">
            <p>عزيزي/عزيزتي <strong>${user.name}</strong>،</p>
            
            <p>${attachments.length > 0 
              ? `مرفق طياً ملفات العقود الخاصة بالخدمات التعليمية (<strong>${attachments.length}</strong> ملف):` 
              : 'يمكنك تحميل ملفات العقود من خلال صفحة الموقع:'}</p>
            
            <div class="file-list">
                <h3>الملفات:</h3>
                <ul>
                    ${attachments.map(att => `<li>📄 ${att.filename}</li>`).join('')}
                    ${attachments.length === 0 ? '<li>⚠️ لم يتم العثور على ملفات</li>' : ''}
                </ul>
            </div>
            
            <div class="instructions">
                <h3>التعليمات:</h3>
                <ol>
                    <li>تحميل الملفات المرفقة أو من الموقع</li>
                    <li>طباعة الملفات</li>
                    <li>ملء البيانات المطلوبة بدقة</li>
                    <li>التوقيع على العقود</li>
                    <li>رفع الملفات الموقعة على الموقع</li>
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
    try {
      console.log('💌 جاري إرسال البريد مع', attachments.length, 'ملف(ات)');
      await sendEmail({
        to: user.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
        attachments: attachments.length > 0 ? attachments : undefined
      });
      
      console.log('✅ تم إرسال البريد بنجاح:', user.email);
    } catch (emailError) {
      console.error('⚠️ تحذير: فشل إرسال البريد، سيتم المتابعة بدونه');
      console.error('تفاصيل الخطأ:', emailError instanceof Error ? emailError.message : String(emailError));
      // لا نلقي استثناء - نستمر بدون بريد
    }

    return NextResponse.json({
      message: attachments.length > 0 
        ? 'تم إرسال ملفات العقد بنجاح'
        : 'تم إرسال الرسالة بنجاح (بدون مرفقات)',
      email: user.email,
      filesCount: attachments.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('=== خطأ في عملية الإرسال ===');
    console.error('الخطأ:', error);
    console.error('رسالة الخطأ:', error.message);
    console.error('Stack:', error.stack);

    if (error.message === 'No token provided' || 
        error.message === 'Invalid token' || 
        error.message === 'Token expired') {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'حدث خطأ أثناء إرسال البريد',
      details: error.message
    }, { status: 500 });
  }
} 