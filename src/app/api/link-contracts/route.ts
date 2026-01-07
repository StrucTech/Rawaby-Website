import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ربط العقود بالطلبات
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { orderId, contractId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // التحقق من صلاحية الوصول للطلب
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('client_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // التأكد من أن المستخدم يملك هذا الطلب أو أنه أدمن
    if (order.client_id !== payload.userId && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (contractId) {
      // ربط عقد محدد بالطلب
      const { data: updatedContract, error: contractError } = await supabaseAdmin
        .from('contracts')
        .update({ order_id: orderId })
        .eq('id', contractId)
        .eq('user_id', payload.userId) // للأمان - فقط عقود المستخدم نفسه
        .select()
        .single();

      if (contractError) {
        console.error('Error linking contract to order:', contractError);
        return NextResponse.json({ error: 'Failed to link contract to order' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Contract linked to order successfully',
        contract: updatedContract
      });
    } else {
      // ربط جميع العقود غير المرتبطة للمستخدم بهذا الطلب
      const { data: updatedContracts, error: contractsError } = await supabaseAdmin
        .from('contracts')
        .update({ order_id: orderId })
        .eq('user_id', payload.userId)
        .is('order_id', null)
        .select();

      if (contractsError) {
        console.error('Error linking contracts to order:', contractsError);
        return NextResponse.json({ error: 'Failed to link contracts to order' }, { status: 500 });
      }

      return NextResponse.json({
        message: `Successfully linked ${updatedContracts?.length || 0} contracts to order`,
        contracts: updatedContracts
      });
    }

  } catch (error: any) {
    console.error('Link contracts error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}