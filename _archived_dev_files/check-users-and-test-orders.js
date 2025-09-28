const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvwmchuzdsuyjkpiuutt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2d21jaHV6ZHN1eWprcGl1dXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY1NjM2MiwiZXhwIjoyMDc0MjMyMzYyfQ.oUb1deKBUmt7r6XwVqzaLIw7Fw8L0v9KkmbP9FyllUA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsersTable() {
  console.log('=== فحص جدول المستخدمين ===\n');
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(3);
    
    if (error) {
      console.log('❌ خطأ في قراءة جدول المستخدمين:', error.message);
      return;
    }
    
    console.log(`📊 عدد المستخدمين الموجودين: ${users?.length || 0}`);
    
    if (users && users.length > 0) {
      console.log('\n👥 المستخدمون الموجودون:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id} | Name: ${user.name} | Email: ${user.email}`);
      });
      
      // الآن اختبار إنشاء طلب بمعرف مستخدم حقيقي
      console.log('\n🔄 اختبار إنشاء طلب بمعرف مستخدم حقيقي...');
      
      const testOrder = {
        client_id: users[0].id, // استخدام أول مستخدم موجود
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
        console.log('❌ فشل في إنشاء الطلب:', insertError.message);
      } else {
        console.log('✅ تم إنشاء الطلب بنجاح!');
        console.log(`📊 معرف الطلب: ${newOrder.id}`);
        console.log(`👤 العميل: ${users[0].name} (${users[0].email})`);
        
        // قراءة الطلب مع بيانات العميل
        const { data: orderWithClient, error: readError } = await supabase
          .from('orders')
          .select(`
            *,
            client:users!client_id(name, email, phone)
          `)
          .eq('id', newOrder.id)
          .single();
        
        if (readError) {
          console.log('❌ فشل في قراءة الطلب مع بيانات العميل:', readError.message);
        } else {
          console.log('✅ تم قراءة الطلب مع بيانات العميل بنجاح!');
          console.log('👤 بيانات العميل:', orderWithClient.client);
        }
      }
      
    } else {
      console.log('⚠️  لا يوجد مستخدمون في قاعدة البيانات');
    }
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

checkUsersTable();