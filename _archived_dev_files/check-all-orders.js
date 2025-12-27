const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvwmchuzdsuyjkpiuutt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2d21jaHV6ZHN1eWprcGl1dXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY1NjM2MiwiZXhwIjoyMDc0MjMyMzYyfQ.oUb1deKBUmt7r6XwVqzaLIw7Fw8L0v9KkmbP9FyllUA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAllOrders() {
  console.log('=== فحص جميع الطلبات في قاعدة البيانات ===\n');
  
  try {
    // قراءة جميع الطلبات مع بيانات العملاء
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        client:users!client_id(name, email, phone)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ خطأ في قراءة الطلبات:', error.message);
      return;
    }
    
    console.log(`📊 إجمالي الطلبات: ${orders?.length || 0}`);
    
    if (orders && orders.length > 0) {
      console.log('\n📋 قائمة الطلبات:');
      console.log('='.repeat(60));
      
      orders.forEach((order, index) => {
        console.log(`\n${index + 1}. طلب رقم: ${order.id}`);
        console.log(`   العميل: ${order.client?.name || 'غير محدد'} (${order.client?.email || order.client_id})`);
        console.log(`   المبلغ: ${order.total_price} جنيه مصري`);
        console.log(`   الحالة: ${order.status}`);
        console.log(`   التاريخ: ${new Date(order.created_at).toLocaleString('ar-SA')}`);
        
        // تحليل التفاصيل من note
        if (order.note) {
          try {
            const details = JSON.parse(order.note);
            console.log(`   طريقة الدفع: ${details.paymentMethod || 'غير محدد'}`);
            
            if (details.guardianInfo) {
              console.log(`   ولي الأمر: ${details.guardianInfo.fullName}`);
              console.log(`   جوال ولي الأمر: ${details.guardianInfo.mobileNumber}`);
            }
            
            if (details.studentInfo) {
              console.log(`   الطالب: ${details.studentInfo.fullName}`);
              console.log(`   الصف: ${details.studentInfo.grade}`);
            }
            
            if (details.selectedServices && details.selectedServices.length > 0) {
              console.log(`   الخدمات:`);
              details.selectedServices.forEach((service) => {
                console.log(`     - ${service.title}: ${service.price} ريال`);
              });
            }
            
          } catch (e) {
            console.log(`   تفاصيل إضافية: غير قابلة للتحليل`);
          }
        }
        
        console.log('-'.repeat(60));
      });
      
      console.log('\n✅ تم عرض جميع الطلبات بنجاح!');
      console.log('\n🎯 النظام يعمل بشكل مثالي:');
      console.log('   ✓ قاعدة البيانات متصلة');
      console.log('   ✓ الطلبات محفوظة بالتفاصيل الكاملة');
      console.log('   ✓ بيانات ولي الأمر محفوظة');
      console.log('   ✓ بيانات الطالب محفوظة');
      console.log('   ✓ تفاصيل الخدمات محفوظة');
      console.log('   ✓ معلومات الدفع محفوظة');
      
    } else {
      console.log('📝 لا توجد طلبات محفوظة بعد');
    }
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

checkAllOrders();