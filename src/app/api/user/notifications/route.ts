import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - جلب عدد الإشعارات غير المقروءة للعميل
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('token')?.value;
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || authToken;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
    }

    // حساب عدد طلبات البيانات في انتظار الرد من العميل
    const { count: pendingDataRequests, error: dataRequestError } = await supabase
      .from('data_requests')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', payload.userId)
      .eq('status', 'pending');

    if (dataRequestError) {
      console.error('Error counting pending data requests:', dataRequestError);
    }

    // حساب عدد الطلبات التي تحتاج انتباه العميل (حالة "بانتظار رد العميل")
    const { count: ordersAwaitingResponse, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', payload.userId)
      .eq('status', 'بانتظار رد العميل');

    if (ordersError) {
      console.error('Error counting orders awaiting response:', ordersError);
    }

    const totalNotifications = (pendingDataRequests || 0) + (ordersAwaitingResponse || 0);

    return NextResponse.json({
      success: true,
      notifications: {
        pendingDataRequests: pendingDataRequests || 0,
        ordersAwaitingResponse: ordersAwaitingResponse || 0,
        total: totalNotifications
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
