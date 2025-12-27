import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== PATCH Request Started ===');
  console.log('Order ID:', params.id);
  
  try {
    const body = await request.json();
    const { status, staffId, completedBy, assigned_supervisor_id } = body;
    
    console.log('PATCH request body:', { status, staffId, completedBy, assigned_supervisor_id });

    // الحالات الصالحة (القديمة والجديدة)
    const validStatuses = [
      // حالات جديدة (عربية)
      'تعيين مشرف',
      'تعيين مندوب',
      'تحت الإجراء',
      'مطلوب بيانات إضافية أو مرفقات',
      'بانتظار رد العميل',
      'تم الانتهاء بنجاح',
      // حالات قديمة (للتوافقية)
      'under_review', 'assigned', 'in_progress', 'completed', 
      'waiting_client', 'waiting_attachments', 'paid', 'cancelled'
    ];
    
    if (status && !validStatuses.includes(status)) {
      console.log('Invalid status received:', status, 'Valid statuses:', validStatuses);
      return new NextResponse(
        JSON.stringify({ error: 'حالة الطلب غير صالحة', receivedStatus: status }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // التحقق من الصلاحيات
    const authHeader = request.headers.get('authorization');
    console.log('Auth header exists:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      console.log('Token verified for user:', payload.userId, 'role:', payload.role);
    } catch (error) {
      console.log('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (payload.role !== 'admin' && payload.role !== 'supervisor') {
      console.log('Access denied for role:', payload.role);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find order in database with simpler query
    console.log('Looking for order with ID:', params.id);
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();

    console.log('Database query result:', { 
      found: !!order, 
      error: fetchError?.message,
      orderId: order?.id?.substring(0, 8) 
    });

    if (fetchError || !order) {
      console.error('Order not found:', fetchError?.message);
      return new NextResponse(
        JSON.stringify({ 
          error: 'الطلب غير موجود',
          details: fetchError?.message 
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Order found in database:', order.id);

    // Update order status and delegate assignment using new schema
    const updateData: any = { 
      updated_at: new Date().toISOString() // إضافة timestamp للتحديث
    };
    
    // إذا تم تمرير الحالة، نستخدمها
    if (status) {
      updateData.status = status;
    }
    
    console.log('Preparing update with status:', status);
    
    // Parse existing metadata to preserve other data (only if needed)
    let metadata: any = {};
    
    // إذا أراد المشرف أخذ الطلب (تعيين نفسه)
    if (assigned_supervisor_id) {
      console.log('Supervisor taking order:', params.id, 'by supervisor:', assigned_supervisor_id);
      
      // التحقق من أن الطلب لم يُعيّن لمشرف آخر
      if (order.assigned_supervisor_id && order.assigned_supervisor_id !== assigned_supervisor_id) {
        return new NextResponse(
          JSON.stringify({ error: 'هذا الطلب معين لمشرف آخر بالفعل' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      updateData.assigned_supervisor_id = assigned_supervisor_id;
      // تغيير الحالة تلقائياً إلى "تعيين مندوب" عند أخذ الطلب
      if (status === 'تعيين مندوب' || !status) {
        updateData.status = 'تعيين مندوب';
      }
    }
    
    // If staffId is provided, assign the order to delegate using new schema
    if (staffId) {
      console.log('Assigning order', params.id, 'to delegate', staffId);
      
      // التحقق من أن الطلب لم يتم تعيين مشرف له من قبل
      if (order.assigned_supervisor_id && order.assigned_supervisor_id !== payload.userId) {
        return new NextResponse(
          JSON.stringify({ error: 'هذا الطلب معين لمشرف آخر بالفعل' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      updateData.assigned_delegate_id = staffId;
      updateData.assigned_supervisor_id = payload.userId; // تعيين المشرف الحالي كمسؤول
      updateData.assigned_at = new Date().toISOString();
      
      // تغيير الحالة تلقائياً إلى "تحت الإجراء" عند تعيين مندوب
      if (!status || status === 'assigned') {
        updateData.status = 'تحت الإجراء';
      }
      
      // حفظ معلومات إضافية في metadata فقط إذا كان هناك تعيين
      try {
        metadata = order.metadata ? (typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata) : {};
        metadata.assignedDelegate = staffId;
        metadata.assignedSupervisor = payload.userId;
        metadata.assignedAt = new Date().toISOString();
        updateData.metadata = metadata;
      } catch (e) {
        console.log('Could not update metadata, skipping');
      }
    }
    
    // If completedBy is provided, mark who completed the task
    if (completedBy) {
      console.log('Order', params.id, 'completed by delegate', completedBy);
      updateData.status = 'تم الانتهاء بنجاح';
      
      try {
        metadata = order.metadata ? (typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata) : {};
        metadata.completedBy = completedBy;
        metadata.completedAt = new Date().toISOString();
        updateData.metadata = metadata;
      } catch (e) {
        console.log('Could not update metadata for completion, skipping');
      }
    }

    console.log('=== Starting Order Update Process ===');
    console.log('Update data to be sent:', updateData);
    
    // Update order in database
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    console.log('Supabase update result:', { 
      success: !updateError, 
      error: updateError,
      updatedOrder: updatedOrder ? 'Order updated successfully' : 'No order returned'
    });

    if (updateError) {
      console.error('Supabase update error details:', JSON.stringify(updateError, null, 2));
      return new NextResponse(
        JSON.stringify({ 
          error: 'حدث خطأ أثناء تحديث حالة الطلب',
          details: updateError.message,
          code: updateError.code 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Send notification (mock) - تخطي إذا كانت البيانات غير متوفرة
    try {
      const userId = updatedOrder.client_id;
      if (userId) {
        await sendNotification(userId.toString(), {
          title: 'تم تحديث حالة الطلب',
          body: `تم تحديث حالة طلبك إلى ${status}`,
          type: 'order_status_update'
        });
      }
    } catch (notificationError) {
      console.log('Notification failed (non-critical):', notificationError);
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'تم تحديث حالة الطلب بنجاح',
        data: {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          assigned_delegate_id: updatedOrder.assigned_delegate_id,
          assigned_supervisor_id: updatedOrder.assigned_supervisor_id
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error updating order - Full error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    return new NextResponse(
      JSON.stringify({ 
        error: 'حدث خطأ أثناء تحديث حالة الطلب',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Mock notification function
async function sendNotification(userId: string, notification: {
  title: string;
  body: string;
  type: string;
}) {
  // Simulate notification delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In a real implementation, this would:
  // 1. Store notification in database
  // 2. Send push notification if user has device tokens
  // 3. Send email notification
  // 4. Send SMS if configured
  console.log('Sending notification:', {
    userId,
    ...notification
  });

  return true;
} 