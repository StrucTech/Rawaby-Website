-- جدول محاولات تسجيل الدخول الفاشلة وطلبات استعادة كلمة المرور
-- يُستخدم للحد من تخمين كلمات المرور (يعمل عبر كل نسخ السيرفر على Vercel)

CREATE TABLE IF NOT EXISTS auth_attempts (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_attempts_key_created
  ON auth_attempts (key, created_at DESC);

-- الوصول فقط من السيرفر (service role) - لا توجد سياسات للمستخدمين
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
