import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(authToken);
    if (!payload || payload.role !== 'user') {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحية مستخدم' }, { status: 403 });
    }

    const userId = payload.userId;

    // جلب عدد الرسائل غير المقروءة فقط
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('status', 'sent')
      .in('type', ['customer_update', 'customer_inquiry', 'message']);

    if (error) {
      console.error('خطأ في جلب عدد الإشعارات:', error);
      return NextResponse.json({ error: 'خطأ في جلب عدد الإشعارات' }, { status: 500 });
    }

    return NextResponse.json({ unreadCount: count || 0 });
  } catch (error) {
    console.error('خطأ في الخادم:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}