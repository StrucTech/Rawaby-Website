import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// جلب جميع التقييمات للأدمن
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    }

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        users(name, email),
        orders(id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ message: 'خطأ في جلب التقييمات' }, { status: 500 });
    }

    // معالجة البيانات للحصول على اسم الخدمة من service_ids
    const reviewsWithServices = reviews.map((review: any) => {
      let serviceName = 'خدمة';
      if (review.orders?.service_ids && review.orders.service_ids.length > 0) {
        serviceName = 'خدمة متعددة'; // قيمة افتراضية
      }
      return {
        ...review,
        orders: {
          ...review.orders,
          services: { name: serviceName }
        }
      };
    });

    return NextResponse.json({ reviews: reviewsWithServices });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ message: 'خطأ في الخادم' }, { status: 500 });
  }
}

// تحديث حالة التقييم (موافقة/رفض/تمييز)
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    }

    const { id, is_approved, is_featured } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'معرف التقييم مطلوب' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof is_approved === 'boolean') updateData.is_approved = is_approved;
    if (typeof is_featured === 'boolean') updateData.is_featured = is_featured;

    const { error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating review:', error);
      return NextResponse.json({ message: 'خطأ في تحديث التقييم' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم تحديث التقييم بنجاح' });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ message: 'خطأ في الخادم' }, { status: 500 });
  }
}

// حذف تقييم
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'معرف التقييم مطلوب' }, { status: 400 });
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json({ message: 'خطأ في حذف التقييم' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم حذف التقييم بنجاح' });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ message: 'خطأ في الخادم' }, { status: 500 });
  }
}
