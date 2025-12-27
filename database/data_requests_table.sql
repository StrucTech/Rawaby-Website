-- جدول طلبات البيانات الإضافية من المشرف للعميل
-- Data requests table for supervisor to client communication

CREATE TABLE IF NOT EXISTS data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- الطلب المرتبط
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- المشرف الذي أرسل الطلب
  supervisor_id UUID NOT NULL REFERENCES users(id),
  
  -- العميل المستهدف
  client_id UUID NOT NULL REFERENCES users(id),
  
  -- رسالة المشرف
  message TEXT NOT NULL,
  
  -- حالة الطلب: pending (في انتظار الرد), responded (تم الرد), closed (مغلق)
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
  
  -- ملفات مرفوعة من العميل (JSON array of file objects)
  uploaded_files JSONB DEFAULT '[]',
  
  -- تاريخ الإنشاء
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- تاريخ رد العميل
  responded_at TIMESTAMPTZ,
  
  -- تاريخ إغلاق الطلب
  closed_at TIMESTAMPTZ,
  
  -- ملاحظة العميل مع الملفات
  client_note TEXT,
  
  -- من رد على الرسالة: supervisor (المشرف) أو client (العميل)
  responded_by VARCHAR(20) DEFAULT NULL CHECK (responded_by IN ('supervisor', 'client')),
  
  -- معرف من رد (supervisor_id أو client_id)
  responded_by_id UUID DEFAULT NULL REFERENCES users(id),
  
  -- رد المشرف على رسالة العميل
  supervisor_reply TEXT DEFAULT NULL,
  
  -- تاريخ رد المشرف
  supervisor_replied_at TIMESTAMPTZ DEFAULT NULL
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_data_requests_order_id ON data_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_supervisor_id ON data_requests(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_client_id ON data_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_status ON data_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_requests_responded_by ON data_requests(responded_by);

-- تفعيل RLS
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;

-- سياسات RLS
-- المشرفين يمكنهم رؤية طلباتهم
CREATE POLICY "Supervisors can view their requests" ON data_requests
  FOR SELECT
  TO authenticated
  USING (supervisor_id = auth.uid() OR client_id = auth.uid());

-- المشرفين يمكنهم إنشاء طلبات
CREATE POLICY "Supervisors can create requests" ON data_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (supervisor_id = auth.uid());

-- يمكن تحديث الطلبات من المشرف أو العميل
CREATE POLICY "Allow updates" ON data_requests
  FOR UPDATE
  TO authenticated
  USING (supervisor_id = auth.uid() OR client_id = auth.uid());

-- منح صلاحيات
GRANT ALL ON data_requests TO authenticated;
GRANT SELECT ON data_requests TO anon;

-- إنشاء bucket للملفات المرفوعة
-- يجب تنفيذ هذا في Supabase Storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('client-uploads', 'client-uploads', true);
