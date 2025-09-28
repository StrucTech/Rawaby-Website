const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvwmchuzdsuyjkpiuutt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2d21jaHV6ZHN1eWprcGl1dXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY1NjM2MiwiZXhwIjoyMDc0MjMyMzYyfQ.oUb1deKBUmt7r6XwVqzaLIw7Fw8L0v9KkmbP9FyllUA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testOrdersDatabase() {
  console.log('=== اختبار قاعدة البيانات orders ===');
  
  try {
    // 1. فحص وجود جدول orders
    console.log('\n1. فحص وجود جدول orders...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'orders');
    
    if (tablesError) {
      console.error('خطأ في فحص الجداول:', tablesError);
      return;
    }
    
    if (tables && tables.length > 0) {
      console.log('✅ جدول orders موجود');
    } else {
      console.log('❌ جدول orders غير موجود! يجب إنشاؤه أولاً');
      return;
    }
    
    // 2. فحص الطلبات الموجودة
    console.log('\n2. فحص الطلبات الموجودة...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) {
      console.error('خطأ في قراءة الطلبات:', ordersError);
    } else {
      console.log(`📊 عدد الطلبات الموجودة: ${orders?.length || 0}`);
      if (orders && orders.length > 0) {
        console.log('آخر طلب:', orders[orders.length - 1]);
      }
    }
    
    // 3. اختبار إنشاء طلب تجريبي
    console.log('\n3. إنشاء طلب تجريبي...');
    const testOrder = {
      client_id: 'test-user-123',
      services: ['service1', 'service2'],
      status: 'new',
      total_price: 500,
      note: JSON.stringify({
        paymentMethod: 'credit-card',
        paymentTimestamp: new Date().toISOString(),
        selectedServices: [
          { id: 'service1', title: 'خدمة تجريبية 1', price: 250 },
          { id: 'service2', title: 'خدمة تجريبية 2', price: 250 }
        ],
        guardianInfo: {
          fullName: 'أحمد محمد',
          mobileNumber: '0501234567',
          nationalId: '1234567890',
          email: 'test@example.com'
        },
        studentInfo: {
          fullName: 'محمد أحمد',
          grade: 'الثالث الثانوي',
          totalScore: '450',
          certificateType: 'علمي'
        }
      })
    };
    
    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select('*')
      .single();
    
    if (insertError) {
      console.error('❌ فشل في إنشاء الطلب التجريبي:', insertError);
    } else {
      console.log('✅ تم إنشاء الطلب التجريبي بنجاح!');
      console.log('معرف الطلب:', newOrder.id);
      
      // 4. قراءة الطلب المُنشأ للتأكد
      console.log('\n4. قراءة الطلب المُنشأ...');
      const { data: readOrder, error: readError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', newOrder.id)
        .single();
      
      if (readError) {
        console.error('خطأ في قراءة الطلب:', readError);
      } else {
        console.log('✅ تم قراءة الطلب بنجاح');
        console.log('التفاصيل المحفوظة:', JSON.parse(readOrder.note));
      }
    }
    
  } catch (error) {
    console.error('خطأ عام:', error);
  }
}

testOrdersDatabase();