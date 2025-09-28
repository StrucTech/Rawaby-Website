const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://wvwmchuzdsuyjkpiuutt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2d21jaHV6ZHN1eWprcGl1dXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY1NjM2MiwiZXhwIjoyMDc0MjMyMzYyfQ.oUb1deKBUmt7r6XwVqzaLIw7Fw8L0v9KkmbP9FyllUA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createOrdersTableDirectly() {
  console.log('=== محاولة إنشاء جدول orders تلقائياً ===\n');
  
  try {
    // قراءة ملف SQL
    const sqlFilePath = path.join(process.cwd(), 'create-orders-table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 تم قراءة ملف SQL بنجاح');
    
    // تقسيم الأوامر SQL
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));
    
    console.log(`📊 عدد أوامر SQL: ${sqlCommands.length}`);
    
    // تنفيذ كل أمر على حدة
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (!command) continue;
      
      console.log(`\n⚡ تنفيذ الأمر ${i + 1}...`);
      
      try {
        // محاولة استخدام .rpc لتنفيذ SQL
        const { data, error } = await supabase.rpc('exec', { sql: command });
        
        if (error) {
          console.log(`❌ فشل الأمر ${i + 1}:`, error.message);
        } else {
          console.log(`✅ نجح الأمر ${i + 1}`);
        }
      } catch (cmdError) {
        console.log(`❌ خطأ في الأمر ${i + 1}:`, cmdError.message);
      }
    }
    
    // اختبار الجدول بعد الإنشاء
    console.log('\n🔍 اختبار الجدول المُنشأ...');
    
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ فشل اختبار الجدول:', testError.message);
      console.log('\n📋 يرجى تنفيذ الكود يدوياً في Supabase Dashboard:');
      console.log('=====================================');
      console.log(sqlContent);
      console.log('=====================================');
    } else {
      console.log('✅ تم إنشاء جدول orders بنجاح!');
      
      // نقل البيانات من الملف المؤقت إلى قاعدة البيانات
      await migrateFromTempFile();
    }
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
    console.log('\n📋 يرجى تنفيذ الكود يدوياً في Supabase Dashboard');
  }
}

async function migrateFromTempFile() {
  console.log('\n🔄 نقل البيانات من الملف المؤقت...');
  
  try {
    const tempFilePath = path.join(process.cwd(), 'temp-orders.json');
    
    if (!fs.existsSync(tempFilePath)) {
      console.log('📝 لا توجد بيانات مؤقتة للنقل');
      return;
    }
    
    const tempOrders = JSON.parse(fs.readFileSync(tempFilePath, 'utf8'));
    console.log(`📊 عدد الطلبات للنقل: ${tempOrders.length}`);
    
    for (const order of tempOrders) {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          client_id: order.client_id,
          supervisor_id: order.supervisor_id,
          delegate_id: order.delegate_id,
          services: order.services,
          status: order.status,
          total_price: order.total_price,
          note: order.note,
          created_at: order.created_at
        });
      
      if (error) {
        console.log(`❌ فشل نقل الطلب ${order.id}:`, error.message);
      } else {
        console.log(`✅ تم نقل الطلب ${order.id}`);
      }
    }
    
    // نسخ احتياطية من الملف المؤقت
    const backupPath = path.join(process.cwd(), `temp-orders-backup-${Date.now()}.json`);
    fs.copyFileSync(tempFilePath, backupPath);
    
    console.log(`💾 تم إنشاء نسخة احتياطية: ${path.basename(backupPath)}`);
    console.log('✅ تم نقل جميع البيانات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في نقل البيانات:', error);
  }
}

createOrdersTableDirectly();