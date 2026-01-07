import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - جلب طلبات البيانات لطلب معين
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
    }

    const { id: orderId } = await params;

    // جلب طلبات البيانات مع معلومات المشرف والعميل
    const { data: requests, error } = await supabase
      .from('data_requests')
      .select(`
        *,
        supervisor:users!data_requests_supervisor_id_fkey(id, name, email),
        client:users!data_requests_client_id_fkey(id, name, email)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data requests:', error);
      return NextResponse.json({ error: 'خطأ في جلب الطلبات' }, { status: 500 });
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// POST - إنشاء طلب بيانات جديد (المشرف فقط)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'supervisor' && payload.role !== 'admin')) {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحية مشرف' }, { status: 403 });
    }

    const { id: orderId } = await params;
    const { message } = await request.json();

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'الرسالة مطلوبة' }, { status: 400 });
    }

    // جلب معلومات الطلب للحصول على client_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('client_id, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // إنشاء طلب البيانات
    const { data: newRequest, error: createError } = await supabase
      .from('data_requests')
      .insert({
        order_id: orderId,
        supervisor_id: payload.userId,
        client_id: order.client_id,
        message: message.trim(),
        status: 'pending'
      })
      .select(`
        *,
        supervisor:users!data_requests_supervisor_id_fkey(id, name, email),
        client:users!data_requests_client_id_fkey(id, name, email)
      `)
      .single();

    if (createError) {
      console.error('Error creating data request:', createError);
      return NextResponse.json({ error: 'خطأ في إنشاء الطلب' }, { status: 500 });
    }

    // تحديث حالة الطلب إلى "بانتظار رد العميل"
    await supabase
      .from('orders')
      .update({ status: 'بانتظار رد العميل' })
      .eq('id', orderId);

    return NextResponse.json({ 
      message: 'تم إرسال طلب البيانات بنجاح',
      request: newRequest 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
