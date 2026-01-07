import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// =============================================
// API لإدارة إعدادات الموقع (About & Footer)
// =============================================

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // جلب الإعدادات من قاعدة البيانات
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching site settings:', error);
      return NextResponse.json({ error: 'خطأ في جلب الإعدادات', details: error.message }, { status: 500 });
    }

    // إعدادات افتراضية إذا لم تكن موجودة
    const defaultSettings = {
      // إعدادات صفحة "من نحن"
      about: {
        heroTitle: 'من نحن',
        heroSubtitle: 'نسعى لتقديم خدمات تعليمية متميزة للمصريين في المملكة العربية السعودية',
        missionTitle: 'رسالتنا',
        missionText: 'نحن نؤمن بأن التعليم هو أساس تقدم المجتمع. نسعى جاهدين لتقديم خدمات تعليمية متميزة تساعد الطلاب المصريين في المملكة العربية السعودية على تحقيق أهدافهم الأكاديمية وتطوير مهاراتهم. نقدم خدماتنا من خلال نخبة من المعلمين المتخصصين باستخدام أحدث الوسائل التعليمية.',
        servicesTitle: 'خدماتنا',
        servicesSubtitle: 'نقدم مجموعة متكاملة من الخدمات التعليمية المتميزة',
        contactTitle: 'تواصل معنا',
        contactSubtitle: 'نحن هنا لمساعدتك في تحقيق أهدافك التعليمية',
      },
      // إعدادات الـ Footer
      footer: {
        // معلومات التواصل
        contactTitle: 'تواصل معنا',
        phone: '+966 50 000 0000',
        email: 'info@example.com',
        address: 'الرياض، المملكة العربية السعودية',
        // روابط سريعة
        quickLinksTitle: 'روابط سريعة',
        quickLinks: [
          { text: 'خدماتنا', href: '/services' },
          { text: 'من نحن', href: '/about' },
          { text: 'تسجيل الدخول', href: '/login' },
          { text: 'إنشاء حساب', href: '/register' },
        ],
        // روابط التواصل الاجتماعي
        socialTitle: 'تابعنا',
        socialLinks: {
          whatsapp: 'https://wa.me/966500000000',
          twitter: 'https://twitter.com',
          facebook: 'https://facebook.com',
          instagram: 'https://instagram.com',
        },
        // نص حقوق النشر
        copyright: 'خدمات تعليمية. جميع الحقوق محفوظة.',
      }
    };

    return NextResponse.json({
      success: true,
      settings: settings || defaultSettings
    });

  } catch (error: any) {
    console.error('GET site settings error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    } catch (error) {
      return NextResponse.json({ error: 'رمز غير صحيح' }, { status: 401 });
    }

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    const body = await req.json();
    const { about, footer } = body;

    const supabaseAdmin = getSupabaseAdmin();
    
    // التحقق من وجود سجل موجود
    const { data: existing } = await supabaseAdmin
      .from('site_settings')
      .select('id')
      .single();

    let result;
    
    if (existing) {
      // تحديث السجل الموجود
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .update({
          about,
          footer,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // إنشاء سجل جديد
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .insert({
          about,
          footer
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح',
      settings: result
    });

  } catch (error: any) {
    console.error('PUT site settings error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء حفظ الإعدادات',
      details: error.message 
    }, { status: 500 });
  }
}
