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

    // جلب الرسائل الواردة للمندوب
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(id, name, email),
        order:orders!notifications_order_id_fkey(id, status, metadata)
      `)
      .eq('recipient_id', payload.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // تحديث الرسائل لتصبح مقروءة
    const unreadIds = notifications?.filter(n => !n.read_at).map(n => n.id) || [];
    if (unreadIds.length > 0) {
      await supabaseAdmin
        .from('notifications')
        .update({ 
          read_at: new Date().toISOString(),
          status: 'read'
        })
        .in('id', unreadIds);
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || []
    });

  } catch (error) {
    console.error('Delegate notifications API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const { notificationId, reply } = await request.json();

    // التحقق من أن الرسالة موجهة للمندوب
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('recipient_id', payload.userId)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // تحديث الرسالة بالرد
    const { data: updatedNotification, error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({
        reply,
        replied_at: new Date().toISOString(),
        status: 'replied'
      })
      .eq('id', notificationId)
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(id, name, email),
        recipient:users!notifications_recipient_id_fkey(id, name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating notification:', updateError);
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notification: updatedNotification
    });

  } catch (error) {
    console.error('Reply notification error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}