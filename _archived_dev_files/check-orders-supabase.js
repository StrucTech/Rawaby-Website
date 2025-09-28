// تشخيص الطلبات في Supabase
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrders() {
  console.log('🔍 فحص الطلبات في Supabase...');
  
  try {
    // جلب جميع الطلبات
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ خطأ في جلب الطلبات:', error);
      return;
    }

    console.log(`📊 عدد الطلبات: ${orders?.length || 0}`);
    
    if (orders && orders.length > 0) {
      console.log('\n📋 أول 3 طلبات:');
      orders.slice(0, 3).forEach((order, index) => {
        console.log(`\n${index + 1}. طلب رقم: ${order.id}`);
        console.log(`   العميل: ${order.guardian_name || 'غير محدد'}`);
        console.log(`   الحالة: ${order.status}`);
        console.log(`   السعر: ${order.total_price} ريال`);
        console.log(`   تاريخ الإنشاء: ${order.created_at}`);
        console.log(`   المشرف: ${order.supervisor_id || 'غير مُعين'}`);
        console.log(`   المندوب: ${order.staff_id || 'غير مُعين'}`);
      });
    } else {
      console.log('📝 لا توجد طلبات في قاعدة البيانات');
    }

    // فحص المستخدمين
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .in('role', ['admin', 'supervisor', 'delegate']);

    if (usersError) {
      console.error('❌ خطأ في جلب المستخدمين:', usersError);
    } else {
      console.log(`\n👥 المستخدمين:`);
      console.log(`   Admins: ${users?.filter(u => u.role === 'admin').length || 0}`);
      console.log(`   Supervisors: ${users?.filter(u => u.role === 'supervisor').length || 0}`);
      console.log(`   Delegates: ${users?.filter(u => u.role === 'delegate').length || 0}`);
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

checkOrders();