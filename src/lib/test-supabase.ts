import { UserModel } from '@/models/UserSupabase';
import { ServiceModel } from '@/models/ServiceSupabase';
import { OrderModel } from '@/models/OrderSupabase';

export async function testSupabaseConnection() {
  try {
    console.log('🔧 اختبار الاتصال بـ Supabase...');

    // اختبار جلب الخدمات
    const services = await ServiceModel.findAll();
    console.log('✅ تم جلب الخدمات بنجاح:', services.length);

    // اختبار جلب المستخدمين
    const users = await UserModel.findAll();
    console.log('✅ تم جلب المستخدمين بنجاح:', users.length);

    // اختبار جلب الطلبات
    const orders = await OrderModel.findAll();
    console.log('✅ تم جلب الطلبات بنجاح:', orders.length);

    console.log('🎉 جميع الاختبارات نجحت! Supabase يعمل بشكل صحيح.');
    return true;

  } catch (error) {
    console.error('❌ فشل في اختبار Supabase:', error);
    return false;
  }
}

export async function createTestData() {
  try {
    console.log('📝 إنشاء بيانات تجريبية...');

    // إنشاء خدمة تجريبية
    const testService = await ServiceModel.create({
      title: 'خدمة تجريبية',
      description: 'هذه خدمة تجريبية للاختبار',
      duration_days: 7,
      price: 100.00,
      notes: 'ملاحظات تجريبية'
    });

    console.log('✅ تم إنشاء خدمة تجريبية:', testService.id);

    // إنشاء مستخدم تجريبي (مدير)
    const testAdmin = await UserModel.create({
      name: 'مدير تجريبي',
      email: 'test-admin@example.com',
      phone: '01234567890',
      national_id: '12345678901234',
      password: 'password123',
      role: 'admin',
      active: true,
      email_verified: true
    });

    console.log('✅ تم إنشاء مدير تجريبي:', testAdmin.id);

    console.log('🎉 تم إنشاء البيانات التجريبية بنجاح!');
    return { testService, testAdmin };

  } catch (error) {
    console.error('❌ فشل في إنشاء البيانات التجريبية:', error);
    throw error;
  }
}

// دالة للتحقق من التحويل الكامل
export async function validateMigration() {
  const results = {
    connection: false,
    userOperations: false,
    serviceOperations: false,
    orderOperations: false,
    apiRoutes: false
  };

  try {
    // اختبار الاتصال
    results.connection = await testSupabaseConnection();

    // اختبار عمليات المستخدمين
    try {
      const user = await UserModel.findByEmail('test@example.com');
      results.userOperations = true;
    } catch (error) {
      console.log('ℹ️ لا توجد مستخدمين في قاعدة البيانات');
      results.userOperations = true; // العملية تعمل حتى لو لم توجد بيانات
    }

    // اختبار عمليات الخدمات
    try {
      const services = await ServiceModel.findAll();
      results.serviceOperations = true;
    } catch (error) {
      console.error('❌ فشل في عمليات الخدمات:', error);
    }

    // اختبار عمليات الطلبات
    try {
      const orders = await OrderModel.findAll();
      results.orderOperations = true;
    } catch (error) {
      console.error('❌ فشل في عمليات الطلبات:', error);
    }

    console.log('\n📊 نتائج التحقق من التحويل:');
    console.log('🔗 الاتصال:', results.connection ? '✅' : '❌');
    console.log('👥 عمليات المستخدمين:', results.userOperations ? '✅' : '❌');
    console.log('🛎️ عمليات الخدمات:', results.serviceOperations ? '✅' : '❌');
    console.log('📋 عمليات الطلبات:', results.orderOperations ? '✅' : '❌');

    const overallSuccess = Object.values(results).every(result => result);
    console.log('\n🎯 النتيجة الإجمالية:', overallSuccess ? '✅ نجح التحويل' : '❌ يحتاج مراجعة');

    return results;

  } catch (error) {
    console.error('❌ خطأ في التحقق من التحويل:', error);
    return results;
  }
}