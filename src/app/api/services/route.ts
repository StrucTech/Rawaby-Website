import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // محاولة جلب الخدمات من قاعدة البيانات أولاً
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    let formattedServices = [];

    if (error || !services || services.length === 0) {
      // في حالة عدم وجود خدمات في قاعدة البيانات، استخدم خدمات مؤقتة
      console.log('Using fallback services');
      formattedServices = [
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          title: 'التقديم الرسمي للجامعة',
          description: 'تعبئة الاستمارات، تجهيز الملف، تقديم الطلب',
          duration_days: 5,
          duration: '3-5 أيام عمل',
          price: 500,
          category: 'تقديم',
          active: true
        },
        {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          title: 'توثيق الأوراق من مصر',
          description: 'توثيق من القنصلية/وزارة الخارجية/وزارة التعليم',
          duration_days: 7,
          duration: 'يتم التنسيق بحسب الجهة المطلوبة',
          price: 300,
          category: 'توثيق',
          active: true
        },
        {
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          title: 'استخراج الأوراق من السعودية',
          description: 'يشمل التوكيل الرسمي',
          duration_days: 7,
          duration: '5-7 أيام عمل',
          price: 400,
          category: 'استخراج',
          active: true
        }
      ];
    } else {
      // تحويل البيانات من قاعدة البيانات
      formattedServices = services.map(service => ({
        id: service.id,
        title: service.title,
        description: service.description,
        duration_days: service.duration_days,
        duration: service.duration_days + ' يوم',
        price: parseFloat(service.price),
        category: 'خدمات تعليمية',
        active: service.active
      }));
    }

    return NextResponse.json({
      success: true,
      services: formattedServices,
      count: formattedServices.length
    });

  } catch (error) {
    console.error('Error in services API:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}