// اختبار المتغيرات البيئية والاتصال بـ Supabase
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 فحص المتغيرات البيئية...\n');

// التحقق من المتغيرات المطلوبة
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
];

let allVarsPresent = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: موجود`);
  } else {
    console.log(`❌ ${varName}: غير موجود`);
    allVarsPresent = false;
  }
});

console.log('\n' + '='.repeat(50) + '\n');

if (!allVarsPresent) {
  console.log('❌ بعض المتغيرات البيئية مفقودة!');
  console.log('📝 يرجى إضافتها إلى ملف .env.local');
  process.exit(1);
}

// اختبار الاتصال بـ Supabase
console.log('🔗 اختبار الاتصال بـ Supabase...\n');

async function testSupabaseConnection() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // اختبار جلب المستخدمين
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ خطأ في الاتصال بـ Supabase:');
      console.log(`   ${error.message}`);
      
      if (error.message.includes('table "users" does not exist')) {
        console.log('\n💡 الحل: قم بتنفيذ database-schema-new.sql في Supabase SQL Editor');
      }
      
      return false;
    } else {
      console.log('✅ تم الاتصال بـ Supabase بنجاح');
      console.log('✅ جدول users موجود');
      return true;
    }
  } catch (error) {
    console.log('❌ خطأ عام في الاتصال:');
    console.log(`   ${error.message}`);
    return false;
  }
}

// اختبار إعدادات SMTP
console.log('📧 فحص إعدادات البريد الإلكتروني...\n');

const emailVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
emailVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName === 'SMTP_PASS' ? '***مخفي***' : value}`);
  } else {
    console.log(`⚠️  ${varName}: غير محدد (اختياري)`);
  }
});

console.log('\n' + '='.repeat(50) + '\n');

// تشغيل اختبار Supabase
testSupabaseConnection().then(success => {
  console.log('\n' + '='.repeat(50) + '\n');
  
  if (success) {
    console.log('🎉 جميع الإعدادات صحيحة!');
    console.log('🚀 يمكنك الآن تشغيل: npm run dev');
  } else {
    console.log('❌ يرجى إصلاح مشاكل Supabase أولاً');
  }
  
  console.log('\n📖 راجع SETUP_GUIDE.md للحصول على تعليمات مفصلة');
});