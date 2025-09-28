require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function renameExistingContracts() {
  try {
    console.log('🔄 إعادة تسمية العقود الموجودة...\n');

    // جلب جميع العقود الموجودة
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select(`
        id,
        user_id,
        contract1_url,
        contract2_url,
        contract1_filename,
        contract2_filename,
        created_at,
        users!inner(name)
      `);

    if (contractsError) {
      console.error('❌ خطأ في جلب العقود:', contractsError);
      return;
    }

    console.log(`📋 تم العثور على ${contracts.length} عقد للمعالجة\n`);

    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i];
      console.log(`🔄 معالجة العقد ${i + 1}/${contracts.length}:`);
      console.log(`   ID: ${contract.id}`);
      console.log(`   المستخدم: ${contract.users.name}`);

      try {
        // استخراج أسماء الملفات القديمة من الروابط
        const contract1OldName = contract.contract1_url.split('/').pop();
        const contract2OldName = contract.contract2_url.split('/').pop();

        // إنشاء التسمية الجديدة
        const createdDate = new Date(contract.created_at);
        const dateTimeString = createdDate.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
        const userName = contract.users.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');

        const contract1Extension = contract1OldName.split('.').pop();
        const contract2Extension = contract2OldName.split('.').pop();

        const contract1NewName = `${contract.user_id}-${userName}-${dateTimeString}_contract1.${contract1Extension}`;
        const contract2NewName = `${contract.user_id}-${userName}-${dateTimeString}_contract2.${contract2Extension}`;

        console.log(`   📝 الاسم الجديد 1: ${contract1NewName}`);
        console.log(`   📝 الاسم الجديد 2: ${contract2NewName}`);

        // نسخ الملف الأول بالاسم الجديد
        const { data: copyData1, error: copyError1 } = await supabase.storage
          .from('contracts')
          .copy(contract1OldName, contract1NewName);

        if (copyError1) {
          console.log(`   ❌ فشل نسخ الملف الأول: ${copyError1.message}`);
          continue;
        }

        // نسخ الملف الثاني بالاسم الجديد
        const { data: copyData2, error: copyError2 } = await supabase.storage
          .from('contracts')
          .copy(contract2OldName, contract2NewName);

        if (copyError2) {
          console.log(`   ❌ فشل نسخ الملف الثاني: ${copyError2.message}`);
          // حذف الملف الأول المنسوخ
          await supabase.storage.from('contracts').remove([contract1NewName]);
          continue;
        }

        // تحديث الروابط في قاعدة البيانات
        const { data: newUrl1 } = supabase.storage
          .from('contracts')
          .getPublicUrl(contract1NewName);

        const { data: newUrl2 } = supabase.storage
          .from('contracts')
          .getPublicUrl(contract2NewName);

        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            contract1_url: newUrl1.publicUrl,
            contract2_url: newUrl2.publicUrl,
            contract1_filename: contract1NewName,
            contract2_filename: contract2NewName
          })
          .eq('id', contract.id);

        if (updateError) {
          console.log(`   ❌ فشل تحديث قاعدة البيانات: ${updateError.message}`);
          // حذف الملفات المنسوخة
          await supabase.storage.from('contracts').remove([contract1NewName, contract2NewName]);
          continue;
        }

        // حذف الملفات القديمة
        const { error: deleteError } = await supabase.storage
          .from('contracts')
          .remove([contract1OldName, contract2OldName]);

        if (deleteError) {
          console.log(`   ⚠️  تحذير: لم يتم حذف الملفات القديمة: ${deleteError.message}`);
        }

        console.log(`   ✅ تم تحديث العقد بنجاح`);

      } catch (error) {
        console.log(`   ❌ خطأ في معالجة العقد: ${error.message}`);
      }

      console.log(); // سطر فارغ للتنسيق
    }

    console.log('🎉 انتهت عملية إعادة التسمية!');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }
}

// تأكيد من المستخدم قبل التشغيل
console.log('⚠️  هذا السكريبت سيعيد تسمية جميع ملفات العقود الموجودة');
console.log('هل تريد المتابعة؟ اكتب "yes" للمتابعة أو "no" للإلغاء:');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('الإجابة: ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'نعم') {
    renameExistingContracts().finally(() => rl.close());
  } else {
    console.log('تم إلغاء العملية');
    rl.close();
  }
});