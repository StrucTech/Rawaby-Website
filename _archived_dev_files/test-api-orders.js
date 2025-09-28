// اختبار API للطلبات
const jwt = require('jsonwebtoken');

async function testOrdersAPI() {
  console.log('=== اختبار Orders API ===\n');
  
  try {
    // إنشاء توكن تجريبي
    const payload = {
      userId: 'da36b141-d23e-4654-bfc8-c08196d85241',
      email: 'A.M.Abdelaziz141@gmail.com',
      role: 'user'
    };
    
    const token = jwt.sign(payload, 'LNZNQ7HyCFsESfuGC9U08+iz1fVv7pmcqzjS+FMpFSlqTWwRlLjeOue1rhdYE7f1qBS71bR4actB6F5AEg8k0w==', { expiresIn: '7d' });
    
    console.log('🔑 تم إنشاء التوكن للاختبار');
    
    // بيانات الطلب
    const orderData = {
      serviceIds: ['service1', 'service2'],
      paymentMethod: 'credit-card',
      totalAmount: 500,
      guardianData: {
        fullName: 'أحمد محمد علي',
        mobileNumber: '0501234567',
        nationalId: '1234567890',
        email: 'ahmed@example.com'
      },
      studentData: {
        fullName: 'محمد أحمد علي',
        grade: 'الثالث الثانوي',
        totalScore: '450',
        certificateType: 'علمي'
      }
    };
    
    console.log('📋 بيانات الطلب جاهزة');
    
    // محاكاة استدعاء API
    console.log('🌐 محاكاة استدعاء POST /api/orders...');
    
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ فشل الطلب:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ تم إنشاء الطلب بنجاح!');
    console.log('📊 استجابة API:', JSON.stringify(result, null, 2));
    
    // اختبار قراءة الطلبات
    console.log('\n🔍 اختبار قراءة الطلبات...');
    
    const getResponse = await fetch('http://localhost:3000/api/orders?supervisorId=all', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!getResponse.ok) {
      console.log('❌ فشل في قراءة الطلبات:', getResponse.status);
      return;
    }
    
    const orders = await getResponse.json();
    console.log('✅ تم قراءة الطلبات بنجاح!');
    console.log(`📊 عدد الطلبات: ${orders.orders?.length || 0}`);
    
    if (orders.orders && orders.orders.length > 0) {
      const lastOrder = orders.orders[orders.orders.length - 1];
      console.log('\n📋 آخر طلب:');
      console.log(`• معرف الطلب: ${lastOrder.id}`);
      console.log(`• العميل: ${lastOrder.clientInfo?.name || lastOrder.client_id}`);
      console.log(`• المبلغ: ${lastOrder.total_price} ريال`);
      console.log(`• ولي الأمر: ${lastOrder.guardianInfo?.fullName || 'غير متوفر'}`);
      console.log(`• الطالب: ${lastOrder.studentInfo?.fullName || 'غير متوفر'}`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
    console.log('\n💡 تأكد من تشغيل الخادم على localhost:3000');
    console.log('💡 npm run dev');
  }
}

testOrdersAPI();