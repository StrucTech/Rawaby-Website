-- تحديث جدول العقود لجعل order_id اختياري
-- هذا يحل مشكلة رفع العقود قبل إنشاء الطلب

-- إزالة القيد NOT NULL من order_id
ALTER TABLE contracts ALTER COLUMN order_id DROP NOT NULL;

-- إضافة فهرس لتحسين البحث
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_order_id ON contracts(order_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- عرض هيكل الجدول المحدث
SELECT 
    'تم تحديث جدول العقود' as message,
    'order_id أصبح اختياري الآن' as note;

-- اختبار إدراج عقد بدون طلب
INSERT INTO contracts (user_id, contract1_url, contract2_url, contract1_filename, contract2_filename) 
VALUES (
    (SELECT id FROM users WHERE role = 'user' LIMIT 1),
    'test-contract-1-url',
    'test-contract-2-url', 
    'test-contract-1.pdf',
    'test-contract-2.pdf'
)
ON CONFLICT DO NOTHING;

-- عرض العقود الموجودة
SELECT 
    'العقود الحالية:' as info,
    id,
    user_id,
    order_id,
    contract1_filename,
    contract2_filename,
    status,
    created_at
FROM contracts
ORDER BY created_at DESC;