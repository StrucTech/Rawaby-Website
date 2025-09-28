// فحص هيكل جدول orders
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  console.log('🔍 فحص هيكل جدول orders...');
  
  try {
    // جلب طلب واحد لرؤية الأعمدة المتاحة
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('❌ خطأ في جلب الطلب:', error);
      return;
    }

    console.log('\n📋 الأعمدة المتاحة في جدول orders:');
    Object.keys(order).forEach(column => {
      console.log(`   - ${column}: ${typeof order[column]} = ${order[column]}`);
    });

    // محاولة تحديث الحالة فقط
    const { data: updatedOrders, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'paid' })
      .eq('status', 'new')
      .select();

    if (updateError) {
      console.error('❌ خطأ في تحديث الحالة:', updateError);
    } else {
      console.log(`\n✅ تم تحديث حالة ${updatedOrders?.length || 0} طلبات إلى 'paid'`);
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

checkTableStructure();