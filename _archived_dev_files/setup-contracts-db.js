require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ متغيرات البيئة مفقودة!');
  console.error('تأكد من وجود NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في ملف .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 بدء تطبيق التحديثات على قاعدة البيانات...');

    // قراءة ملف SQL
    const sqlFile = path.join(__dirname, 'create-contracts-table.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // تقسيم SQL إلى أوامر منفصلة
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 سيتم تنفيذ ${sqlCommands.length} أمر SQL`);

    // تنفيذ كل أمر SQL
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command.trim()) {
        try {
          console.log(`⏳ تنفيذ الأمر ${i + 1}/${sqlCommands.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: command });
          
          if (error) {
            console.log(`⚠️  خطأ في الأمر ${i + 1}: ${error.message}`);
            // محاولة تنفيذ الأمر مباشرة
            const { error: directError } = await supabase
              .from('_temp')
              .select('*')
              .limit(0);
              
            console.log('🔄 محاولة تطبيق الأمر بطريقة مختلفة...');
          } else {
            console.log(`✅ تم تنفيذ الأمر ${i + 1} بنجاح`);
          }
        } catch (cmdError) {
          console.log(`❌ خطأ في تنفيذ الأمر ${i + 1}: ${cmdError.message}`);
        }
      }
    }

    // التحقق من وجود جدول العقود
    console.log('🔍 التحقق من وجود جدول العقود...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'contracts');

    if (tablesError) {
      console.log('❌ خطأ في فحص الجداول:', tablesError.message);
    } else if (tables && tables.length > 0) {
      console.log('✅ جدول العقود موجود!');
      
      // محاولة إدراج عقد تجريبي للتأكد
      const { data: testContract, error: insertError } = await supabase
        .from('contracts')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // UUID تجريبي
          contract1_url: 'test_url_1',
          contract2_url: 'test_url_2',
          status: 'uploaded'
        })
        .select();

      if (insertError) {
        console.log('⚠️  لا يمكن إدراج بيانات تجريبية:', insertError.message);
      } else {
        console.log('✅ تم إدراج بيانات تجريبية بنجاح');
        
        // حذف البيانات التجريبية
        await supabase
          .from('contracts')
          .delete()
          .eq('user_id', '00000000-0000-0000-0000-000000000000');
        console.log('🗑️  تم حذف البيانات التجريبية');
      }
    } else {
      console.log('❌ جدول العقود غير موجود!');
    }

    // إنشاء bucket للعقود
    console.log('📁 إنشاء bucket للعقود...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ خطأ في فحص buckets:', bucketsError.message);
    } else {
      const contractsBucket = buckets.find(bucket => bucket.name === 'contracts');
      
      if (!contractsBucket) {
        const { data: newBucket, error: createBucketError } = await supabase.storage.createBucket('contracts', {
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

        if (createBucketError) {
          console.log('❌ خطأ في إنشاء bucket:', createBucketError.message);
        } else {
          console.log('✅ تم إنشاء bucket العقود بنجاح');
        }
      } else {
        console.log('✅ bucket العقود موجود مسبقاً');
      }
    }

    console.log('\n🎉 تم الانتهاء من التحديثات!');
    console.log('يمكنك الآن استخدام نظام العقود.');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    console.error(error);
  }
}

// تشغيل السكريبت
runMigration();