import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // اختبار متغيرات البيئة
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const checks = {
      supabaseUrl: !!supabaseUrl,
      supabaseAnonKey: !!supabaseAnonKey,
      supabaseServiceKey: !!supabaseServiceKey,
      urlCorrect: supabaseUrl?.includes('supabase.co'),
      anonKeyValid: supabaseAnonKey?.startsWith('eyJ'),
      serviceKeyValid: supabaseServiceKey?.startsWith('eyJ')
    };

    return NextResponse.json({
      message: 'فحص متغيرات البيئة',
      checks,
      debug: {
        supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'غير موجود',
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'خطأ في فحص متغيرات البيئة', 
      details: error.message 
    }, { status: 500 });
  }
}