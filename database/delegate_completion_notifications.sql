-- جدول إشعارات إتمام المندوب
-- يستخدم لإرسال إشعار من المندوب للمشرف عند إتمام المهمة
-- المشرف هو من يقرر تغيير حالة الطلب إلى "تم الانتهاء بنجاح"

CREATE TABLE IF NOT EXISTS delegate_completion_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  delegate_id UUID REFERENCES users(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) DEFAULT 'delegate_completion',
  message TEXT,
  status VARCHAR(20) DEFAULT 'unread', -- unread, read, acknowledged
  read_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_dcn_supervisor_id ON delegate_completion_notifications(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_dcn_order_id ON delegate_completion_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_dcn_status ON delegate_completion_notifications(status);
CREATE INDEX IF NOT EXISTS idx_dcn_delegate_id ON delegate_completion_notifications(delegate_id);

-- تعليق توضيحي
COMMENT ON TABLE delegate_completion_notifications IS 'إشعارات إتمام المهام من المندوب للمشرف';
COMMENT ON COLUMN delegate_completion_notifications.status IS 'حالة الإشعار: unread=غير مقروء, read=مقروء, acknowledged=تم الاعتراف';
