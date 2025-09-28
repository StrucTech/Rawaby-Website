import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // حذف الملفات القديمة إن وجدت
    const { data: existingFiles } = await supabaseAdmin
      .storage
      .from('contracts')
      .list('templates');

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(file => `templates/${file.name}`);
      await supabaseAdmin
        .storage
        .from('contracts')
        .remove(filesToDelete);
    }

    // رفع الملفات الجديدة
    const { error: error1 } = await supabaseAdmin
      .storage
      .from('contracts')
      .upload('templates/contract1.docx', contract1Buffer, {
        contentType: contract1.type,
        upsert: true
      });

    const { error: error2 } = await supabaseAdmin
      .storage
      .from('contracts')
      .upload('templates/contract2.docx', contract2Buffer, {
        contentType: contract2.type,
        upsert: true
      });

    if (error1 || error2) {
      console.error('Error uploading contracts:', error1 || error2);
      return NextResponse.json({ error: 'حدث خطأ أثناء رفع العقود' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم رفع العقود بنجاح' });
  } catch (error) {
    console.error('Contract upload error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء رفع العقود' }, { status: 500 });
  }
} 