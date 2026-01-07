-- إنشاء جدول التقييمات
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT false, -- يحتاج موافقة الأدمن قبل العرض
    is_featured BOOLEAN DEFAULT false, -- لعرضه في الصفحة الرئيسية
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- كل طلب يمكن تقييمه مرة واحدة فقط
    UNIQUE(order_id)
);

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث updated_at
DROP TRIGGER IF EXISTS trigger_update_reviews_updated_at ON reviews;
CREATE TRIGGER trigger_update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- عرض للتقييمات المعتمدة مع بيانات المستخدم (بدون معلومات حساسة)
CREATE OR REPLACE VIEW approved_reviews_view AS
SELECT 
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    r.is_featured,
    -- عرض الاسم الأول فقط أو جزء منه للخصوصية
    CASE 
        WHEN LENGTH(u.name) > 0 THEN 
            CONCAT(SPLIT_PART(u.name, ' ', 1), ' ', LEFT(COALESCE(SPLIT_PART(u.name, ' ', 2), ''), 1), '.')
        ELSE 'عميل'
    END as customer_name,
    -- عرض اسم الخدمة (الافتراضي إذا لم تكن متوفرة)
    'خدمة' as service_name
FROM reviews r
JOIN users u ON r.user_id = u.id
JOIN orders o ON r.order_id = o.id
WHERE r.is_approved = true
ORDER BY r.rating DESC, r.created_at DESC;

-- صلاحيات RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للتقييمات المعتمدة (للجميع)
CREATE POLICY "Anyone can view approved reviews" ON reviews
    FOR SELECT
    USING (is_approved = true);

-- سياسة القراءة للمستخدم لتقييماته الخاصة
CREATE POLICY "Users can view own reviews" ON reviews
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- سياسة الإضافة للمستخدمين المسجلين
CREATE POLICY "Users can insert own reviews" ON reviews
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- سياسة التحديث للأدمن فقط (للموافقة)
CREATE POLICY "Admins can update reviews" ON reviews
    FOR UPDATE
    USING (true);
