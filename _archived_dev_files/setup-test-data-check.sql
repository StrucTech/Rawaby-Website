-- التحقق من البيانات التجريبية وإضافتها إذا لم تكن موجودة

-- 1. التحقق من المستخدم التجريبي
SELECT 'مستخدم تجريبي' as type, COUNT(*) as count 
FROM users 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- إضافة المستخدم التجريبي إذا لم يكن موجوداً
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
)
ON CONFLICT (id) DO NOTHING;

-- 2. التحقق من الخدمات وإضافتها
SELECT 'خدمات' as type, COUNT(*) as count FROM services;

-- إضافة الخدمات التجريبية إذا لم تكن موجودة
INSERT INTO services (id, title, description, duration_days, price, active) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'خدمة تعليمية أساسية', 'وصف الخدمة التعليمية الأساسية للطلاب المتميزين', 7, 500.00, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'خدمة تعليمية متقدمة', 'وصف الخدمة التعليمية المتقدمة مع متابعة شخصية', 14, 1000.00, true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'استشارة تعليمية', 'استشارة تعليمية شخصية مع خبراء التعليم', 3, 250.00, true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'دورة تدريبية مكثفة', 'دورة تدريبية مكثفة لرفع المستوى الأكاديمي', 21, 1500.00, true)
ON CONFLICT (id) DO NOTHING;

-- 3. عرض النتائج النهائية
SELECT 'المستخدمون' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'الخدمات' as table_name, COUNT(*) as count FROM services
UNION ALL
SELECT 'الطلبات' as table_name, COUNT(*) as count FROM orders;