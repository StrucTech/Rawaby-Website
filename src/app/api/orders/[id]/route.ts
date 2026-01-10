import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      console.log('Token verified. Payload:', payload);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Handle params as Promise or direct object
    const resolvedParams = params instanceof Promise ? await params : params;
    const orderId = resolvedParams.id;

    if (!orderId) {
      console.log('No order ID provided');
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    console.log('Getting order details for ID:', orderId, 'by user:', payload.userId, 'role:', payload.role);

    // جلب تفاصيل الطلب من قاعدة البيانات مع العلاقات
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        client:users!orders_client_id_fkey(id, name, email, phone),
        assigned_supervisor:users!orders_assigned_supervisor_id_fkey(id, name, email),
        assigned_delegate:users!orders_assigned_delegate_id_fkey(id, name, email)
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Order not found:', error?.message);
      return NextResponse.json({ 
        error: 'الطلب غير موجود',
        details: error?.message 
      }, { status: 404 });
    }

    console.log('Raw order data:', {
      id: order.id,
      assigned_delegate_id: order.assigned_delegate_id,
      client_id: order.client_id,
      hasAssignedDelegate: !!order.assigned_delegate
    });

    // التحقق من صلاحية الوصول للطلب
    const canAccess = 
      payload.role === 'admin' ||
      payload.role === 'supervisor' ||
      (payload.role === 'delegate' && order.assigned_delegate_id === payload.userId) ||
      order.client_id === payload.userId;

    console.log('Access check:', {
      orderId,
      userId: payload.userId,
      role: payload.role,
      clientId: order.client_id,
      assignedDelegateId: order.assigned_delegate_id,
      canAccess
    });

    if (!canAccess) {
      console.log('Access denied! Details:', {
        orderId,
        userId: payload.userId,
        role: payload.role,
        clientId: order.client_id,
        assignedDelegateId: order.assigned_delegate_id,
        isAdmin: payload.role === 'admin',
        isSupervisor: payload.role === 'supervisor',
        isDelegateAndAssigned: payload.role === 'delegate' && order.assigned_delegate_id === payload.userId,
        isClient: order.client_id === payload.userId
      });
      return NextResponse.json({ 
        error: 'غير مصرح لك بعرض هذا الطلب',
        debug: {
          role: payload.role,
          userId: payload.userId,
          assignedDelegateId: order.assigned_delegate_id,
          clientId: order.client_id
        }
      }, { status: 403 });
    }

    console.log('Order found:', order.id);

    // معالجة البيانات وإضافة المعلومات المفيدة
    const processedOrder = {
      ...order,
      clientInfo: order.client,
      supervisorInfo: order.assigned_supervisor,
      delegateInfo: order.assigned_delegate
    };

    return NextResponse.json(processedOrder, { status: 200 });

  } catch (error: any) {
    console.error('GET order error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب تفاصيل الطلب' }, { status: 500 });
  }
}