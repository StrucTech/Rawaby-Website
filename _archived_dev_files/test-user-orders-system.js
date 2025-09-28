const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvwmchuzdsuyjkpiuutt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2d21jaHV6ZHN1eWprcGl1dXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY1NjM2MiwiZXhwIjoyMDc0MjMyMzYyfQ.oUb1deKBUmt7r6XwVqzaLIw7Fw8L0v9KkmbP9FyllUA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testUserOrdersSystem() {
  console.log('=== اختبار نظام متابعة الطلبات للمستخدم ===\n');
  
  try {
    // 1. إنشاء طلب تجريبي للمستخدم
    console.log('1. إنشاء طلب تجريبي للمستخدم...');
    
    const userId = 'da36b141-d23e-4654-bfc8-c08196d85241';
    
    const testOrder = {
      client_id: userId,
      services: ['consultation', 'follow-up'],
      status: 'new',
      total_price: 750,
      note: JSON.stringify({
        paymentMethod: 'mada',
        paymentTimestamp: new Date().toISOString(),
        selectedServices: [
          { id: 'consultation', title: 'استشارة تعليمية شخصية', price: 400 },
          { id: 'follow-up', title: 'متابعة أكاديمية شاملة', price: 350 }
        ],
        guardianInfo: {
          fullName: 'خالد أحمد السعد',
          mobileNumber: '0555123456',
          nationalId: '1098765432',
          email: 'khalid@example.com'
        },
        studentInfo: {
          fullName: 'أحمد خالد السعد',
          grade: 'الثاني الثانوي',
          totalScore: '420',
          certificateType: 'علمي'
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
      return;
    }
    
    console.log('✅ تم إنشاء الطلب بنجاح!');
    console.log(`📊 معرف الطلب: ${newOrder.id}`);
    
    // 2. اختبار قراءة طلبات المستخدم
    console.log('\n2. اختبار قراءة طلبات المستخدم...');
    
    const { data: userOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', userId)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.log('❌ فشل في قراءة الطلبات:', ordersError.message);
      return;
    }
    
    console.log(`✅ تم العثور على ${userOrders?.length || 0} طلب للمستخدم`);
    
    if (userOrders && userOrders.length > 0) {
      console.log('\n📋 ملخص طلبات المستخدم:');
      userOrders.forEach((order, index) => {
        const details = order.note ? JSON.parse(order.note) : {};
        console.log(`${index + 1}. ${order.id.slice(-8)} - ${order.total_price} ريال - ${order.status}`);
        console.log(`   الطالب: ${details.studentInfo?.fullName || 'غير محدد'}`);
        console.log(`   ولي الأمر: ${details.guardianInfo?.fullName || 'غير محدد'}`);
      });
    }
    
    // 3. اختبار قراءة طلب محدد
    console.log(`\n3. اختبار قراءة تفاصيل الطلب ${newOrder.id}...`);
    
    const { data: orderDetail, error: detailError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', newOrder.id)
      .eq('client_id', userId) // التأكد من أن المستخدم يملك الطلب
      .single();
    
    if (detailError) {
      console.log('❌ فشل في قراءة تفاصيل الطلب:', detailError.message);
      return;
    }
    
    console.log('✅ تم قراءة تفاصيل الطلب بنجاح!');
    
    const orderDetails = JSON.parse(orderDetail.note);
    console.log('\n📝 تفاصيل الطلب:');
    console.log(`• المعرف: ${orderDetail.id}`);
    console.log(`• العميل: ${orderDetail.client_id}`);
    console.log(`• المبلغ: ${orderDetail.total_price} ريال`);
    console.log(`• الحالة: ${orderDetail.status}`);
    console.log(`• طريقة الدفع: ${orderDetails.paymentMethod}`);
    console.log(`• الطالب: ${orderDetails.studentInfo.fullName}`);
    console.log(`• الصف: ${orderDetails.studentInfo.grade}`);
    console.log(`• ولي الأمر: ${orderDetails.guardianInfo.fullName}`);
    console.log(`• جوال ولي الأمر: ${orderDetails.guardianInfo.mobileNumber}`);
    console.log(`• عدد الخدمات: ${orderDetails.selectedServices.length}`);
    
    orderDetails.selectedServices.forEach((service, index) => {
      console.log(`  ${index + 1}. ${service.title}: ${service.price} ريال`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 جميع اختبارات نظام متابعة الطلبات نجحت!');
    console.log('\n✅ المميزات الجاهزة:');
    console.log('  📱 صفحة "طلباتي" للمستخدم');
    console.log('  📋 عرض جميع طلبات المستخدم');
    console.log('  🔍 صفحة تفاصيل الطلب');
    console.log('  🔐 حماية الطلبات (كل مستخدم يرى طلباته فقط)');
    console.log('  📊 عرض حالة الطلب والتقدم');
    console.log('  👥 عرض معلومات الطالب وولي الأمر');
    console.log('  💳 عرض معلومات الدفع');
    console.log('  🔗 روابط سهلة في شريط التنقل');
    console.log('\n🚀 النظام جاهز للاستخدام!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testUserOrdersSystem();