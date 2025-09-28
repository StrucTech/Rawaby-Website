-- اختبار إنشاء طلب مباشر في قاعدة البيانات
-- للتأكد من أن الجدول يعمل بشكل صحيح

-- اختبار 1: إنشاء طلب بسيط
INSERT INTO orders (
    client_id,
    service_ids, 
    status,
    total_price,
    payment_method,
    metadata
) VALUES (
    (SELECT id FROM users WHERE role = 'user' LIMIT 1), -- أول مستخدم
    ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'], -- خدمة تجريبية
    'new',
    500.00,
    'credit',
    jsonb_build_object(
        'paymentMethod', 'credit',
        'paymentTimestamp', NOW(),
        'guardianName', 'اختبار ولي الأمر',
        'serviceName', 'خدمة اختبار',
        'studentInfo', jsonb_build_object(
            'name', 'اختبار الطالب',
            'grade', 'الثالث الثانوي'
        )
    )
);

-- التحقق من إنشاء الطلب
SELECT 
    'تم إنشاء الطلب' as message,
    id,
    client_id,
    service_ids,
    status,
    total_price,
    payment_method,
    metadata->>'guardianName' as guardian_name,
    metadata->>'serviceName' as service_name,
    created_at
FROM orders 
WHERE created_at > NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC
LIMIT 1;

-- عرض جميع الطلبات الموجودة
SELECT 
    'جميع الطلبات:' as info,
    COUNT(*) as total_orders
FROM orders;

-- عرض تفصيلي لأحدث 5 طلبات
SELECT 
    'أحدث الطلبات:' as info,
    o.id,
    u.name as client_name,
    u.email as client_email,
    o.status,
    o.total_price,
    o.metadata->>'guardianName' as guardian_name,
    o.metadata->>'serviceName' as service_name,
    o.created_at
FROM orders o
LEFT JOIN users u ON o.client_id = u.id
ORDER BY o.created_at DESC
LIMIT 5;

-- التحقق من الحقول المطلوبة
SELECT 
    'فحص هيكل الجدول:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;