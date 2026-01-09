import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
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

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    console.log('Getting order details for ID:', orderId);

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

    // التحقق من صلاحية الوصول للطلب
    const canAccess = 
      payload.role === 'admin' ||
      payload.role === 'supervisor' ||
      (payload.role === 'delegate' && order.assigned_delegate_id === payload.userId) ||
      order.client_id === payload.userId;

    if (!canAccess) {
      return NextResponse.json({ error: 'غير مصرح لك بعرض هذا الطلب' }, { status: 403 });
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