const fs = require('fs');
const path = require('path');

function testOrderRetrieval() {
  console.log('=== اختبار قراءة الطلبات ===\n');
  
  try {
    const ordersFilePath = path.join(process.cwd(), 'temp-orders.json');
    
    if (!fs.existsSync(ordersFilePath)) {
      console.log('❌ لا يوجد ملف طلبات محفوظ');
      return;
    }
    
    const fileContent = fs.readFileSync(ordersFilePath, 'utf8');
    const orders = JSON.parse(fileContent);
    
    console.log(`📊 تم العثور على ${orders.length} طلب`);
    
    orders.forEach((order, index) => {
      console.log(`\n📋 الطلب رقم ${index + 1}:`);
      console.log(`• معرف الطلب: ${order.id}`);
      console.log(`• العميل: ${order.client_id}`);
      console.log(`• الحالة: ${order.status}`);
      console.log(`• المبلغ: ${order.total_price} ريال`);
      console.log(`• تاريخ الإنشاء: ${new Date(order.created_at).toLocaleString('ar-SA')}`);
      
      // تحليل تفاصيل الطلب
      try {
        const details = JSON.parse(order.note);
        console.log(`• طريقة الدفع: ${details.paymentMethod}`);
        
        if (details.guardianInfo) {
          console.log(`• ولي الأمر: ${details.guardianInfo.fullName}`);
          console.log(`• جوال ولي الأمر: ${details.guardianInfo.mobileNumber}`);
        }
        
        if (details.studentInfo) {
          console.log(`• الطالب: ${details.studentInfo.fullName}`);
          console.log(`• الصف: ${details.studentInfo.grade}`);
        }
        
        if (details.selectedServices) {
          console.log(`• عدد الخدمات: ${details.selectedServices.length}`);
          details.selectedServices.forEach((service, idx) => {
            console.log(`  - ${service.title}: ${service.price} ريال`);
          });
        }
        
      } catch (e) {
        console.log('• خطأ في تحليل تفاصيل الطلب');
      }
    });
    
    console.log('\n✅ تم قراءة جميع الطلبات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في قراءة الطلبات:', error);
  }
}

testOrderRetrieval();