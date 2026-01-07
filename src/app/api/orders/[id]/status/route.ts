import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
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

    // Only supervisors and admins can update status
    if (payload.role !== 'admin' && payload.role !== 'supervisor') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'حالة الطلب مطلوبة' }, { status: 400 });
    }

    // جميع الحالات الصالحة
    const allValidStatuses = [
      'تعيين مشرف',
      'تعيين مندوب',
      'تحت الإجراء',
      'مطلوب بيانات إضافية أو مرفقات',
      'بانتظار رد العميل',
      'تم الانتهاء بنجاح'
    ];

    // الحالات المسموحة للمشرف فقط (بعد تعيين الطلب له)
    const supervisorAllowedStatuses = [
      'تحت الإجراء',
      'مطلوب بيانات إضافية أو مرفقات',
      'بانتظار رد العميل',
      'تم الانتهاء بنجاح'
    ];

    if (!allValidStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'حالة الطلب غير صالحة',
        validStatuses: allValidStatuses 
      }, { status: 400 });
    }

    // Get the order to verify ownership
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, assigned_supervisor_id, status')
      .eq('id', params.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // التحقق من صلاحيات المشرف
    if (payload.role === 'supervisor') {
      // المشرف يجب أن يكون مُعيّن للطلب
      if (order.assigned_supervisor_id !== payload.userId) {
        return NextResponse.json({ 
          error: 'يجب أن يكون الطلب مُعيّن لك لتتمكن من تحديث حالته' 
        }, { status: 403 });
      }
      
      // المشرف يمكنه فقط تغيير الحالات المحددة
      if (!supervisorAllowedStatuses.includes(status)) {
        return NextResponse.json({ 
          error: 'لا يمكنك تغيير الحالة إلى هذه القيمة',
          allowedStatuses: supervisorAllowedStatuses 
        }, { status: 403 });
      }
    }
    // Admin له صلاحيات كاملة - لا حاجة لتحقق إضافي

    // Update the status
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ 
        error: 'حدث خطأ أثناء تحديث الحالة',
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تحديث الحالة',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
