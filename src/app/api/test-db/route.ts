import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET() {
  try {
    // اختبار الاتصال بـ Supabase
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(5);

    if (error) {
      console.error('Supabase error:', error);
      
      if (error.message.includes('relation "users" does not exist')) {
        return NextResponse.json({ 
          error: '❌ جدول المستخدمين غير موجود',
          message: 'يرجى تنفيذ السكريپت SQL في Supabase Dashboard',
          steps: [
            '1. اذهب إلى https://supabase.com/dashboard',
            '2. اختر مشروعك',
            '3. اذهب إلى SQL Editor',
            '4. انسخ محتوى database-schema-new.sql',
            '5. الصقه واضغط RUN'
          ]
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: 'خطأ في قاعدة البيانات', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: '✅ Supabase يعمل بنجاح!',
      usersCount: data?.length || 0,
      users: data 
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      error: 'خطأ في الاختبار', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 بدء اختبار قاعدة البيانات بدون تحقق من التوكن...');

    console.log('🔍 بدء اختبار قاعدة البيانات...');
    const results: any = {};

    // 1. اختبار الاتصال بقاعدة البيانات
    console.log('📡 اختبار الاتصال بقاعدة البيانات...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);

    if (connectionError) {
      console.error('❌ خطأ في الاتصال:', connectionError);
      return NextResponse.json({
        success: false,
        error: 'فشل الاتصال بقاعدة البيانات',
        details: connectionError.message
      }, { status: 500 });
    }

    results.connectionStatus = '✅ متصل';

    // 2. عد الطلبات الموجودة
    console.log('🔢 عد الطلبات...');
    const { count: ordersCount, error: ordersCountError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (ordersCountError) {
      results.ordersCount = `❌ خطأ: ${ordersCountError.message}`;
    } else {
      results.ordersCount = ordersCount || 0;
    }

    // 3. جلب آخر 5 طلبات
    console.log('📋 جلب آخر الطلبات...');
    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        total_price,
        status,
        payment_method,
        created_at,
        metadata,
        users!orders_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentOrdersError) {
      results.recentOrders = `❌ خطأ: ${recentOrdersError.message}`;
    } else {
      results.recentOrders = recentOrders || [];
    }

    // 4. اختبار إدراج طلب تجريبي (بدون حفظ)
    console.log('🧪 اختبار إدراج طلب تجريبي...');
    const testOrderData = {
      user_id: '11111111-1111-1111-1111-111111111111', // مستخدم تجريبي
      total_price: 100.00,
      status: 'pending',
      payment_method: 'test',
      metadata: {
        guardianName: 'ولي أمر اختبار',
        serviceName: 'خدمة اختبار',
        studentInfo: {
          name: 'طالب اختبار',
          grade: 'الأول الثانوي'
        },
        testOrder: true
      }
    };

    // محاولة الإدراج (سنحذفه فورا إذا نجح)
    const { data: insertTest, error: insertError } = await supabase
      .from('orders')
      .insert([testOrderData])
      .select()
      .single();

    if (insertError) {
      results.insertTest = `❌ فشل الإدراج: ${insertError.message}`;
    } else {
      results.insertTest = `✅ نجح الإدراج`;
      
      // حذف الطلب التجريبي
      if (insertTest?.id) {
        await supabase
          .from('orders')
          .delete()
          .eq('id', insertTest.id);
        
        results.insertTest += ' (تم حذف الطلب التجريبي)';
      }
    }

    // 5. فحص العقود
    console.log('📄 فحص جدول العقود...');
    const { count: contractsCount, error: contractsCountError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });

    if (contractsCountError) {
      results.contractsCount = `❌ خطأ: ${contractsCountError.message}`;
    } else {
      results.contractsCount = contractsCount || 0;
    }

    // 6. فحص المستخدمين
    console.log('👥 فحص جدول المستخدمين...');
    const { count: usersCount, error: usersCountError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersCountError) {
      results.usersCount = `❌ خطأ: ${usersCountError.message}`;
    } else {
      results.usersCount = usersCount || 0;
    }

    // 7. فحص الخدمات
    console.log('🔧 فحص جدول الخدمات...');
    const { count: servicesCount, error: servicesCountError } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });

    if (servicesCountError) {
      results.servicesCount = `❌ خطأ: ${servicesCountError.message}`;
    } else {
      results.servicesCount = servicesCount || 0;
    }

    console.log('✅ انتهاء اختبار قاعدة البيانات');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('❌ خطأ عام في اختبار قاعدة البيانات:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في اختبار قاعدة البيانات',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}