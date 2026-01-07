import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

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
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    } catch (error) {
      return NextResponse.json({ error: 'رمز المصادقة غير صحيح' }, { status: 401 });
    }

    const userId = payload.userId;
    const userEmail = payload.email;
    console.log('Sending contract files to user:', userId, userEmail);

    // محاكاة إرسال الإيميل
    console.log('Simulating email send to:', userEmail);
    
    // محاكاة تأخير الإرسال
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Contract files sent successfully (simulated)');

    return NextResponse.json({
      message: 'تم إرسال ملفات العقد بنجاح',
      email: userEmail,
      files: [
        'عقد_وتوكيل_خدمات_استشارية_تعليمية_2025.docx',
        'نموذج توكيل خاص الراوبى.docx'
      ]
    }, { status: 200 });

  } catch (error: any) {
    console.error('Send contract error:', error);

    return NextResponse.json({ 
      error: 'حدث خطأ في إرسال العقود',
      details: error.message 
    }, { status: 500 });
  }
}