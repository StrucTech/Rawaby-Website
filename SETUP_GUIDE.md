# إعداد نظام خدمات تعليمية 🚀

## المتطلبات الأساسية
- Node.js 18+ 
- npm أو yarn
- حساب Supabase
- حساب Gmail (للإيميل)

## خطوات التثبيت

### 1. نسخ المتغيرات البيئية
```bash
# انسخ ملف المتغيرات البيئية النموذجي
cp .env.example .env.local
```

### 2. إعداد Supabase
1. أنشئ مشروع جديد في [Supabase](https://supabase.com)
2. اذهب إلى Settings → API
3. انسخ القيم التالية إلى `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### 3. إنشاء قاعدة البيانات
في Supabase SQL Editor، نفذ الملفات التالية بالترتيب:
```sql
-- 1. الهيكل الأساسي
psql -f database-schema-new.sql

-- 2. البيانات التجريبية (اختياري)
psql -f setup-test-data.sql

-- 3. تحديث جدول الإشعارات
psql -f update-notifications-table.sql
```

### 4. إعداد البريد الإلكتروني
للـ Gmail:
1. فعّل المصادقة الثنائية
2. أنشئ App Password من Google Account Security
3. أضف إلى `.env.local`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=your-email@gmail.com
   ```

### 5. إعداد JWT
أنشئ مفتاح JWT قوي:
```bash
# استخدم مولد عشوائي قوي
JWT_SECRET=your-very-strong-secret-key-min-32-characters
```

### 6. تثبيت التبعيات وتشغيل المشروع
```bash
# تثبيت التبعيات
npm install

# تشغيل المشروع
npm run dev
```

## التحقق من التثبيت

### اختبار قاعدة البيانات
```bash
# تشغيل اختبار الاتصال
npm run test:db
```

### اختبار البريد الإلكتروني
```bash
# اختبار إرسال البريد
node src/lib/test-mail.ts
```

## الأدوار والصلاحيات

### الأدوار المتوفرة:
- **user**: عميل عادي
- **admin**: مدير النظام
- **supervisor**: مشرف الخدمات  
- **delegate**: مندوب تنفيذ

### المستخدمين التجريبيين (بعد setup-test-data.sql):
```
# Admin
البريد: admin@khadamat.com
كلمة المرور: admin123

# Supervisor  
البريد: supervisor@khadamat.com
كلمة المرور: supervisor123

# Delegate
البريد: delegate@khadamat.com
كلمة المرور: delegate123
```

## الصفحات الرئيسية

### للعميل:
- `/` - الصفحة الرئيسية
- `/services` - الخدمات المتوفرة
- `/cart` - سلة المشتريات
- `/my-orders` - طلباتي
- `/messages` - الرسائل

### للإدارة:
- `/admin` - لوحة الإدارة
- `/admin/services` - إدارة الخدمات
- `/admin/supervisors` - إدارة المشرفين
- `/admin/delegates` - إدارة المندوبين

### للمشرف:
- `/supervisor/dashboard` - توزيع المهام
- `/supervisor/messages` - رسائل المندوبين
- `/supervisor/customer-messages` - رسائل العملاء

### للمندوب:
- `/delegate-tasks` - المهام المخصصة
- `/delegate/messages` - الرسائل الواردة

## استكشاف الأخطاء

### خطأ "table users does not exist"
```bash
# تأكد من تنفيذ database-schema-new.sql في Supabase
```

### خطأ "JWT_SECRET not set"
```bash
# تأكد من وجود JWT_SECRET في .env.local
```

### خطأ 500 في APIs
```bash
# تحقق من المتغيرات البيئية
# تحقق من اتصال Supabase
# تحقق من logs في Supabase Dashboard
```

## الميزات المتوفرة ✅

- ✅ تسجيل المستخدمين (جميع الأدوار)
- ✅ التحقق من البريد الإلكتروني
- ✅ طلب الخدمات للعميل
- ✅ إرسال العقود عبر البريد
- ✅ تعيين المهام كمشرف
- ✅ التعامل مع الطلبات كمندوب
- ✅ نظام الرسائل والإشعارات
- ✅ لوحة تحكم الإدارة
- ✅ إدارة الخدمات ديناميكياً

## الدعم والتطوير

للحصول على المساعدة:
1. تأكد من إعداد جميع المتغيرات البيئية
2. راجع Supabase logs للأخطاء
3. تحقق من console logs في المتصفح
4. راجع ملف ROLES_SYSTEM.md للصلاحيات