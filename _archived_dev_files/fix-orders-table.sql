-- تعديل جدول orders لجعل الحقول متوافقة مع البيانات
-- يرجى تنفيذ هذا في SQL Editor في Supabase

-- حذف الجدول الموجود وإعادة إنشاؤه بالتعديلات المطلوبة
DROP TABLE IF EXISTS public.orders;

CREATE TABLE public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id text NOT NULL,
  supervisor_id text,
  delegate_id text,
  services text[] DEFAULT '{}',
  status text DEFAULT 'new',
  total_price numeric DEFAULT 0,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- إنشاء indexes للبحث السريع
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_supervisor_id ON public.orders(supervisor_id);
CREATE INDEX idx_orders_delegate_id ON public.orders(delegate_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

-- تفعيل Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات (Policies)
CREATE POLICY "Enable read for authenticated users" ON public.orders
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.orders
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);