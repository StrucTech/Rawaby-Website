const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvwmchuzdsuyjkpiuutt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2d21jaHV6ZHN1eWprcGl1dXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY1NjM2MiwiZXhwIjoyMDc0MjMyMzYyfQ.oUb1deKBUmt7r6XwVqzaLIw7Fw8L0v9KkmbP9FyllUA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testOrderWithCorrectData() {
  console.log('=== اختبار إنشاء طلب بالبيانات الصحيحة ===\n');
  
  try {
    // استخدام معرف المستخدم الموجود
    const userId = 'da36b141-d23e-4654-bfc8-c08196d85241';
    
    const testOrder = {
      client_id: userId,
      services: ['service1', 'service2'], // نص عادي
      status: 'new',
      total_price: 500,
      note: JSON.stringify({
        paymentMethod: 'credit-card',
        paymentTimestamp: new Date().toISOString(),
        selectedServices: [
          { id: 'service1', title: 'خدمة استشارة تعليمية', price: 250 },
          { id: 'service2', title: 'خدمة متابعة أكاديمية', price: 250 }
        ],
        guardianInfo: {
          fullName: 'أحمد محمد علي',
          mobileNumber: '0501234567',
          nationalId: '1234567890',
          email: 'ahmed@example.com'
        },
        studentInfo: {
          fullName: 'محمد أحمد علي',
          grade: 'الثالث الثانوي',
          totalScore: '450',
          certificateType: 'علمي'
        },
        orderSummary: {
          totalAmount: 500,
          servicesCount: 2,
          orderDate: new Date().toISOString(),
          orderStatus: 'new'
        }
      })
    };
    
    console.log('📝 محاولة إنشاء الطلب...');
    
    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select('*')
      .single();
    
    if (insertError) {
      console.log('❌ فشل في إنشاء الطلب:', insertError.message);
      console.log('💡 يرجى تنفيذ الكود في fix-orders-table.sql أولاً');
      return;
    }
    
    console.log('✅ تم إنشاء الطلب بنجاح!');
    console.log(`📊 معرف الطلب: ${newOrder.id}`);
    
    // قراءة الطلب للتأكد
    const { data: savedOrder, error: readError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', newOrder.id)
      .single();
    
    if (readError) {
      console.log('❌ فشل في قراءة الطلب:', readError.message);
      return;
    }
    
    console.log('✅ تم قراءة الطلب المحفوظ بنجاح!');
    
    // عرض التفاصيل
    const orderDetails = JSON.parse(savedOrder.note);
    console.log('\n📋 تفاصيل الطلب المحفوظ:');
    console.log(`• معرف الطلب: ${savedOrder.id}`);
    console.log(`• العميل: ${savedOrder.client_id}`);
    console.log(`• المبلغ: ${savedOrder.total_price} ريال`);
    console.log(`• الحالة: ${savedOrder.status}`);
    console.log(`• الخدمات: ${savedOrder.services.join(', ')}`);
    console.log(`• طريقة الدفع: ${orderDetails.paymentMethod}`);
    console.log(`• ولي الأمر: ${orderDetails.guardianInfo.fullName}`);
    console.log(`• الطالب: ${orderDetails.studentInfo.fullName}`);
    console.log(`• الصف: ${orderDetails.studentInfo.grade}`);
    console.log(`• تاريخ الإنشاء: ${new Date(savedOrder.created_at).toLocaleString('ar-SA')}`);
    
    // عد جميع الطلبات
    const { data: allOrders, error: countError } = await supabase
      .from('orders')
      .select('id');
    
    if (!countError) {
      console.log(`\n📊 إجمالي الطلبات في قاعدة البيانات: ${allOrders?.length || 0}`);
    }
    
    console.log('\n🎉 تم اختبار النظام بنجاح! قاعدة البيانات تعمل الآن');
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

testOrderWithCorrectData();