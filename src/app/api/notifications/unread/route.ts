import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

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

    // جلب عدد الرسائل غير المقروءة
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('id, read_at, status')
      .eq('recipient_id', payload.userId)
      .is('read_at', null);

    if (error) {
      console.error('Error fetching unread count:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    const unreadCount = notifications?.length || 0;

    // جلب آخر رسالة
    const { data: latestNotification, error: latestError } = await supabaseAdmin
      .from('notifications')
      .select(`
        id,
        subject,
        created_at,
        sender:users!notifications_sender_id_fkey(name)
      `)
      .eq('recipient_id', payload.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      unreadCount,
      latestNotification: latestError ? null : latestNotification
    });

  } catch (error) {
    console.error('Unread notifications API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}