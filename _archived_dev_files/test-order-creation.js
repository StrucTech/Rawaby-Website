const fs = require('fs');
const path = require('path');

async function testOrderCreation() {
  console.log('=== اختبار إنشاء طلب جديد ===\n');
  
  // محاكاة إنشاء طلب
  const testOrder = {
    id: Date.now().toString(),
    client_id: 'test-user-123',
    services: ['service1', 'service2'],
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
    }),
    created_at: new Date().toISOString()
  };
  
  try {
    const ordersFilePath = path.join(process.cwd(), 'temp-orders.json');
    let existingOrders = [];
    
    // قراءة الطلبات الموجودة
    if (fs.existsSync(ordersFilePath)) {
      const fileContent = fs.readFileSync(ordersFilePath, 'utf8');
      existingOrders = JSON.parse(fileContent);
      console.log(`📋 عدد الطلبات الموجودة: ${existingOrders.length}`);
    } else {
      console.log('📋 لا توجد طلبات محفوظة سابقاً');
    }
    
    // إضافة الطلب الجديد
    existingOrders.push(testOrder);
    
    // حفظ الطلبات المحدثة
    fs.writeFileSync(ordersFilePath, JSON.stringify(existingOrders, null, 2));
    
    console.log('✅ تم حفظ الطلب بنجاح!');
    console.log(`📊 معرف الطلب: ${testOrder.id}`);
    console.log(`📊 العدد الإجمالي للطلبات: ${existingOrders.length}`);
    
    // عرض تفاصيل الطلب
    const orderDetails = JSON.parse(testOrder.note);
    console.log('\n📝 تفاصيل الطلب:');
    console.log(`• العميل: ${testOrder.client_id}`);
    console.log(`• المبلغ: ${testOrder.total_price} ريال`);
    console.log(`• طريقة الدفع: ${orderDetails.paymentMethod}`);
    console.log(`• ولي الأمر: ${orderDetails.guardianInfo.fullName}`);
    console.log(`• الطالب: ${orderDetails.studentInfo.fullName}`);
    console.log(`• الصف: ${orderDetails.studentInfo.grade}`);
    console.log(`• عدد الخدمات: ${orderDetails.selectedServices.length}`);
    
    console.log('\n🔍 يمكنك الآن التحقق من الملف: temp-orders.json');
    
  } catch (error) {
    console.error('❌ خطأ في حفظ الطلب:', error);
  }
}

testOrderCreation();