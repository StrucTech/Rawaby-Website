-- =====================================================
-- جدول إعدادات الموقع (site_settings)
-- يُستخدم لتخزين محتوى صفحة "من نحن" والـ Footer
-- =====================================================

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- إعدادات صفحة من نحن (About)
  about JSONB DEFAULT '{
    "heroTitle": "من نحن",
    "heroSubtitle": "نحن فريق متخصص في تقديم خدمات تعليمية متميزة",
    "missionTitle": "رسالتنا",
    "missionText": "نسعى لتقديم أفضل الخدمات التعليمية التي تساعد الطلاب على تحقيق أهدافهم الأكاديمية",
    "servicesTitle": "خدماتنا",
    "servicesSubtitle": "نقدم مجموعة متنوعة من الخدمات التعليمية",
    "contactTitle": "تواصل معنا",
    "contactSubtitle": "نحن هنا لمساعدتك"
  }'::jsonb,
  
  -- إعدادات الـ Footer
  footer JSONB DEFAULT '{
    "contactTitle": "تواصل معنا",
    "phone": "+966 50 000 0000",
    "email": "info@khadamat-taalimia.com",
    "address": "الرياض، المملكة العربية السعودية",
    "quickLinksTitle": "روابط سريعة",
    "quickLinks": [
      {"text": "الرئيسية", "href": "/"},
      {"text": "الخدمات", "href": "/services"},
      {"text": "من نحن", "href": "/about"},
      {"text": "تسجيل الدخول", "href": "/login"}
    ],
    "socialTitle": "تابعنا",
    "socialLinks": {
      "whatsapp": "https://wa.me/966500000000",
      "twitter": "https://twitter.com/",
      "facebook": "https://facebook.com/",
      "instagram": "https://instagram.com/"
    },
    "copyright": "خدمات تعليمية. جميع الحقوق محفوظة."
  }'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء سجل افتراضي إذا لم يوجد
INSERT INTO site_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_site_settings_updated_at ON site_settings;
CREATE TRIGGER trigger_update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();

-- تمكين RLS (Row Level Security)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة (للجميع)
CREATE POLICY "Allow public read access" ON site_settings
  FOR SELECT USING (true);

-- سياسة للتحديث (للمصادقين فقط - الأدمن)
CREATE POLICY "Allow authenticated update" ON site_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- للتحقق من إنشاء الجدول بنجاح:
-- SELECT * FROM site_settings;
-- =====================================================
