const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvwmchuzdsuyjkpiuutt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2d21jaHV6ZHN1eWprcGl1dXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY1NjM2MiwiZXhwIjoyMDc0MjMyMzYyfQ.oUb1deKBUmt7r6XwVqzaLIw7Fw8L0v9KkmbP9FyllUA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDatabaseConnection() {
  console.log('=== اختبار الاتصال بقاعدة البيانات ===\n');
  
  try {
    // 1. اختبار وجود جدول orders
    console.log('1. فحص جدول orders...');
    const { data, error } = await supabase
      .from('orders')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ خطأ في الوصول للجدول:', error.message);
      return false;
    }
    
    console.log('✅ جدول orders موجود ويعمل بشكل صحيح');
    
    // 2. اختبار إنشاء طلب تجريبي
    console.log('\n2. اختبار إنشاء طلب جديد...');
    
    // إنشاء UUID تجريبي للعميل
    const { data: tempUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    
    let testClientId;
    if (userError || !tempUser) {
      // استخدام UUID تجريبي ثابت
      testClientId = '00000000-0000-0000-0000-000000000001';
    } else {
      testClientId = tempUser.id;
    }
    
    const testOrder = {
      client_id: testClientId,
      services: ['service1', 'service2'],
      status: 'new',
      total_price: 750,
      note: JSON.stringify({
        paymentMethod: 'mada',
        paymentTimestamp: new Date().toISOString(),
        selectedServices: [
          { id: 'service1', title: 'خدمة استشارة تعليمية متقدمة', price: 350 },
          { id: 'service2', title: 'خدمة متابعة أكاديمية شاملة', price: 400 }
        ],
        guardianInfo: {
          fullName: 'سعد عبدالله المحمد',
          mobileNumber: '0551234567',
          nationalId: '1234567891',
          email: 'saad@example.com'
        },
        studentInfo: {
          fullName: 'عبدالله سعد المحمد',
          grade: 'الأول الثانوي',
          totalScore: '380',
          certificateType: 'أدبي'
        },
        orderSummary: {
          totalAmount: 750,
          servicesCount: 2,
          orderDate: new Date().toISOString(),
          orderStatus: 'new'
        }
      })
    };
    
    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select('*')
      .single();
    
    if (insertError) {
      console.log('❌ فشل في إنشاء الطلب:', insertError.message);
      return false;
    }
    
    console.log('✅ تم إنشاء الطلب بنجاح!');
    console.log(`📊 معرف الطلب: ${newOrder.id}`);
    
    // 3. اختبار قراءة الطلب
    console.log('\n3. اختبار قراءة الطلب...');
    
    const { data: readOrder, error: readError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', newOrder.id)
      .single();
    
    if (readError) {
      console.log('❌ فشل في قراءة الطلب:', readError.message);
      return false;
    }
    
    console.log('✅ تم قراءة الطلب بنجاح!');
    
    // عرض تفاصيل الطلب
    const orderDetails = JSON.parse(readOrder.note);
    console.log('\n📋 تفاصيل الطلب المحفوظ:');
    console.log(`• العميل: ${readOrder.client_id}`);
    console.log(`• المبلغ: ${readOrder.total_price} ريال`);
    console.log(`• طريقة الدفع: ${orderDetails.paymentMethod}`);
    console.log(`• ولي الأمر: ${orderDetails.guardianInfo.fullName}`);
    console.log(`• الطالب: ${orderDetails.studentInfo.fullName}`);
    console.log(`• الصف: ${orderDetails.studentInfo.grade}`);
    
    // 4. عد إجمالي الطلبات
    console.log('\n4. عد إجمالي الطلبات...');
    
    const { data: allOrders, error: countError } = await supabase
      .from('orders')
      .select('id, created_at, client_id, total_price');
    
    if (countError) {
      console.log('❌ فشل في عد الطلبات:', countError.message);
    } else {
      console.log(`📊 إجمالي الطلبات في قاعدة البيانات: ${allOrders?.length || 0}`);
      
      if (allOrders && allOrders.length > 0) {
        console.log('\n📝 آخر 3 طلبات:');
        allOrders
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3)
          .forEach((order, index) => {
            console.log(`${index + 1}. ${order.id} - ${order.total_price} ريال - ${new Date(order.created_at).toLocaleString('ar-SA')}`);
          });
      }
    }
    
    console.log('\n🎉 جميع الاختبارات نجحت! قاعدة البيانات تعمل بشكل مثالي');
    return true;
    
  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error);
    return false;
  }
}

testDatabaseConnection();