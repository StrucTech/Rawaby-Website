import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== Simple Status Update API ===');
  console.log('Order ID:', params.id);
  
  try {
    const body = await request.json();
    const { status } = body;
    
    console.log('Requested status:', status);

    if (!status) {
      return NextResponse.json({ error: 'الرجاء تحديد حالة الطلب' }, { status: 400 });
    }

    // Validate status
    const validStatuses = [
      'under_review', 'assigned', 'in_progress', 'completed', 
      'waiting_client', 'waiting_attachments', 'paid', 'cancelled'
    ];
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'حالة الطلب غير صالحة', 
        validStatuses 
      }, { status: 400 });
    }

    // التحقق من التوكن
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

    console.log('User authorized:', payload.userId, 'Role:', payload.role);

    // Update order status only
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('id, status')
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ 
        error: 'حدث خطأ أثناء تحديث حالة الطلب',
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('Order updated successfully:', updatedOrder);

    return NextResponse.json({
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
      data: updatedOrder
    });

  } catch (error) {
    console.error('Simple status update error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تحديث حالة الطلب',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}