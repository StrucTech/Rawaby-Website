-- تحديث بسيط لجدول الطلبات للتأكد من الهيكل الصحيح
-- لتشغيل هذا بأمان في Supabase SQL Editor

-- التحقق من هيكل جدول orders الحالي
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- عرض عدد الطلبات الموجودة
SELECT 
    'إجمالي الطلبات' as description,
    COUNT(*) as count
FROM orders;

-- عرض آخر 3 طلبات مع تفاصيلها
SELECT 
    o.id,
    o.status,
    o.total_price,
    o.payment_method,
    o.created_at,
    u.name as client_name,
    u.email as client_email
FROM orders o
LEFT JOIN users u ON o.client_id = u.id
ORDER BY o.created_at DESC
LIMIT 3;