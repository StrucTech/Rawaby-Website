import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('🔍 اختبار بسيط لقاعدة البيانات...');
    
    // عد الطلبات
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    // جلب آخر 5 طلبات مع بيانات العملاء
    const { data: recentOrders, error: ordersDataError } = await supabase
      .from('orders')
      .select(`
        *,
        client:users!orders_client_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    // عد المستخدمين
    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // عد الخدمات
    const { count: servicesCount, error: servicesError } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });
    
    // عد العقود
    const { count: contractsCount, error: contractsError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });

    const result = {
      success: true,
      counts: {
        orders: ordersError ? `خطأ: ${ordersError.message}` : ordersCount,
        users: usersError ? `خطأ: ${usersError.message}` : usersCount,
        services: servicesError ? `خطأ: ${servicesError.message}` : servicesCount,
        contracts: contractsError ? `خطأ: ${contractsError.message}` : contractsCount
      },
      recentOrders: ordersDataError ? `خطأ: ${ordersDataError.message}` : recentOrders,
      errors: {
        orders: ordersError?.message || null,
        users: usersError?.message || null,
        services: servicesError?.message || null,
        contracts: contractsError?.message || null,
        ordersData: ordersDataError?.message || null
      }
    };
    
    console.log('نتائج الاختبار:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('خطأ في اختبار قاعدة البيانات:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
      details: error
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🧪 اختبار إدراج طلب تجريبي...');
    
    // إدراج طلب تجريبي
    const testOrder = {
      client_id: '11111111-1111-1111-1111-111111111111',
      service_ids: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
      total_price: 99.99,
      status: 'new',
      payment_method: 'test',
      metadata: {
        testOrder: true,
        timestamp: new Date().toISOString(),
        guardianName: 'ولي أمر تجريبي',
        serviceName: 'خدمة تجريبية'
      }
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
      .single();
    
    if (insertError) {
      console.error('فشل في إدراج الطلب التجريبي:', insertError);
      
      return NextResponse.json({
        success: false,
        error: 'فشل في إدراج الطلب التجريبي',
        details: insertError.message,
        insertError: insertError
      }, { status: 500 });
    }
    
    console.log('تم إدراج الطلب التجريبي بنجاح:', insertResult);
    
    // حذف الطلب التجريبي فوراً
    if (insertResult?.id) {
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', insertResult.id);
      
      if (deleteError) {
        console.warn('لم يتم حذف الطلب التجريبي:', deleteError);
      } else {
        console.log('تم حذف الطلب التجريبي بنجاح');
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'تم اختبار إدراج الطلب بنجاح',
      insertedOrder: insertResult,
      testCompleted: true
    });
    
  } catch (error) {
    console.error('خطأ في اختبار الإدراج:', error);
    
    return NextResponse.json({
      success: false,
      error: 'خطأ في اختبار الإدراج',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}