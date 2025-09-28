// إصلاح حالة الطلبات في Supabase
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixOrdersStatus() {
  console.log('🔧 إصلاح حالة الطلبات...');
  
  try {
    // تحديث جميع الطلبات التي لها حالة 'new' إلى 'paid'
    const { data: updatedOrders, error } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: 'paid',
        guardian_name: 'عميل تجريبي' // إضافة اسم تجريبي
      })
      .eq('status', 'new')
      .select();

    if (error) {
      console.error('❌ خطأ في تحديث الطلبات:', error);
      return;
    }

    console.log(`✅ تم تحديث ${updatedOrders?.length || 0} طلبات بنجاح`);
    
    // عرض النتائج المحدثة
    const { data: orders, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ خطأ في جلب الطلبات:', fetchError);
      return;
    }

    console.log('\n📋 الطلبات بعد التحديث:');
    orders?.forEach((order, index) => {
      console.log(`\n${index + 1}. طلب رقم: ${order.id}`);
      console.log(`   العميل: ${order.guardian_name || 'غير محدد'}`);
      console.log(`   الحالة: ${order.status}`);
      console.log(`   السعر: ${order.total_price} ريال`);
    });

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

fixOrdersStatus();