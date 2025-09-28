import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    if (!name || (name !== 'contract1.docx' && name !== 'contract2.docx')) {
      return NextResponse.json({ error: 'اسم الملف غير صحيح' }, { status: 400 });
    }

    // تحميل الملف من Supabase Storage
    const { data: fileData, error } = await supabaseAdmin
      .storage
      .from('contracts')
      .download(`templates/${name}`);

    if (error || !fileData) {
      console.error('Error downloading contract:', error);
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
    }

    // تحويل البيانات إلى ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${name}"`
      }
    });
  } catch (error) {
    console.error('Download contract error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحميل الملف' }, { status: 500 });
  }
} 