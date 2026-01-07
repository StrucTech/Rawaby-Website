import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT - تحديث خدمة
export async function PUT(
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

    // التأكد من أن المستخدم أدمن
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, price, duration_days, active } = body;

    const updateData = {
      title,
      description,
      price: price, // Keep as string/text
      duration_days: duration_days, // Keep as string
      active,
      updated_at: new Date().toISOString()
    };

    const { data: service, error } = await supabaseAdmin
      .from('services')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating service:', error);
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Service updated successfully', service });
  } catch (error) {
    console.error('PUT admin service error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - حذف خدمة
export async function DELETE(
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

    // التأكد من أن المستخدم أدمن
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // التحقق من وجود طلبات مرتبطة بهذه الخدمة
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .contains('service_ids', [params.id])
      .limit(1);

    if (ordersError) {
      console.error('Error checking orders:', ordersError);
    }

    if (orders && orders.length > 0) {
      // إذا كان هناك طلبات، قم بإلغاء تفعيل الخدمة بدلاً من حذفها
      const { data: service, error } = await supabaseAdmin
        .from('services')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating service:', error);
        return NextResponse.json({ error: 'Failed to deactivate service' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Service deactivated successfully (has existing orders)', 
        service 
      });
    }

    // إذا لم تكن هناك طلبات، احذف الخدمة
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting service:', error);
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('DELETE admin service error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}