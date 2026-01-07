import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log('Simple upload contracts API called');
    
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
    console.log('Processing simple upload for user:', userId);

    const formData = await req.formData();
    const contract1 = formData.get('contract1') as File;
    const contract2 = formData.get('contract2') as File;

    if (!contract1 || !contract2) {
      return NextResponse.json({ error: 'يجب رفع كلا الملفين' }, { status: 400 });
    }

    // التحقق من نوع الملفات
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    if (!allowedTypes.includes(contract1.type) || !allowedTypes.includes(contract2.type)) {
      return NextResponse.json({ 
        error: 'نوع الملف غير مدعوم. يرجى رفع ملفات PDF أو Word أو صور' 
      }, { status: 400 });
    }

    // التحقق من حجم الملفات (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (contract1.size > maxSize || contract2.size > maxSize) {
      return NextResponse.json({ 
        error: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت' 
      }, { status: 400 });
    }

    // محاكاة رفع الملفات بنجاح (بدون حفظ فعلي)
    console.log('Contract 1:', contract1.name, contract1.size, 'bytes');
    console.log('Contract 2:', contract2.name, contract2.size, 'bytes');

    // محاكاة تأخير معالجة
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Contracts uploaded successfully (simulated)');

    return NextResponse.json({
      message: 'تم رفع العقود بنجاح',
      contractId: `contract_${userId}_${Date.now()}`,
      files: {
        contract1: {
          url: `https://example.com/contracts/${userId}_contract1_${Date.now()}.${contract1.name.split('.').pop()}`,
          filename: contract1.name
        },
        contract2: {
          url: `https://example.com/contracts/${userId}_contract2_${Date.now()}.${contract2.name.split('.').pop()}`,
          filename: contract2.name
        }
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Upload contracts error:', error);

    return NextResponse.json({ 
      error: 'حدث خطأ أثناء رفع العقود',
      details: error.message 
    }, { status: 500 });
  }
}