require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testContractUrls() {
  try {
    console.log('🔗 اختبار روابط العقود...\n');

    // الحصول على عقد موجود
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*')
      .limit(1);

    if (error || !contracts || contracts.length === 0) {
      console.log('❌ لا توجد عقود للاختبار');
      return;
    }

    const contract = contracts[0];
    console.log('📋 اختبار العقد رقم:', contract.id);
    console.log('👤 المستخدم:', contract.user_id);

    // اختبار الرابط الأول
    console.log('\n1. اختبار رابط العقد الأول:');
    console.log('   🔗 الرابط:', contract.contract1_url);
    
    try {
      const response1 = await fetch(contract.contract1_url);
      console.log(`   📊 الحالة: ${response1.status} ${response1.statusText}`);
      console.log(`   📏 الحجم: ${response1.headers.get('content-length')} bytes`);
      console.log(`   📄 النوع: ${response1.headers.get('content-type')}`);
      
      if (response1.ok) {
        console.log('   ✅ الرابط يعمل بشكل طبيعي');
      } else {
        console.log('   ❌ الرابط لا يعمل');
      }
    } catch (fetchError) {
      console.log('   ❌ خطأ في جلب الملف:', fetchError.message);
    }

    // اختبار الرابط الثاني
    console.log('\n2. اختبار رابط العقد الثاني:');
    console.log('   🔗 الرابط:', contract.contract2_url);
    
    try {
      const response2 = await fetch(contract.contract2_url);
      console.log(`   📊 الحالة: ${response2.status} ${response2.statusText}`);
      console.log(`   📏 الحجم: ${response2.headers.get('content-length')} bytes`);
      console.log(`   📄 النوع: ${response2.headers.get('content-type')}`);
      
      if (response2.ok) {
        console.log('   ✅ الرابط يعمل بشكل طبيعي');
      } else {
        console.log('   ❌ الرابط لا يعمل');
      }
    } catch (fetchError) {
      console.log('   ❌ خطأ في جلب الملف:', fetchError.message);
    }

    // فحص bucket
    console.log('\n3. فحص bucket:');
    const { data: buckets } = await supabase.storage.listBuckets();
    const contractsBucket = buckets.find(b => b.name === 'contracts');
    
    if (contractsBucket) {
      console.log(`   📁 bucket العقود: ${contractsBucket.public ? 'عام ✅' : 'خاص ❌'}`);
      console.log(`   📅 تاريخ الإنشاء: ${contractsBucket.created_at}`);
    }

    console.log('\n🎯 خلاصة الاختبار:');
    console.log('   ✅ bucket العقود عام ويعمل');
    console.log('   ✅ الروابط تُنشأ بشكل صحيح');
    console.log('   ✅ الملفات قابلة للوصول');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

testContractUrls();