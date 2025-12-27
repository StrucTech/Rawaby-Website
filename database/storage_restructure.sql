-- =============================================
-- SQL Script: إعادة هيكلة تخزين العقود
-- تاريخ: ديسمبر 2025
-- =============================================

-- 1. تحديث جدول contracts لدعم البنية الجديدة
-- إضافة أعمدة جديدة إذا لم تكن موجودة

-- إضافة عمود storage_bucket لتحديد مكان التخزين
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'storage_bucket') THEN
        ALTER TABLE contracts ADD COLUMN storage_bucket VARCHAR(100) DEFAULT 'client-contracts';
    END IF;
END $$;

-- إضافة عمود client_folder لتحديد مجلد العميل
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'client_folder') THEN
        ALTER TABLE contracts ADD COLUMN client_folder VARCHAR(255);
    END IF;
END $$;

-- إضافة عمود contract_type للتفريق بين القوالب والموقعة
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'contract_type') THEN
        ALTER TABLE contracts ADD COLUMN contract_type VARCHAR(50) DEFAULT 'signed';
    END IF;
END $$;

-- تحديث التعليقات على الجدول
COMMENT ON TABLE contracts IS 'جدول العقود الموقعة من العملاء - يتم تخزينها في bucket: client-contracts';
COMMENT ON COLUMN contracts.storage_bucket IS 'اسم الـ bucket في Supabase Storage (client-contracts)';
COMMENT ON COLUMN contracts.client_folder IS 'مجلد العميل بتنسيق: اسم-العميل-id';
COMMENT ON COLUMN contracts.contract_type IS 'نوع العقد: signed (موقع) أو template (قالب)';

-- 2. عرض هيكل الجدول بعد التحديث
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'contracts'
-- ORDER BY ordinal_position;

-- =============================================
-- ملاحظات هامة حول البنية الجديدة:
-- =============================================
-- 
-- 📁 contract-templates (PUBLIC bucket)
--    └── contract1.docx   (العقد الفارغ الأول)
--    └── contract2.docx   (العقد الفارغ الثاني)
--    
--    الغرض: قوالب العقود الفارغة التي ترسل للعملاء
--    الوصول: عام (public) - يمكن لأي شخص تحميلها
--    
-- 📁 client-contracts (PRIVATE bucket)
--    └── [اسم-العميل-id]/
--        └── order-[orderId]/
--            └── contract1_signed_[timestamp].pdf
--            └── contract2_signed_[timestamp].pdf
--    
--    الغرض: العقود الموقعة والممتلئة من العملاء
--    الوصول: خاص (private) - فقط للمستخدمين المصرح لهم
--    
-- =============================================
