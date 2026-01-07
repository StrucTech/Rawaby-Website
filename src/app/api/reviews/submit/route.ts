import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// إضافة تقييم جديد
export async function POST(request: Request) {
  try {
    // التحقق من المستخدم
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'غير مصرح' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { message: 'رمز غير صالح' },
        { status: 401 }
      );
    }

    const { order_id, rating, comment } = await request.json();

    // التحقق من البيانات
    if (!order_id || !rating) {
      return NextResponse.json(
        { message: 'معرف الطلب والتقييم مطلوبان' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'التقييم يجب أن يكون بين 1 و 5' },
        { status: 400 }
      );
    }

    // التحقق من أن الطلب يخص المستخدم وأنه مكتمل
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    console.log('Order lookup result:', { order_id, status: order?.status, client_id: order?.client_id });

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return NextResponse.json(
        { message: 'الطلب غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من أن الطلب يخص المستخدم
    // استخدام client_id (الاسم الصحيح للعمود في جدول orders)
    const orderUserId = order.client_id;
    
    if (orderUserId !== payload.userId) {
      return NextResponse.json(
        { message: 'غير مصرح لك بتقييم هذا الطلب' },
        { status: 403 }
      );
    }

    // التحقق من أن الطلب مكتمل (يدعم حالات مختلفة)
    const completedStatuses = ['completed', 'done', 'تم الانتهاء بنجاح'];
    if (!completedStatuses.includes(order.status)) {
      return NextResponse.json(
        { message: 'لا يمكن تقييم طلب غير مكتمل' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود تقييم سابق
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order_id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { message: 'تم تقييم هذا الطلب مسبقاً' },
        { status: 400 }
      );
    }

    // إضافة التقييم
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        user_id: payload.userId,
        order_id: order_id,
        rating: rating,
        comment: comment || null,
        is_approved: false, // يحتاج موافقة الأدمن
        is_featured: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting review:', insertError);
      return NextResponse.json(
        { message: 'خطأ في إضافة التقييم' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'تم إرسال تقييمك بنجاح! سيتم مراجعته ونشره قريباً',
      review
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { message: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// جلب تقييم طلب معين للمستخدم
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'غير مصرح' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { message: 'رمز غير صالح' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get('order_id');

    if (!order_id) {
      return NextResponse.json(
        { message: 'معرف الطلب مطلوب' },
        { status: 400 }
      );
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('order_id', order_id)
      .eq('user_id', payload.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching review:', error);
      return NextResponse.json(
        { message: 'خطأ في جلب التقييم' },
        { status: 500 }
      );
    }

    return NextResponse.json({ review: review || null });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { message: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
