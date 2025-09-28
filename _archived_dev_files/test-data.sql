-- إدراج بيانات تجريبية للاختبار

-- 1. إنشاء مستخدمين تجريبيين
INSERT INTO users (id, name, email, password, role, active, email_verified, user_id, phone, national_id, country) 
VALUES 
-- الأدمن الرئيسي (إذا لم يكن موجود)
('0f876f0c-f2ca-411e-8692-e63265ce44f3', 'OWNER', 'owner@gmail.com', '$2b$10$hashedpassword', 'admin', true, true, 1, '966500000001', '1000000001', 'السعودية'),

-- مشرفين تجريبيين
('11111111-1111-1111-1111-111111111111', 'محمد أحمد', 'supervisor1@gmail.com', '$2b$10$hashedpassword', 'supervisor', true, true, 1001, '966500000002', '1000000002', 'السعودية'),
('22222222-2222-2222-2222-222222222222', 'سارة محمد', 'supervisor2@gmail.com', '$2b$10$hashedpassword', 'supervisor', true, true, 1002, '966500000003', '1000000003', 'السعودية'),

-- مندوبين تجريبيين
('33333333-3333-3333-3333-333333333333', 'أحمد علي', 'delegate1@gmail.com', '$2b$10$hashedpassword', 'delegate', true, true, 2001, '966500000004', '1000000004', 'السعودية'),
('44444444-4444-4444-4444-444444444444', 'فاطمة حسن', 'delegate2@gmail.com', '$2b$10$hashedpassword', 'delegate', true, true, 2002, '966500000005', '1000000005', 'السعودية'),
('55555555-5555-5555-5555-555555555555', 'Mandob', 'mandob@gmail.com', '$2b$10$hashedpassword', 'delegate', true, true, 2003, '966500000006', '1000000006', 'السعودية')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    active = EXCLUDED.active,
    email_verified = EXCLUDED.email_verified;

-- 2. ربط المشرفين بالمندوبين
INSERT INTO supervisor_delegates (supervisor_id, delegate_id)
VALUES 
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444'),
('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555')
ON CONFLICT (supervisor_id, delegate_id) DO NOTHING;

-- 3. إنشاء خدمات تجريبية
INSERT INTO services (id, title, description, duration_days, price)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'خدمة تعليمية أساسية', 'وصف الخدمة التعليمية الأساسية', 7, 500.00),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'خدمة تعليمية متقدمة', 'وصف الخدمة التعليمية المتقدمة', 14, 1000.00),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'استشارة تعليمية', 'استشارة تعليمية شخصية', 3, 250.00)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    duration_days = EXCLUDED.duration_days,
    price = EXCLUDED.price;

-- 4. عرض النتائج للتأكد
SELECT 'Users created:' as info, count(*) as count FROM users WHERE role IN ('admin', 'supervisor', 'delegate');
SELECT 'Supervisors:' as info, count(*) as count FROM users WHERE role = 'supervisor';
SELECT 'Delegates:' as info, count(*) as count FROM users WHERE role = 'delegate';
SELECT 'Supervisor-Delegate relationships:' as info, count(*) as count FROM supervisor_delegates;
SELECT 'Services:' as info, count(*) as count FROM services;

-- 5. عرض تفاصيل المستخدمين
SELECT 
    name,
    email,
    role,
    user_id,
    active,
    email_verified
FROM users 
WHERE role IN ('admin', 'supervisor', 'delegate')
ORDER BY role, name;