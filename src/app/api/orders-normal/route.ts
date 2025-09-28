import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('=== تجربة إنشاء طلب عادي ===');
    
    // التحقق من المصادقة
    const authHeader = request.headers.get('authorization');
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

    const body = await request.json();
    console.log('بيانات الطلب الواردة:', body);

    // جلب الخدمات المحددة
    const serviceIds = body.serviceIds || [];
    if (serviceIds.length === 0) {
      return NextResponse.json({ 
        error: 'يجب تحديد خدمة واحدة على الأقل' 
      }, { status: 400 });
    }

    const { data: services, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('*')
      .in('id', serviceIds)
      .eq('active', true);

    if (servicesError) {
      console.error('خطأ في جلب الخدمات:', servicesError);
      return NextResponse.json({ 
        error: 'خطأ في جلب الخدمات',
        details: servicesError.message 
      }, { status: 500 });
    }

    if (!services || services.length === 0) {
      return NextResponse.json({ 
        error: 'لم يتم العثور على خدمات صحيحة' 
      }, { status: 400 });
    }

    // حساب السعر الإجمالي
    const totalPrice = services.reduce((sum, service) => sum + parseFloat(service.price.toString()), 0);

    // إعداد بيانات الطلب
    const orderData = {
      client_id: payload.userId,
      service_ids: serviceIds,
      status: 'new',
      total_price: totalPrice,
      payment_method: body.paymentMethod || 'credit',
      metadata: {
        // معلومات الخدمات
        selectedServices: services.map(service => ({
          id: service.id,
          title: service.title,
          price: service.price,
          description: service.description || ''
        })),
        
        // معلومات الدفع
        paymentMethod: body.paymentMethod || 'credit',
        paymentTimestamp: new Date().toISOString(),
        
        // معلومات ولي الأمر (إن وجدت)
        guardianInfo: body.guardianInfo || null,
        
        // معلومات الطالب (إن وجدت)
        studentInfo: body.studentInfo || null,
        
        // ملخص
        serviceName: services.map(s => s.title).join(' + '),
        orderSource: 'web_application'
      }
    };

    console.log('بيانات الطلب للإدراج:', orderData);

    // إدراج الطلب في قاعدة البيانات
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select(`
        *,
        client:users!orders_client_id_fkey(id, name, email, phone)
      `)
      .single();

    if (orderError) {
      console.error('خطأ في إنشاء الطلب:', orderError);
      return NextResponse.json({
        error: 'فشل في إنشاء الطلب',
        details: orderError.message,
        hint: orderError.hint,
        code: orderError.code
      }, { status: 500 });
    }

    console.log('تم إنشاء الطلب بنجاح:', order.id);

    // إشعار المشرفين (اختياري)
    try {
      await notifySupervisors(order, services);
    } catch (notifyError) {
      console.warn('فشل في إرسال الإشعارات:', notifyError);
      // لا نوقف العملية بسبب فشل الإشعارات
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح',
      order: {
        id: order.id,
        status: order.status,
        totalPrice: order.total_price,
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
        client: order.client,
        services: services
      },
      savedToDatabase: true
    }, { status: 201 });

  } catch (error: any) {
    console.error('خطأ عام في إنشاء الطلب:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء إنشاء الطلب',
      details: error.message 
    }, { status: 500 });
  }
}

async function notifySupervisors(order: any, services: any[]) {
  try {
    const { data: supervisors } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('role', 'supervisor')
      .eq('active', true);

    if (supervisors && supervisors.length > 0) {
      console.log(`طلب جديد ${order.id} - إشعار ${supervisors.length} مشرف`);
      // يمكن إضافة منطق إرسال الإشعارات هنا
    }
  } catch (error) {
    console.error('خطأ في إشعار المشرفين:', error);
  }
}