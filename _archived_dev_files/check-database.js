require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ متغيرات البيئة مفقودة!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ موجود' : '❌ مفقود');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ موجود' : '❌ مفقود');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  try {
    console.log('🔍 فحص حالة قاعدة البيانات...\n');

    // فحص الاتصال
    console.log('1. فحص الاتصال بـ Supabase...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (healthError) {
      console.log('❌ خطأ في الاتصال:', healthError.message);
      return;
    } else {
      console.log('✅ الاتصال سليم');
    }

    // فحص الجداول الموجودة
    console.log('\n2. فحص الجداول الموجودة...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list');

    if (tablesError) {
      console.log('⚠️  لا يمكن جلب قائمة الجداول:', tablesError.message);
      
      // محاولة بديلة - فحص جداول محددة
      const tablesToCheck = ['users', 'services', 'orders', 'guardians', 'students', 'contracts'];
      
      for (const tableName of tablesToCheck) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (error) {
            console.log(`❌ ${tableName}: غير موجود (${error.message})`);
          } else {
            console.log(`✅ ${tableName}: موجود`);
          }
        } catch (err) {
          console.log(`❌ ${tableName}: خطأ في الفحص`);
        }
      }
    } else {
      console.log('✅ الجداول الموجودة:', tables);
    }

    // فحص Storage buckets
    console.log('\n3. فحص Storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ خطأ في فحص buckets:', bucketsError.message);
    } else {
      console.log('📁 Buckets الموجودة:');
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'عام' : 'خاص'})`);
      });
      
      const contractsBucket = buckets.find(b => b.name === 'contracts');
      if (contractsBucket) {
        console.log('✅ bucket العقود موجود');
      } else {
        console.log('❌ bucket العقود غير موجود');
      }
    }

    // فحص العقود الموجودة
    console.log('\n4. فحص العقود الموجودة...');
    try {
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .limit(5);

      if (contractsError) {
        console.log('❌ جدول العقود غير موجود:', contractsError.message);
      } else {
        console.log(`✅ جدول العقود موجود (${contracts.length} عقد)`);
        if (contracts.length > 0) {
          console.log('📋 أول عقد:', contracts[0]);
        }
      }
    } catch (err) {
      console.log('❌ خطأ في فحص العقود:', err.message);
    }

    console.log('\n🏁 انتهى الفحص');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }
}

// تشغيل السكريبت
checkDatabase();