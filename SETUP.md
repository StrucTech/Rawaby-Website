# دليل الإعداد للمطورين | Developer Setup Guide

## متطلبات النظام | System Requirements

- Node.js 18.0.0 أو أحدث
- npm 8.0.0 أو أحدث  
- حساب Supabase مجاني
- حساب SMTP للبريد الإلكتروني

## خطوات الإعداد السريع | Quick Setup

### 1. إعداد المشروع محلياً
```bash
# استنساخ المشروع
git clone <repository-url>
cd khadamat-taalimia

# تثبيت التبعيات
npm install

# نسخ ملف البيئة
cp .env.example .env.local
```

### 2. إعداد Supabase

1. **إنشاء مشروع جديد**:
   - اذهب إلى [supabase.com](https://supabase.com)
   - أنشئ مشروع جديد
   - انسخ `Project URL` و `anon public key` و `service_role key`

2. **إعداد قاعدة البيانات**:
   - افتح SQL Editor في Supabase
   - نفذ محتوى `supabase-schema.sql`
   - نفذ محتوى `update-notifications-table.sql`

3. **إعداد Storage**:
   ```sql
   -- إنشاء bucket للعقود
   INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false);
   
   -- سياسة السماح بالرفع للمستخدمين المصادق عليهم
   CREATE POLICY "Users can upload contracts" ON storage.objects FOR INSERT 
   WITH CHECK (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

### 3. إعداد المتغيرات البيئية

في ملف `.env.local`:

```env
# من Supabase Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# مفتاح JWT عشوائي قوي (يمكن توليده من openssl)
JWT_SECRET=your_super_secret_jwt_key

# إعداد SMTP (يمكن استخدام Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="خدمات تعليمية <your-email@gmail.com>"

# رابط التطبيق
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. تشغيل التطبيق

```bash
# تشغيل خادم التطوير
npm run dev

# فتح http://localhost:3000
```

## بيانات اختبار | Test Data

### المستخدمين الافتراضيين
يمكن إنشاء مستخدمين اختبار من خلال التسجيل أو إضافة بيانات مباشرة:

```sql
-- إضافة أدمن اختبار
INSERT INTO users (name, email, password, role, active, email_verified) VALUES 
('مدير النظام', 'admin@test.com', '$2b$10$hashedpassword', 'admin', true, true);

-- إضافة مشرف اختبار  
INSERT INTO users (name, email, password, role, active, email_verified) VALUES 
('المشرف الأول', 'supervisor@test.com', '$2b$10$hashedpassword', 'supervisor', true, true);

-- إضافة مندوب اختبار
INSERT INTO users (name, email, password, role, active, email_verified) VALUES 
('المندوب الأول', 'delegate@test.com', '$2b$10$hashedpassword', 'delegate', true, true);
```

### خدمات تجريبية
```sql
INSERT INTO services (title, description, price, duration_days, category, active) VALUES 
('تدريس خاص', 'تدريس خاص في المواد الدراسية', 500.00, 30, 'educational', true),
('استشارة تعليمية', 'استشارة في التخطيط التعليمي', 200.00, 7, 'consultation', true);
```

## استكشاف الأخطاء | Troubleshooting

### مشاكل شائعة

1. **خطأ اتصال قاعدة البيانات**
   - تأكد من صحة `SUPABASE_URL` و `SERVICE_ROLE_KEY`
   - تحقق من تنفيذ schema بشكل صحيح

2. **مشكلة إرسال البريد**
   - تأكد من إعدادات SMTP
   - للـ Gmail، استخدم App Password وليس كلمة المرور العادية

3. **مشكلة JWT**
   - تأكد من قوة `JWT_SECRET` (32 حرف على الأقل)

### سجلات مفيدة

```bash
# عرض السجلات التفصيلية
npm run dev -- --turbo

# فحص قاعدة البيانات
npx supabase status
```

## بنية المشروع | Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   ├── admin/          # صفحات الإدارة
│   ├── supervisor/     # صفحات المشرف  
│   └── (auth)/         # صفحات المصادقة
├── components/         # مكونات React
├── lib/               # مكتبات وإعدادات
├── models/           # نماذج قاعدة البيانات
└── middleware.ts     # Middleware للحماية
```

## المساهمة | Contributing

1. Fork المشروع
2. إنشاء branch للميزة الجديدة
3. Commit التغييرات مع رسائل واضحة
4. Push وإنشاء Pull Request

### معايير الكود
- TypeScript strict mode
- ESLint للجودة
- Prettier للتنسيق
- Comments باللغة العربية في الكود

## الدعم | Support

- 📖 [توثيق المشروع](README.md)
- 🐛 [الإبلاغ عن مشكلة](../../issues)
- 💬 [مناقشات](../../discussions)