-- فحص شامل لجدول الطلبات في قاعدة البيانات
-- يمكنك تشغيل هذا السكريپت في Supabase SQL Editor

-- 1. عرض هيكل جدول الطلبات
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. عد إجمالي الطلبات
SELECT COUNT(*) as total_orders FROM orders;

-- 3. عرض آخر 10 طلبات مع تفاصيل المستخدم
SELECT 
    o.id,
    o.user_id,
    u.name as user_name,
    u.email as user_email,
    o.total_price,
    o.status,
    o.payment_method,
    o.created_at,
    o.metadata->>'guardianName' as guardian_name,
    o.metadata->>'serviceName' as service_name,
    o.metadata->>'studentInfo' as student_info
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC
LIMIT 10;

-- 4. إحصائيات الطلبات حسب الحالة
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_price) as total_amount
FROM orders
GROUP BY status
ORDER BY count DESC;

-- 5. إحصائيات الطلبات حسب طريقة الدفع
SELECT 
    payment_method,
    COUNT(*) as count,
    AVG(total_price) as avg_amount
FROM orders
GROUP BY payment_method
ORDER BY count DESC;

-- 6. عرض الطلبات التي تم إنشاؤها اليوم
SELECT 
    o.id,
    u.name as user_name,
    o.total_price,
    o.status,
    o.created_at
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE DATE(o.created_at) = CURRENT_DATE
ORDER BY o.created_at DESC;

-- 7. البحث عن طلبات بدون مستخدم مرتبط
SELECT 
    id,
    user_id,
    total_price,
    status,
    created_at
FROM orders 
WHERE user_id NOT IN (SELECT id FROM users)
ORDER BY created_at DESC;

-- 8. فحص سلامة البيانات - الطلبات مع metadata فارغة
SELECT 
    id,
    user_id,
    total_price,
    status,
    created_at,
    metadata
FROM orders 
WHERE metadata IS NULL OR metadata = '{}'::jsonb
ORDER BY created_at DESC;