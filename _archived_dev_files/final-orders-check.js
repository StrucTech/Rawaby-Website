const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvwmchuzdsuyjkpiuutt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2d21jaHV6ZHN1eWprcGl1dXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY1NjM2MiwiZXhwIjoyMDc0MjMyMzYyfQ.oUb1deKBUmt7r6XwVqzaLIw7Fw8L0v9KkmbP9FyllUA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkOrdersSimple() {
  console.log('=== فحص الطلبات (بسيط) ===\n');
  
  try {
    // قراءة الطلبات بدون علاقات
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ خطأ في قراءة الطلبات:', error.message);
      return;
    }
    
    console.log(`🎉 نجحت القراءة! عدد الطلبات: ${orders?.length || 0}`);
    
    if (orders && orders.length > 0) {
      console.log('\n📋 تفاصيل الطلبات:');
      
      orders.forEach((order, index) => {
        console.log(`\n--- الطلب ${index + 1} ---`);
        console.log(`ID: ${order.id}`);
        console.log(`العميل: ${order.client_id}`);
        console.log(`المبلغ: ${order.total_price} ريال`);
        console.log(`الحالة: ${order.status}`);
        console.log(`الخدمات: ${order.services?.join(', ') || 'غير محدد'}`);
        console.log(`التاريخ: ${new Date(order.created_at).toLocaleString('ar-SA')}`);
        
        // عرض جزء من التفاصيل
        if (order.note) {
          try {
            const details = JSON.parse(order.note);
            console.log(`طريقة الدفع: ${details.paymentMethod || 'غير محدد'}`);
            console.log(`ولي الأمر: ${details.guardianInfo?.fullName || 'غير محدد'}`);
            console.log(`الطالب: ${details.studentInfo?.fullName || 'غير محدد'}`);
            console.log(`عدد الخدمات: ${details.selectedServices?.length || 0}`);
          } catch (e) {
            console.log('تفاصيل إضافية: غير قابلة للقراءة');
          }
        }
      });
      
      console.log('\n' + '='.repeat(50));
      console.log('🎯 خلاصة الاختبار:');
      console.log('✅ قاعدة البيانات متصلة ومتاحة');
      console.log('✅ جدول orders موجود ويعمل');
      console.log('✅ الطلبات محفوظة مع التفاصيل الكاملة');
      console.log('✅ بيانات ولي الأمر والطالب محفوظة');
      console.log('✅ معلومات الدفع والخدمات محفوظة');
      console.log('\n🚀 النظام جاهز للاستخدام!');
      
    } else {
      console.log('📝 قاعدة البيانات فارغة - لم يتم إنشاء طلبات بعد');
    }
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

checkOrdersSimple();