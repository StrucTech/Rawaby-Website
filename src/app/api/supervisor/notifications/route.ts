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

    if (payload.role !== 'supervisor') {
      return NextResponse.json({ error: 'Access denied - supervisors only' }, { status: 403 });
    }

    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');

    let query = supabaseAdmin
      .from('notifications')
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(id, name, email),
        recipient:users!notifications_recipient_id_fkey(id, name, email),
        order:orders!notifications_order_id_fkey(id, status, metadata)
      `)
      .or(`sender_id.eq.${payload.userId},recipient_id.eq.${payload.userId}`)
      .order('created_at', { ascending: false });

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || []
    });

  } catch (error) {
    console.error('=== Supervisor Notifications API Error ===');
    console.error('Error details:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

    if (payload.role !== 'supervisor') {
      return NextResponse.json({ error: 'Access denied - supervisors only' }, { status: 403 });
    }

    const { orderId, recipientId, type, subject, message, priority } = await request.json();

    // التحقق من أن المشرف له صلاحية على هذا الطلب
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('assigned_supervisor_id, assigned_delegate_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.assigned_supervisor_id !== payload.userId) {
      return NextResponse.json({ error: 'Access denied - not your supervised order' }, { status: 403 });
    }

    // إنشاء الإشعار
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert([{
        order_id: orderId,
        sender_id: payload.userId,
        recipient_id: recipientId,
        type: type || 'message',
        subject,
        message,
        priority: priority || 'normal'
      }])
      .select(`
        *,
        sender:users!notifications_sender_id_fkey(id, name, email),
        recipient:users!notifications_recipient_id_fkey(id, name, email)
      `)
      .single();

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}