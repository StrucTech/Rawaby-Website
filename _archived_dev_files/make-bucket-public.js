require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeContractsBucketPublic() {
  try {
    console.log('🔓 تحويل bucket العقود إلى عام...');

    // تحديث bucket لجعله عام
    const { data, error } = await supabase.storage.updateBucket('contracts', {
      public: true
    });

    if (error) {
      console.log('❌ فشل في تحديث bucket:', error.message);
      
      // محاولة إعادة إنشاء bucket
      console.log('🔄 محاولة إعادة إنشاء bucket...');
      
      // حذف bucket القديم (احذر: سيحذف جميع الملفات!)
      const { error: deleteError } = await supabase.storage.deleteBucket('contracts');
      if (deleteError) {
        console.log('⚠️ لا يمكن حذف bucket القديم:', deleteError.message);
      }

      // إنشاء bucket جديد عام
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('contracts', {
        public: true,
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

      if (createError) {
        console.log('❌ فشل في إنشاء bucket جديد:', createError.message);
        return;
      } else {
        console.log('✅ تم إنشاء bucket عام جديد');
      }
    } else {
      console.log('✅ تم تحديث bucket ليصبح عام');
    }

    // فحص النتيجة
    const { data: buckets } = await supabase.storage.listBuckets();
    const contractsBucket = buckets.find(b => b.name === 'contracts');
    
    if (contractsBucket) {
      console.log(`📁 bucket العقود: ${contractsBucket.public ? 'عام ✅' : 'خاص ❌'}`);
      
      if (contractsBucket.public) {
        // اختبار رابط عام
        console.log('\n🧪 اختبار رابط عام...');
        const testFileName = `test-public-${Date.now()}.pdf`;
        const testContent = Buffer.from('Test public access');

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(testFileName, testContent, {
            contentType: 'application/pdf'
          });

        if (!uploadError) {
          const { data: publicUrl } = supabase.storage
            .from('contracts')
            .getPublicUrl(testFileName);
          
          console.log('🔗 رابط الاختبار:', publicUrl.publicUrl);
          
          // حذف الملف التجريبي
          await supabase.storage.from('contracts').remove([testFileName]);
          console.log('🗑️ تم حذف ملف الاختبار');
        }
      }
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

makeContractsBucketPublic();