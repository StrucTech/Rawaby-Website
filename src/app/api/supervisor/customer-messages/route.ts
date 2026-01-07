import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - عرض الرسائل مع العملاء
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(authToken);
    if (!payload || payload.role !== 'supervisor') {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحية مشرف' }, { status: 403 });
    }

    const supervisorId = payload.userId;

    // جلب جميع الرسائل للمشرف مع بيانات المستخدم والطلب
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(id, name, email),
        recipient:users!notifications_recipient_id_fkey(id, name, email, role),
        orders(id, service_ids, client_id, metadata)
      `)
      .or(`sender_id.eq.${supervisorId},recipient_id.eq.${supervisorId}`)
      .in('type', ['customer_update', 'customer_inquiry', 'message'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('خطأ في جلب الإشعارات:', error);
      return NextResponse.json({ error: 'خطأ في جلب الإشعارات' }, { status: 500 });
    }

    // تصفية الرسائل مع العملاء فقط
    const customerMessages = notifications.filter(notif => 
      notif.recipient.role === 'user' || notif.sender.role === 'user'
    );

    return NextResponse.json({ notifications: customerMessages });
  } catch (error) {
    console.error('خطأ في الخادم:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// POST - إرسال رسالة جديدة للعميل
export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(authToken);
    if (!payload || payload.role !== 'supervisor') {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحية مشرف' }, { status: 403 });
    }

    const { orderId, customerId, subject, message, type = 'customer_update', priority = 'normal' } = await request.json();

    if (!orderId || !customerId || !subject || !message) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const supervisorId = payload.userId;

    // التحقق من وجود الطلب وأن العميل هو صاحب الطلب
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, client_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    if (order.client_id !== customerId) {
      return NextResponse.json({ error: 'العميل ليس صاحب هذا الطلب' }, { status: 403 });
    }

    // إدراج الرسالة الجديدة
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        order_id: orderId,
        sender_id: supervisorId,
        recipient_id: customerId,
        type,
        subject,
        message,
        priority,
        status: 'sent'
      })
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(id, name, email),
        recipient:users!notifications_recipient_id_fkey(id, name, email),
        orders(id, service_ids, client_id, metadata)
      `)
      .single();

    if (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      return NextResponse.json({ error: 'خطأ في إرسال الرسالة' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'تم إرسال الرسالة بنجاح', 
      notification 
    });
  } catch (error) {
    console.error('خطأ في الخادم:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}