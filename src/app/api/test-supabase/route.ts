import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // اختبار الاتصال بـ Supabase
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return NextResponse.json({ 
        error: 'فشل الاتصال بقاعدة البيانات', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'الاتصال بـ Supabase يعمل بنجاح',
      data 
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      error: 'خطأ في الاختبار', 
      details: error.message 
    }, { status: 500 });
  }
}