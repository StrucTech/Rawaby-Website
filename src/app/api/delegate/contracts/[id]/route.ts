import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
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

    // التحقق من أن المستخدم مندوب
    if (payload.role !== 'delegate') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const orderId = params.id;
    console.log('Fetching contracts for order:', orderId, 'by delegate:', payload.userId);

    // التحقق من أن المندوب مكلف بهذا الطلب
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, delegate_id, status, created_at')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError, 'OrderId:', orderId);
      return NextResponse.json({ 
        error: 'Order not found', 
        details: orderError.message,
        orderId: orderId 
      }, { status: 404 });
    }

    // التحقق من أن المندوب هو المكلف بالطلب
    if (order.delegate_id !== payload.userId) {
      console.log('Access denied - delegate_id:', order.delegate_id, 'user_id:', payload.userId);
      return NextResponse.json({ 
        error: 'Access denied - Not assigned to this order',
        orderDelegateId: order.delegate_id,
        userDelegateId: payload.userId
      }, { status: 403 });
    }

    // جلب العقود المرتبطة بالطلب
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      contracts: contracts || [],
      orderId: orderId,
      orderInfo: {
        delegate_id: order.delegate_id,
        status: order.status,
        created_at: order.created_at
      }
    });

  } catch (error) {
    console.error('Error in delegate contracts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}