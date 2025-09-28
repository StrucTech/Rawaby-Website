-- التأكد من وجود البيانات التجريبية المطلوبة لاختبار الطلبات

-- 1. التحقق من وجود المستخدم التجريبي
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = '11111111-1111-1111-1111-111111111111') THEN
        INSERT INTO users (id, name, email, phone, national_id, password, role, email_verified) 
        VALUES (
            '11111111-1111-1111-1111-111111111111',
            'مستخدم تجريبي',
            'test@example.com',
            '01234567890',
            '12345678901234',
            '$2b$10$example.hashed.password.here',
            'user',
            true
        );
        RAISE NOTICE 'تم إنشاء المستخدم التجريبي';
    ELSE
        RAISE NOTICE 'المستخدم التجريبي موجود بالفعل';
    END IF;
END $$;

-- 2. التحقق من وجود الخدمة التجريبية
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM services WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') THEN
        INSERT INTO services (id, title, description, duration_days, price, active) 
        VALUES (
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            'خدمة تجريبية',
            'هذه خدمة تجريبية لاختبار النظام',
            30,
            500.00,
            true
        );
        RAISE NOTICE 'تم إنشاء الخدمة التجريبية';
    ELSE
        RAISE NOTICE 'الخدمة التجريبية موجودة بالفعل';
    END IF;
END $$;

-- 3. عرض إحصائيات سريعة
SELECT 'المستخدمون' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'الخدمات' as table_name, COUNT(*) as count FROM services
UNION ALL
SELECT 'الطلبات' as table_name, COUNT(*) as count FROM orders;

-- 4. التحقق من هيكل جدول الطلبات
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;