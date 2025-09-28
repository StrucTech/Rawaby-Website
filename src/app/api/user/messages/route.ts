import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/jwt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - عرض رسائل المشرفين للمستخدم
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(authToken);
    if (!payload || payload.role !== 'user') {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحية مستخدم' }, { status: 403 });
    }

    const userId = payload.userId;

    // جلب جميع الرسائل للمستخدم مع بيانات المشرف والطلب
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(id, name, email, role),
        recipient:users!notifications_recipient_id_fkey(id, name, email),
        orders(id, service_ids, client_id, metadata)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .in('type', ['customer_update', 'customer_inquiry', 'message'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('خطأ في جلب الإشعارات:', error);
      return NextResponse.json({ error: 'خطأ في جلب الإشعارات' }, { status: 500 });
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('خطأ في الخادم:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// POST - رد المستخدم على رسالة المشرف
export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(authToken);
    if (!payload || payload.role !== 'user') {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحية مستخدم' }, { status: 403 });
    }

    const { notificationId, reply } = await request.json();

    if (!notificationId || !reply) {
      return NextResponse.json({ error: 'رقم الإشعار والرد مطلوبان' }, { status: 400 });
    }

    const userId = payload.userId;

    // التحقق من وجود الإشعار وأن المستخدم هو المستقبل
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .single();

    if (notificationError || !notification) {
      return NextResponse.json({ error: 'الإشعار غير موجود أو غير مصرح بالوصول' }, { status: 404 });
    }

    // تحديث الإشعار بالرد
    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update({
        reply,
        replied_at: new Date().toISOString(),
        status: 'replied'
      })
      .eq('id', notificationId)
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(id, name, email, role),
        recipient:users!notifications_recipient_id_fkey(id, name, email),
        orders(id, service_ids, client_id, metadata)
      `)
      .single();

    if (updateError) {
      console.error('خطأ في تحديث الرد:', updateError);
      return NextResponse.json({ error: 'خطأ في إرسال الرد' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'تم إرسال الرد بنجاح', 
      notification: updatedNotification 
    });
  } catch (error) {
    console.error('خطأ في الخادم:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// PUT - تحديد الرسالة كمقروءة
export async function PUT(request: NextRequest) {
  try {
    const authToken = request.cookies.get('token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(authToken);
    if (!payload || payload.role !== 'user') {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحية مستخدم' }, { status: 403 });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'رقم الإشعار مطلوب' }, { status: 400 });
    }

    const userId = payload.userId;

    // تحديث حالة القراءة
    const { data, error } = await supabase
      .from('notifications')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    if (error) {
      console.error('خطأ في تحديث حالة القراءة:', error);
      return NextResponse.json({ error: 'خطأ في تحديث حالة القراءة' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم تحديث حالة القراءة' });
  } catch (error) {
    console.error('خطأ في الخادم:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}