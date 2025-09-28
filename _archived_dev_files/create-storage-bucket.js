require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createContractsBucket() {
  try {
    console.log('📁 إنشاء bucket للعقود...');

    // إنشاء bucket العقود
    const { data, error } = await supabase.storage.createBucket('contracts', {
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ],
      fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
      console.log('❌ خطأ في إنشاء bucket:', error.message);
      
      // التحقق إذا كان موجود مسبقاً
      const { data: buckets } = await supabase.storage.listBuckets();
      const existingBucket = buckets?.find(b => b.name === 'contracts');
      
      if (existingBucket) {
        console.log('✅ bucket العقود موجود مسبقاً');
      }
    } else {
      console.log('✅ تم إنشاء bucket العقود بنجاح');
    }

    // فحص bucket النهائي
    const { data: finalBuckets } = await supabase.storage.listBuckets();
    const contractsBucket = finalBuckets?.find(b => b.name === 'contracts');
    
    if (contractsBucket) {
      console.log('🎉 bucket العقود جاهز للاستخدام');
      
      // اختبار رفع ملف تجريبي
      console.log('🧪 اختبار رفع ملف تجريبي...');
      const testFile = Buffer.from('Test contract content');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload('test-file.txt', testFile, {
          contentType: 'text/plain'
        });

      if (uploadError) {
        console.log('❌ خطأ في اختبار الرفع:', uploadError.message);
      } else {
        console.log('✅ اختبار الرفع نجح');
        
        // حذف الملف التجريبي
        await supabase.storage
          .from('contracts')
          .remove(['test-file.txt']);
        console.log('🗑️ تم حذف الملف التجريبي');
      }
    } else {
      console.log('❌ لم يتم إنشاء bucket العقود');
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }
}

createContractsBucket();