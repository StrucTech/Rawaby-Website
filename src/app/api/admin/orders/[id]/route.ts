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
  try {
    const body = await request.json();
    const { status, staffId, completedBy } = body;
    
    console.log('PATCH request body:', { status, staffId, completedBy });

    if (!status) {
      return new NextResponse(
        JSON.stringify({ error: 'الرجاء تحديد حالة الطلب' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate status - استخدام الحالات الجديدة
    const validStatuses = [
      'under_review', 'assigned', 'in_progress', 'completed', 
      'waiting_client', 'waiting_attachments', 'paid', 'cancelled'
    ];
    if (!validStatuses.includes(status)) {
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

    if (payload.role !== 'admin' && payload.role !== 'supervisor') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find order in database
    console.log('Looking for order with ID:', params.id);
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        client:users!orders_client_id_fkey(id, name, email),
        assigned_supervisor:users!orders_assigned_supervisor_id_fkey(id, name, email),
        assigned_delegate:users!orders_assigned_delegate_id_fkey(id, name, email)
      `)
      .eq('id', params.id)
      .single();

    console.log('Database query result:', { order, fetchError });

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
    const updateData: any = { status };
    
    // Parse existing metadata to preserve other data
    let metadata: any = {};
    try {
      metadata = order.metadata ? (typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata) : {};
    } catch (e) {
      console.log('Could not parse existing metadata, creating new one');
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
      updateData.status = 'assigned'; // تحديث الحالة إلى معين
      
      // حفظ معلومات إضافية في metadata
      metadata.assignedDelegate = staffId;
      metadata.assignedSupervisor = payload.userId;
      metadata.assignedAt = new Date().toISOString();
    }
    
    // If completedBy is provided, mark who completed the task
    if (completedBy) {
      console.log('Order', params.id, 'completed by delegate', completedBy);
      updateData.status = 'completed';
      
      metadata.completedBy = completedBy;
      metadata.completedAt = new Date().toISOString();
    }
    
    // Update metadata if any changes were made
    updateData.metadata = metadata;

    // Update order in database
    console.log('Updating order in database with data:', updateData);
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    console.log('Update result:', { updatedOrder, updateError });

    if (updateError) {
      console.error('Update error details:', JSON.stringify(updateError, null, 2));
      return new NextResponse(
        JSON.stringify({ 
          error: 'حدث خطأ أثناء تحديث حالة الطلب',
          details: updateError.message 
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
    console.error('Error updating order:', error);
    return new NextResponse(
      JSON.stringify({ error: 'حدث خطأ أثناء تحديث حالة الطلب' }),
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