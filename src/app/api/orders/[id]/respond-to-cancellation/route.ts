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
    // التحقق من التوكن والدور
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'supervisor')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لهذه العملية' }, { status: 403 });
    }

    const { id: orderId } = await params;
    const { action, reason } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
    }

    // التحقق من أن الطلب موجود
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // التحقق من أن الطلب طلب إلغاء معلق (له علامة cancellation_requested)
    const orderMetadata = order.metadata || {};
    if (!orderMetadata.cancellation_requested) {
      return NextResponse.json({
        error: 'الطلب ليس في انتظار قرار الإلغاء'
      }, { status: 400 });
    }

    let newStatus = 'cancelled';
    let message = 'تم إلغاء الطلب بنجاح';
    
    if (action === 'reject') {
      // استرجاع حالة الطلب السابقة من metadata
      newStatus = orderMetadata.previous_status || order.status;
      message = 'تم رفض طلب الإلغاء';
    }

    // تحديث metadata مع معلومات قرار الإلغاء
    const updatedMetadata = {
      ...orderMetadata,
      cancellation_requested: false, // إزالة علامة الإلغاء المعلق في كلتا الحالتين
      cancellation_decision: action,
      cancellation_decision_at: new Date().toISOString(),
      cancellation_decision_by: payload.userId,
      cancellation_rejection_reason: action === 'reject' ? reason : null
    };

    // تحديث حالة الطلب
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
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

    // إنشاء إشعار للعميل بقرار الإلغاء
    const clientNotificationMessage = action === 'approve'
      ? `تم قبول طلب إلغاء الطلب رقم ${orderId.slice(-8).toUpperCase()}. سيتم استرجاع المبلغ قريباً.`
      : `تم رفض طلب إلغاء الطلب رقم ${orderId.slice(-8).toUpperCase()}.\nسبب الرفض: ${reason || 'لم يتم تحديد السبب'}`;

    // محاولة إنشاء إشعار (غير إلزامي)
    try {
      await supabase
        .from('delegate_completion_notifications')
        .insert({
          order_id: orderId,
          delegate_id: order.client_id,
          supervisor_id: payload.userId,
          type: action === 'approve' ? 'cancellation_approved' : 'cancellation_rejected',
          message: clientNotificationMessage,
          status: 'unread'
        });
    } catch (notifError) {
      console.log('Could not create client notification (non-critical):', notifError);
    }

    return NextResponse.json({
      success: true,
      message: message,
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Cancellation response error:', error);
    return NextResponse.json({
      error: 'حدث خطأ في معالجة الطلب',
      details: error.message
    }, { status: 500 });
  }
}
