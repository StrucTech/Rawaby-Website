import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/jwt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من التوكن
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

    // التحقق من أن الطلب موجود
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // التحقق من أن المستخدم هو صاحب الطلب
    if (order.client_id !== payload.userId) {
      return NextResponse.json({ error: 'غير مصرح بالوصول لهذا الطلب' }, { status: 403 });
    }

    // التحقق من أن الطلب قابل للإلغاء (حالة: new أو تحت المراجعة)
    const cancellableStatuses = ['new', 'تحت المراجعة', 'تعيين مشرف', 'تعيين مندوب', 'تحت الإجراء'];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json({
        error: 'لا يمكن إلغاء الطلب في هذه الحالة'
      }, { status: 400 });
    }

    // إنشاء إشعار للمشرف
    const { data: user } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', payload.userId)
      .single();

    const notificationMessage = `العميل ${user?.name || 'العميل'} يطلب إلغاء الطلب رقم ${orderId.slice(-8).toUpperCase()} - المبلغ: ${order.total_price} جنيه`;

    // إنشاء إشعار - إما للمشرف المعيّن أو للـ Admin (بـ supervisor_id = NULL) إذا لم يكن هناك مشرف
    const supervisorId = order.assigned_supervisor_id;
    
    try {
      await supabase
        .from('delegate_completion_notifications')
        .insert({
          order_id: orderId,
          delegate_id: payload.userId, // العميل هنا
          supervisor_id: supervisorId || null, // NULL إذا لم يكن هناك مشرف (للـ Admin)
          type: 'cancellation_request',
          message: notificationMessage,
          status: 'unread'
        });
    } catch (notifError) {
      console.log('Could not create notification (non-critical):', notifError);
    }

    // تحديث حالة الطلب - نحتفظ بالحالة الحالية ونضيف علامة في metadata
    // لأن check constraint لا يسمح بحالات جديدة
    const currentMetadata = order.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      cancellation_requested: true,
      cancellation_requested_at: new Date().toISOString(),
      cancellation_requested_by: payload.userId,
      previous_status: order.status
    };

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        metadata: updatedMetadata
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({
        error: 'فشل في تحديث حالة الطلب'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب الإلغاء بنجاح',
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Cancellation request error:', error);
    return NextResponse.json({
      error: 'حدث خطأ في معالجة الطلب',
      details: error.message
    }, { status: 500 });
  }
}
