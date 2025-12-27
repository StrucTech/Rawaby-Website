-- إضافة الأعمدة الناقصة لـ data_requests إن وجدت
ALTER TABLE data_requests ADD COLUMN IF NOT EXISTS supervisor_reply TEXT DEFAULT NULL;
ALTER TABLE data_requests ADD COLUMN IF NOT EXISTS supervisor_replied_at TIMESTAMPTZ DEFAULT NULL;

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN data_requests.supervisor_reply IS 'رد المشرف على رسالة العميل';
COMMENT ON COLUMN data_requests.supervisor_replied_at IS 'تاريخ رد المشرف على رسالة العميل';
