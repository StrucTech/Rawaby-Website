import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================
// API لرفع قوالب العقود الفارغة (للأدمن فقط)
// يتم تخزينها في bucket: contract-templates
// =============================================

export async function POST(req: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // معالجة الملفات من FormData
    const formData = await req.formData();
    const contract1 = formData.get('contract1') as File;
    const contract2 = formData.get('contract2') as File;

    if (!contract1 || !contract2) {
      return NextResponse.json({ error: 'يجب رفع ملفي العقد' }, { status: 400 });
    }

    // تحويل الملفات إلى ArrayBuffer
    const contract1Buffer = await contract1.arrayBuffer();
    const contract2Buffer = await contract2.arrayBuffer();

    // =============================================
    // استخدام bucket: contract-templates للقوالب الفارغة
    // =============================================
    const templateBucket = 'contract-templates';

    // التحقق من وجود bucket القوالب وإنشاؤه إذا لم يكن موجوداً
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const existingBucket = buckets?.find(b => b.name === templateBucket);
    
    if (!existingBucket) {
      console.log('Creating contract-templates bucket...');
      const { error: bucketError } = await supabaseAdmin.storage.createBucket(templateBucket, {
        public: true, // عام - حتى يمكن إرسال الملفات للعملاء
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });
      
      if (bucketError) {
        console.error('Error creating templates bucket:', bucketError);
        return NextResponse.json({ error: 'فشل في إنشاء مساحة تخزين القوالب' }, { status: 500 });
      }
      console.log('✅ تم إنشاء bucket قوالب العقود');
    }

    // حذف الملفات القديمة إن وجدت
    const { data: existingFiles } = await supabaseAdmin
      .storage
      .from(templateBucket)
      .list('');

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(file => file.name);
      await supabaseAdmin
        .storage
        .from(templateBucket)
        .remove(filesToDelete);
      console.log('🗑️ تم حذف الملفات القديمة');
    }

    // تحديد امتداد الملفات
    const ext1 = contract1.name.split('.').pop() || 'docx';
    const ext2 = contract2.name.split('.').pop() || 'docx';

    // رفع الملفات الجديدة مباشرة في الـ bucket (بدون مجلد templates)
    const { error: error1 } = await supabaseAdmin
      .storage
      .from(templateBucket)
      .upload(`contract1.${ext1}`, contract1Buffer, {
        contentType: contract1.type,
        upsert: true
      });

    const { error: error2 } = await supabaseAdmin
      .storage
      .from(templateBucket)
      .upload(`contract2.${ext2}`, contract2Buffer, {
        contentType: contract2.type,
        upsert: true
      });

    if (error1 || error2) {
      console.error('Error uploading contracts:', error1 || error2);
      return NextResponse.json({ error: 'حدث خطأ أثناء رفع العقود' }, { status: 500 });
    }

    console.log('✅ تم رفع قوالب العقود بنجاح إلى:', templateBucket);

    return NextResponse.json({ 
      message: 'تم رفع قوالب العقود بنجاح',
      bucket: templateBucket,
      files: [`contract1.${ext1}`, `contract2.${ext2}`]
    });
  } catch (error) {
    console.error('Contract upload error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء رفع العقود' }, { status: 500 });
  }
} 