const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wvwmchuzdsuyjkpiuutt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2d21jaHV6ZHN1eWprcGl1dXR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY1NjM2MiwiZXhwIjoyMDc0MjMyMzYyfQ.oUb1deKBUmt7r6XwVqzaLIw7Fw8L0v9KkmbP9FyllUA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createOrdersTable() {
  console.log('=== إنشاء جدول orders ===');
  
  try {
    // SQL لإنشاء جدول orders
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.orders (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        client_id varchar REFERENCES public.users(id),
        supervisor_id varchar REFERENCES public.users(id),
        delegate_id varchar REFERENCES public.users(id),
        services text[] DEFAULT '{}',
        status varchar DEFAULT 'new',
        total_price decimal DEFAULT 0,
        note text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      
      -- إنشاء index للبحث السريع
      CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
      CREATE INDEX IF NOT EXISTS idx_orders_supervisor_id ON public.orders(supervisor_id);
      CREATE INDEX IF NOT EXISTS idx_orders_delegate_id ON public.orders(delegate_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
      
      -- تفعيل RLS (Row Level Security)
      ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
      
      -- سياسة للقراءة: المستخدمون يمكنهم قراءة طلباتهم أو الطلبات المخصصة لهم
      CREATE POLICY IF NOT EXISTS "Users can read their own orders" ON public.orders
        FOR SELECT USING (
          auth.uid()::text = client_id OR 
          auth.uid()::text = supervisor_id OR 
          auth.uid()::text = delegate_id
        );
      
      -- سياسة للإدراج: المستخدمون يمكنهم إنشاء طلبات لأنفسهم
      CREATE POLICY IF NOT EXISTS "Users can create their own orders" ON public.orders
        FOR INSERT WITH CHECK (auth.uid()::text = client_id);
      
      -- سياسة للتحديث: المشرفون والمندوبون يمكنهم تحديث الطلبات المخصصة لهم
      CREATE POLICY IF NOT EXISTS "Supervisors and delegates can update assigned orders" ON public.orders
        FOR UPDATE USING (
          auth.uid()::text = supervisor_id OR 
          auth.uid()::text = delegate_id
        );
    `;
    
    console.log('إنشاء جدول orders...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('خطأ في إنشاء الجدول:', error);
      
      // محاولة بديلة: استخدام SQL مباشر
      console.log('محاولة إنشاء الجدول بطريقة مختلفة...');
      
      const { error: createError } = await supabase
        .from('_schema')
        .insert({ 
          sql: createTableSQL 
        });
      
      if (createError) {
        console.error('فشل في الطريقة البديلة أيضاً:', createError);
        console.log('\n⚠️  يرجى تنفيذ الـ SQL التالي يدوياً في Supabase Dashboard:');
        console.log('=====================================');
        console.log(createTableSQL);
        console.log('=====================================');
      }
    } else {
      console.log('✅ تم إنشاء جدول orders بنجاح!');
    }
    
    // اختبار بسيط للجدول
    console.log('\nاختبار الجدول...');
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('count(*)')
      .single();
    
    if (testError) {
      console.error('خطأ في اختبار الجدول:', testError);
    } else {
      console.log('✅ الجدول يعمل بشكل صحيح');
    }
    
  } catch (error) {
    console.error('خطأ عام:', error);
  }
}

createOrdersTable();