import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// جلب التقييمات المعتمدة للعرض العام
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const featured = searchParams.get('featured') === 'true';

    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        is_featured,
        users!inner(name),
        orders!inner(id)
      `)
      .eq('is_approved', true)
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (featured) {
      query = query.eq('is_featured', true);
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { message: 'خطأ في جلب التقييمات' },
        { status: 500 }
      );
    }

    // تنسيق البيانات لحماية الخصوصية
    const formattedReviews = reviews?.map(review => {
      const userName = (review.users as any)?.name || 'عميل';
      const nameParts = userName.split(' ');
      const displayName = nameParts.length > 1 
        ? `${nameParts[0]} ${nameParts[1][0]}.`
        : nameParts[0];

      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        is_featured: review.is_featured,
        customer_name: displayName,
        service_name: 'خدمة' // اسم الخدمة من metadata أو قيمة افتراضية
      };
    }) || [];

    return NextResponse.json({ reviews: formattedReviews });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { message: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
