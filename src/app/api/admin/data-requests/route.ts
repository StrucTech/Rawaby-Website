import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/jwt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - جلب جميع طلبات البيانات (للأدمن فقط)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحية أدمن' }, { status: 403 });
    }

    // جلب جميع طلبات البيانات مع المعلومات المرتبطة
    const { data: requests, error } = await supabase
      .from('data_requests')
      .select(`
        *,
        supervisor:users!data_requests_supervisor_id_fkey(id, name, email),
        client:users!data_requests_client_id_fkey(id, name, email, phone),
        orders(id, status, metadata, total_price, created_at)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data requests:', error);
      return NextResponse.json({ error: 'خطأ في جلب الطلبات' }, { status: 500 });
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// POST - إرسال رسالة جديدة للعميل (الأدمن يمكنه الإرسال لأي عميل)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحية أدمن' }, { status: 403 });
    }

    const { orderId, clientId, message, supervisorId } = await request.json();

    if (!orderId || !clientId || !message) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    // إنشاء طلب البيانات (الأدمن يرسل باسم المشرف أو باسمه)
    const { data: newRequest, error: createError } = await supabase
      .from('data_requests')
      .insert({
        order_id: orderId,
        supervisor_id: supervisorId || payload.userId, // المشرف أو الأدمن نفسه
        client_id: clientId,
        message: message.trim(),
        status: 'pending'
      })
      .select(`
        *,
        supervisor:users!data_requests_supervisor_id_fkey(id, name, email),
        client:users!data_requests_client_id_fkey(id, name, email)
      `)
      .single();

    if (createError) {
      console.error('Error creating data request:', createError);
      return NextResponse.json({ error: 'خطأ في إنشاء الطلب' }, { status: 500 });
    }

    // تحديث حالة الطلب
    await supabase
      .from('orders')
      .update({ status: 'بانتظار رد العميل' })
      .eq('id', orderId);

    return NextResponse.json({ 
      message: 'تم إرسال الرسالة بنجاح',
      request: newRequest 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// PATCH - تعديل طلب بيانات موجود
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحية أدمن' }, { status: 403 });
    }

    const { requestId, message, status } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'معرف الطلب مطلوب' }, { status: 400 });
    }

    const updateData: any = {};
    if (message) updateData.message = message;
    if (status) {
      updateData.status = status;
      if (status === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('data_requests')
      .update(updateData)
      .eq('id', requestId)
      .select(`
        *,
        supervisor:users!data_requests_supervisor_id_fkey(id, name, email),
        client:users!data_requests_client_id_fkey(id, name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating data request:', updateError);
      return NextResponse.json({ error: 'خطأ في تحديث الطلب' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'تم تحديث الطلب بنجاح',
      request: updatedRequest 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// DELETE - حذف طلب بيانات
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحية أدمن' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'معرف الطلب مطلوب' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('data_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) {
      console.error('Error deleting data request:', deleteError);
      return NextResponse.json({ error: 'خطأ في حذف الطلب' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم حذف الطلب بنجاح' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
