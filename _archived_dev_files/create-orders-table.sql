-- إنشاء جدول orders في قاعدة بيانات Supabase
-- يرجى تنفيذ هذا الكود في SQL Editor في Supabase Dashboard

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id text NOT NULL,
  supervisor_id text,
  delegate_id text,
  services text[] DEFAULT '{}',
  status text DEFAULT 'new',
  total_price decimal DEFAULT 0,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إنشاء indexes للبحث السريع
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_supervisor_id ON public.orders(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_orders_delegate_id ON public.orders(delegate_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- تفعيل Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات (Policies)
-- سياسة القراءة: كل المستخدمين المسجلين يمكنهم قراءة الطلبات
CREATE POLICY IF NOT EXISTS "Enable read for authenticated users" ON public.orders
  FOR SELECT TO authenticated
  USING (true);

-- سياسة الإدراج: المستخدمون المسجلون فقط يمكنهم إنشاء طلبات
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- سياسة التحديث: المستخدمون المسجلون فقط يمكنهم تحديث الطلبات
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users" ON public.orders
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);