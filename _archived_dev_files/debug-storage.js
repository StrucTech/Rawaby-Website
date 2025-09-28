require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugContractsStorage() {
  try {
    console.log('🔍 فحص مشكلة storage العقود...\n');

    // 1. فحص buckets
    console.log('1. فحص Buckets:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ خطأ في فحص buckets:', bucketsError);
      return;
    }

    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (public: ${bucket.public}, created: ${bucket.created_at})`);
    });

    const contractsBucket = buckets.find(b => b.name === 'contracts');
    if (!contractsBucket) {
      console.log('❌ bucket العقود غير موجود!');
      return;
    }

    // 2. فحص الملفات الموجودة في bucket
    console.log('\n2. فحص الملفات في bucket العقود:');
    const { data: files, error: filesError } = await supabase.storage
      .from('contracts')
      .list();

    if (filesError) {
      console.log('❌ خطأ في فحص الملفات:', filesError);
    } else {
      console.log(`   📁 عدد الملفات: ${files.length}`);
      files.forEach(file => {
        console.log(`   - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
      });
    }

    // 3. اختبار رفع ملف جديد
    console.log('\n3. اختبار رفع ملف جديد:');
    const testFileName = `test-${Date.now()}.pdf`;
    const testContent = Buffer.from('Test PDF content for debugging');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(testFileName, testContent, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.log('❌ فشل رفع الملف:', uploadError);
    } else {
      console.log('✅ تم رفع الملف بنجاح:', uploadData.path);

      // 4. اختبار الحصول على رابط الملف
      console.log('\n4. اختبار الحصول على رابط الملف:');
      
      // رابط عام (لن يعمل لأن bucket خاص)  
      const { data: publicUrl } = supabase.storage
        .from('contracts')
        .getPublicUrl(testFileName);
      console.log('   📎 الرابط العام:', publicUrl.publicUrl);

      // رابط موقع (سيعمل)
      const { data: signedUrl, error: signedError } = await supabase.storage
        .from('contracts')
        .createSignedUrl(testFileName, 3600); // صالح لساعة واحدة

      if (signedError) {
        console.log('❌ فشل إنشاء رابط موقع:', signedError);
      } else {
        console.log('   🔐 الرابط الموقع:', signedUrl.signedUrl);
      }

      // 5. حذف الملف التجريبي
      console.log('\n5. حذف الملف التجريبي:');
      const { error: deleteError } = await supabase.storage
        .from('contracts')
        .remove([testFileName]);

      if (deleteError) {
        console.log('❌ فشل حذف الملف:', deleteError);
      } else {
        console.log('✅ تم حذف الملف التجريبي');
      }
    }

    // 6. فحص العقود الموجودة في قاعدة البيانات
    console.log('\n6. فحص العقود في قاعدة البيانات:');
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .limit(5);

    if (contractsError) {
      console.log('❌ خطأ في فحص العقود:', contractsError);
    } else {
      console.log(`   📋 عدد العقود: ${contracts.length}`);
      contracts.forEach((contract, index) => {
        console.log(`   ${index + 1}. ID: ${contract.id}`);
        console.log(`      - contract1_url: ${contract.contract1_url}`);
        console.log(`      - contract2_url: ${contract.contract2_url}`);
        console.log(`      - status: ${contract.status}`);
      });
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

debugContractsStorage();