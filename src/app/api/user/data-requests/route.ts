import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - جلب طلبات البيانات للعميل
export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    let payload;
    try {
      payload = verifyToken(authToken);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
    }

    // جلب طلبات البيانات للعميل مع معلومات الطلب والمشرف
    const { data: requests, error } = await supabase
      .from('data_requests')
      .select(`
        *,
        supervisor:users!data_requests_supervisor_id_fkey(id, name, email),
        orders(id, status, metadata, total_price, created_at)
      `)
      .eq('client_id', payload.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data requests:', error);
      return NextResponse.json({ error: 'خطأ في جلب الطلبات' }, { status: 500 });
    }
    
    // حساب عدد الطلبات في انتظار الرد
    const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;

    return NextResponse.json({ 
      requests,
      pendingCount 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
