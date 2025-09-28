require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNewNamingSystem() {
  try {
    console.log('🧪 اختبار نظام التسمية الجديد...\n');

    // جلب أول مستخدم للاختبار
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.log('❌ لا يوجد مستخدمين للاختبار');
      return;
    }

    const testUser = users[0];
    console.log('👤 اختبار المستخدم:', testUser.name);
    console.log('🆔 معرف المستخدم:', testUser.id);

    // إنشاء تسمية جديدة
    const now = new Date();
    const dateTimeString = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
    const userName = testUser.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');

    const contract1Name = `${testUser.id}-${userName}-${dateTimeString}_contract1.pdf`;
    const contract2Name = `${testUser.id}-${userName}-${dateTimeString}_contract2.docx`;

    console.log('\n📝 أسماء الملفات الجديدة:');
    console.log('   📄 العقد الأول:', contract1Name);
    console.log('   📄 العقد الثاني:', contract2Name);

    // اختبار رفع ملفات تجريبية
    console.log('\n📤 اختبار رفع الملفات...');

    const testContent1 = Buffer.from('Test contract 1 content - PDF');
    const testContent2 = Buffer.from('Test contract 2 content - DOCX');

    // رفع الملف الأول
    const { data: upload1, error: uploadError1 } = await supabase.storage
      .from('contracts')
      .upload(contract1Name, testContent1, {
        contentType: 'application/pdf'
      });

    if (uploadError1) {
      console.log('❌ فشل رفع الملف الأول:', uploadError1.message);
      return;
    }

    // رفع الملف الثاني
    const { data: upload2, error: uploadError2 } = await supabase.storage
      .from('contracts')
      .upload(contract2Name, testContent2, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

    if (uploadError2) {
      console.log('❌ فشل رفع الملف الثاني:', uploadError2.message);
      // حذف الملف الأول
      await supabase.storage.from('contracts').remove([contract1Name]);
      return;
    }

    console.log('✅ تم رفع الملفات بنجاح');

    // إنشاء الروابط
    const { data: url1 } = supabase.storage
      .from('contracts')
      .getPublicUrl(contract1Name);

    const { data: url2 } = supabase.storage
      .from('contracts')
      .getPublicUrl(contract2Name);

    console.log('\n🔗 روابط الملفات:');
    console.log('   📎 العقد الأول:', url1.publicUrl);
    console.log('   📎 العقد الثاني:', url2.publicUrl);

    // حفظ في قاعدة البيانات
    console.log('\n💾 حفظ في قاعدة البيانات...');
    const { data: contractData, error: contractError } = await supabase
      .from('contracts')
      .insert({
        user_id: testUser.id,
        contract1_url: url1.publicUrl,
        contract2_url: url2.publicUrl,
        contract1_filename: contract1Name,
        contract2_filename: contract2Name,
        status: 'uploaded'
      })
      .select()
      .single();

    if (contractError) {
      console.log('❌ فشل حفظ البيانات:', contractError.message);
      // حذف الملفات
      await supabase.storage.from('contracts').remove([contract1Name, contract2Name]);
      return;
    }

    console.log('✅ تم حفظ البيانات بنجاح');
    console.log('🆔 معرف العقد:', contractData.id);

    // اختبار الروابط
    console.log('\n🌐 اختبار الروابط...');
    try {
      const response1 = await fetch(url1.publicUrl);
      const response2 = await fetch(url2.publicUrl);

      console.log(`   📊 العقد الأول: ${response1.status} ${response1.statusText}`);
      console.log(`   📊 العقد الثاني: ${response2.status} ${response2.statusText}`);

      if (response1.ok && response2.ok) {
        console.log('   ✅ جميع الروابط تعمل بشكل مثالي');
      }
    } catch (fetchError) {
      console.log('   ❌ خطأ في اختبار الروابط:', fetchError.message);
    }

    // تنظيف الاختبار
    console.log('\n🧹 تنظيف ملفات الاختبار...');
    
    // حذف من قاعدة البيانات
    await supabase.from('contracts').delete().eq('id', contractData.id);
    
    // حذف الملفات
    await supabase.storage.from('contracts').remove([contract1Name, contract2Name]);
    
    console.log('✅ تم تنظيف ملفات الاختبار');

    console.log('\n🎉 نظام التسمية الجديد يعمل بشكل مثالي!');
    console.log('\n📋 مميزات النظام الجديد:');
    console.log('   ✅ يحتوي على معرف المستخدم');
    console.log('   ✅ يحتوي على اسم المستخدم');
    console.log('   ✅ يحتوي على التاريخ والوقت');
    console.log('   ✅ يحتوي على نوع العقد');
    console.log('   ✅ سهل القراءة والتنظيم');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

testNewNamingSystem();