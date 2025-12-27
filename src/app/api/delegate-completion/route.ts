import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UserPayload {
  userId: string;
  role: string;
}

// POST - إرسال إشعار إتمام من المندوب للمشرف
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;

    if (decoded.role !== 'delegate') {
      return NextResponse.json({ error: 'غير مصرح - للمناديب فقط' }, { status: 403 });
    }

    const { orderId, message } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'معرف الطلب مطلوب' }, { status: 400 });
    }

    // التحقق من أن الطلب مسند لهذا المندوب
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, assigned_delegate_id, assigned_supervisor_id, status, metadata')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    if (order.assigned_delegate_id !== decoded.userId) {
      return NextResponse.json({ error: 'هذا الطلب غير مسند إليك' }, { status: 403 });
    }

    if (!order.assigned_supervisor_id) {
      return NextResponse.json({ error: 'لا يوجد مشرف معين لهذا الطلب' }, { status: 400 });
    }

    // إنشاء إشعار للمشرف
    const notification = {
      id: crypto.randomUUID(),
      order_id: orderId,
      delegate_id: decoded.userId,
      supervisor_id: order.assigned_supervisor_id,
      type: 'delegate_completion',
      message: message || 'المندوب يبلغ بإتمام المهمة المسندة إليه',
      status: 'unread',
      created_at: new Date().toISOString()
    };

    // حفظ الإشعار في جدول delegate_completion_notifications
    const { error: notificationError } = await supabase
      .from('delegate_completion_notifications')
      .insert([notification]);

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // إذا الجدول غير موجود، نحاول إنشاءه
      if (notificationError.code === '42P01') {
        // الجدول غير موجود - نعيد رسالة توضيحية
        return NextResponse.json({ 
          error: 'جدول الإشعارات غير موجود. يرجى إنشاء الجدول أولاً.',
          sql: `
CREATE TABLE IF NOT EXISTS delegate_completion_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES users(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) DEFAULT 'delegate_completion',
  message TEXT,
  status VARCHAR(20) DEFAULT 'unread',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dcn_supervisor_id ON delegate_completion_notifications(supervisor_id);
CREATE INDEX idx_dcn_order_id ON delegate_completion_notifications(order_id);
CREATE INDEX idx_dcn_status ON delegate_completion_notifications(status);
          `
        }, { status: 500 });
      }
      return NextResponse.json({ error: 'فشل في إرسال الإشعار' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'تم إرسال الإشعار للمشرف بنجاح',
      notification
    });

  } catch (error) {
    console.error('Error in completion notification:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// GET - جلب إشعارات الإتمام للمشرف
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;

    if (decoded.role !== 'supervisor' && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('delegate_completion_notifications')
      .select(`
        *,
        delegate:delegate_id(id, name, email),
        orders!inner(id, status, metadata, total_price)
      `)
      .order('created_at', { ascending: false });

    // المشرف يرى إشعاراته فقط، الأدمن يرى الكل
    if (decoded.role === 'supervisor') {
      query = query.eq('supervisor_id', decoded.userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'فشل في جلب الإشعارات' }, { status: 500 });
    }

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// PATCH - تحديث حالة الإشعار (تم القراءة)
export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;

    if (decoded.role !== 'supervisor' && decoded.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { notificationId, status } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 });
    }

    const updateData: any = { status: status || 'read' };
    if (status === 'read') {
      updateData.read_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('delegate_completion_notifications')
      .update(updateData)
      .eq('id', notificationId);

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json({ error: 'فشل في تحديث الإشعار' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
