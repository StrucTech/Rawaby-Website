import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== SIMPLE CONTRACTS API CALLED ===');
  console.log('Order ID:', params.id);
  
  try {
    // التحقق من التوكن
    const authHeader = request.headers.get('authorization');
    console.log('Auth header exists:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      console.log('Token verified - User ID:', payload.userId, 'Role:', payload.role);
    } catch (error) {
      console.log('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const orderId = params.id;
    console.log('Looking for order:', orderId);

    // جلب الطلب بشكل مبسط
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    console.log('Order query result:', { found: !!order, error: orderError?.message });
    
    if (orderError || !order) {
      console.log('Order not found in database');
      return NextResponse.json({ 
        error: 'Order not found',
        orderId: orderId,
        details: 'Order does not exist in database'
      }, { status: 404 });
    }

    console.log('Order found:', {
      id: order.id.substring(0, 8),
      client_id: order.client_id?.substring(0, 8),
      assigned_delegate_id: order.assigned_delegate_id?.substring(0, 8),
      status: order.status
    });

    // فقط للمندوبين: التحقق من التخصيص
    if (payload.role === 'delegate') {
      const isAssigned = order.assigned_delegate_id === payload.userId;
      console.log('Delegate access check:', {
        userDelegateId: payload.userId.substring(0, 8),
        orderDelegateId: order.assigned_delegate_id?.substring(0, 8),
        isAssigned: isAssigned
      });
      
      if (!isAssigned) {
        return NextResponse.json({ 
          error: 'Access denied - Not assigned to this order',
          userDelegateId: payload.userId,
          orderDelegateId: order.assigned_delegate_id
        }, { status: 403 });
      }
    }

    // جلب العقود
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .eq('order_id', orderId);

    console.log('Contracts query result:', { 
      count: contracts?.length || 0, 
      error: contractsError?.message 
    });

    console.log('Returning contracts data:', {
      contractsCount: contracts?.length || 0,
      firstContract: contracts?.[0] ? {
        id: contracts[0].id?.substring(0, 8),
        contract1_path: contracts[0].contract1_path,
        contract2_path: contracts[0].contract2_path,
        contract1_url: contracts[0].contract1_url,
        contract2_url: contracts[0].contract2_url
      } : null
    });

    return NextResponse.json({
      success: true,
      orderId: orderId,
      contracts: contracts || [],
      order: {
        id: order.id,
        status: order.status,
        assigned_delegate_id: order.assigned_delegate_id
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}