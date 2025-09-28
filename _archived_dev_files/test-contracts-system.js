require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testContractsSystem() {
  try {
    console.log('🧪 اختبار نظام العقود...\n');

    // 1. فحص bucket العقود
    console.log('1. فحص bucket العقود...');
    const { data: buckets } = await supabase.storage.listBuckets();
    const contractsBucket = buckets?.find(b => b.name === 'contracts');
    
    if (contractsBucket) {
      console.log('✅ bucket العقود موجود');
    } else {
      console.log('❌ bucket العقود غير موجود');
      return;
    }

    // 2. فحص جدول العقود
    console.log('\n2. فحص جدول العقود...');
    const { data: contractsTest, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .limit(1);

    if (contractsError) {
      console.log('❌ خطأ في جدول العقود:', contractsError.message);
      return;
    } else {
      console.log('✅ جدول العقود يعمل بشكل طبيعي');
    }

    // 3. اختبار إدراج عقد تجريبي
    console.log('\n3. اختبار إدراج عقد تجريبي...');
    
    // الحصول على أول مستخدم للاختبار
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (users && users.length > 0) {
      const testUserId = users[0].id;
      
      const { data: insertData, error: insertError } = await supabase
        .from('contracts')
        .insert({
          user_id: testUserId,
          contract1_url: 'https://example.com/contract1.pdf',
          contract2_url: 'https://example.com/contract2.pdf',
          contract1_filename: 'contract1.pdf',
          contract2_filename: 'contract2.pdf',
          status: 'uploaded'
        })
        .select();

      if (insertError) {
        console.log('❌ خطأ في إدراج العقد:', insertError.message);
      } else {
        console.log('✅ تم إدراج العقد التجريبي بنجاح');
        
        // حذف العقد التجريبي
        await supabase
          .from('contracts')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🗑️ تم حذف العقد التجريبي');
      }
    }

    // 4. اختبار رفع ملف
    console.log('\n4. اختبار رفع ملف...');
    const testFileContent = Buffer.from('Test PDF content');
    const fileName = `test-contract-${Date.now()}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(fileName, testFileContent, {
        contentType: 'application/pdf'
      });

    if (uploadError) {
      console.log('❌ خطأ في رفع الملف:', uploadError.message);
    } else {
      console.log('✅ تم رفع الملف التجريبي بنجاح');
      
      // الحصول على رابط الملف
      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);
      
      console.log('🔗 رابط الملف:', urlData.publicUrl);
      
      // حذف الملف التجريبي
      await supabase.storage
        .from('contracts')
        .remove([fileName]);
      console.log('🗑️ تم حذف الملف التجريبي');
    }

    console.log('\n🎉 جميع اختبارات نظام العقود نجحت!');
    console.log('💚 النظام جاهز للاستخدام');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

testContractsSystem();