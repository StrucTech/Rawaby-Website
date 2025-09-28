import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log('Simple order creation API called');
    
    // التحقق من المصادقة
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    } catch (error) {
      return NextResponse.json({ error: 'رمز المصادقة غير صحيح' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Received body:', body);

    // بيانات الطلب البسيط
    const orderData = {
      client_id: payload.userId,
      service_ids: body.serviceIds || ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'], // خدمة افتراضية
      status: 'new',
      total_price: parseFloat(body.totalAmount) || 500.00,
      payment_method: body.paymentMethod || 'credit',
      metadata: {
        guardianName: body.guardianName || 'ولي أمر تجريبي',
        serviceName: body.serviceName || 'خدمة تجريبية',
        studentInfo: body.studentInfo || { name: 'طالب تجريبي', grade: 'اختبار' },
        paymentTimestamp: new Date().toISOString(),
        testOrder: true
      }
    };

    console.log('Creating order with data:', orderData);

    // إدراج الطلب في قاعدة البيانات
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return NextResponse.json({
        error: 'فشل في إنشاء الطلب',
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('Order created successfully:', order.id);

    return NextResponse.json({
      message: 'تم إنشاء الطلب بنجاح',
      order: order,
      saved_to_database: true
    }, { status: 201 });

  } catch (error: any) {
    console.error('Simple order creation error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء إنشاء الطلب',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // التحقق من المصادقة
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    } catch (error) {
      return NextResponse.json({ error: 'رمز المصادقة غير صحيح' }, { status: 401 });
    }

    // جلب جميع الطلبات من قاعدة البيانات مع معلومات العميل
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        client:users!orders_client_id_fkey(id, name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ 
        error: 'خطأ في جلب الطلبات',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      orders: orders || [],
      count: orders?.length || 0
    });

  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء جلب الطلبات',
      details: error.message 
    }, { status: 500 });
  }
}