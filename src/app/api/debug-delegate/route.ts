import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
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

    if (payload.role !== 'delegate') {
      return NextResponse.json({ error: 'Access denied - delegates only' }, { status: 403 });
    }

    // جلب كل الطلبات لهذا المندوب
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('assigned_delegate_id', payload.userId);

    return NextResponse.json({
      delegate_id: payload.userId,
      orders_count: orders?.length || 0,
      orders: orders?.map(order => ({
        id: order.id,
        status: order.status,
        client_id: order.client_id,
        assigned_delegate_id: order.assigned_delegate_id,
        delegate_id: order.delegate_id,
        created_at: order.created_at,
        total_price: order.total_price
      })) || []
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}