import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/jwt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface UserPayload {
  userId: string;
  role: string;
}

// POST - المشرف أو الأدمن يرد على رسالة العميل
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(token) as UserPayload;
    if (!payload || (payload.role !== 'supervisor' && payload.role !== 'admin')) {
      return NextResponse.json({ error: 'غير مصرح - للمشرفين والأدمن فقط' }, { status: 403 });
    }

    const { requestId, replyMessage } = await request.json();

    if (!requestId || !replyMessage?.trim()) {
      return NextResponse.json({ error: 'معرف الطلب والرد مطلوبان' }, { status: 400 });
    }

    // جلب تفاصيل الطلب
    let query = supabase
      .from('data_requests')
      .select('*')
      .eq('id', requestId);

    // المشرف يرى طلباته فقط، الأدمن يرى الكل
    if (payload.role === 'supervisor') {
      query = query.eq('supervisor_id', payload.userId);
    }

    const { data: dataRequest, error: fetchError } = await query.single();

    if (fetchError || !dataRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود أو غير مصرح للوصول إليه' }, { status: 404 });
    }

    // السماح بالرد على الطلبات في أي حالة (pending أو responded)
    if (dataRequest.status === 'closed') {
      return NextResponse.json({ error: 'لا يمكن الرد على طلب مغلق' }, { status: 400 });
    }

    // تحديث الطلب برد المشرف
    const { data: updated, error: updateError } = await supabase
      .from('data_requests')
      .update({
        supervisor_reply: replyMessage,
        supervisor_replied_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'فشل في حفظ الرد' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال الرد بنجاح للعميل',
      request: updated
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
