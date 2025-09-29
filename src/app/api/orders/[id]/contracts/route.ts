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

    const orderId = params.id;
    console.log('=== Contracts API Debug ===');
    console.log('Order ID requested:', orderId);
    console.log('User:', payload.userId, 'Role:', payload.role);

    // التحقق من صلاحية الوصول للطلب
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('client_id, assigned_delegate_id, assigned_supervisor_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('=== Order Not Found ===');
      console.error('Error:', orderError);
      console.error('Order ID:', orderId);
      console.error('Order data:', order);
      return NextResponse.json({ 
        error: 'Order not found',
        orderId: orderId,
        details: orderError?.message 
      }, { status: 404 });
    }

    console.log('=== Order Found ===');
    console.log('Order data:', {
      client_id: order.client_id?.substring(0, 8),
      assigned_delegate_id: order.assigned_delegate_id?.substring(0, 8),
      assigned_supervisor_id: order.assigned_supervisor_id?.substring(0, 8)
    });

    // التأكد من أن المستخدم يملك هذا الطلب أو أنه مسؤول
    let hasAccess = false;
    
    if (payload.role === 'admin') {
      hasAccess = true; // الأدمن يقدر يشوف كل حاجة
    } else if (payload.role === 'supervisor') {
      hasAccess = (order.assigned_supervisor_id === payload.userId);
    } else if (payload.role === 'delegate') {
      hasAccess = (order.assigned_delegate_id === payload.userId);
    } else {
      hasAccess = order.client_id === payload.userId; // العميل يشوف طلباته بس
    }

    console.log('=== Access Check ===');
    console.log('User ID:', payload.userId?.substring(0, 8));
    console.log('User Role:', payload.role);
    console.log('Has Access:', hasAccess);
    console.log('Order assigned_delegate_id:', order.assigned_delegate_id?.substring(0, 8));
    
    if (!hasAccess) {
      console.log('=== ACCESS DENIED ===');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // جلب العقود المرتبطة بالطلب
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from('contracts')
      .select(`
        id,
        order_id,
        user_id,
        contract1_url,
        contract2_url,
        contract1_filename,
        contract2_filename,
        status,
        reviewed_by,
        review_notes,
        reviewed_at,
        uploaded_at,
        created_at,
        users!contracts_user_id_fkey(name, email)
      `)
      .eq('order_id', orderId);

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }

    return NextResponse.json({
      orderId: orderId,
      contracts: contracts || [],
      count: contracts?.length || 0
    });

  } catch (error: any) {
    console.error('Get order contracts error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}