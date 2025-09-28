# دليل رفع المشروع على GitHub 🚀

## الخطوات المطلوبة:

### 1. إعداد Git Repository جديد

```bash
# في terminal، اذهب لمجلد المشروع
cd "d:\next.js\khadamat-taalimia"

# إنشاء repository جديد (إذا لم يكن موجود)
git init

# إضافة remote للـ GitHub account الجديد
git remote remove origin  # إزالة الـ remote القديم إذا كان موجود
git remote add origin https://github.com/YOUR_NEW_USERNAME/khadamat-taalimia.git

# أو باستخدام SSH إذا كان معدّ
git remote add origin git@github.com:YOUR_NEW_USERNAME/khadamat-taalimia.git
```

### 2. تحضير الملفات للرفع

```bash
# التحقق من حالة الملفات
git status

# إضافة جميع الملفات (gitignore سيحمي الملفات الحساسة تلقائياً)
git add .

# عمل commit
git commit -m "Initial commit: Educational Services Platform

✨ Features:
- Complete authentication system (4 roles: admin, supervisor, delegate, user)
- Dynamic services management
- Order processing and tracking
- Contract management with email delivery
- Supervisor-delegate task assignment
- Real-time messaging system with notifications
- Admin dashboard with full management capabilities
- Email verification system
- Responsive UI with Arabic RTL support

🔧 Tech Stack:
- Next.js 14 with TypeScript
- Supabase (PostgreSQL + Storage)
- JWT Authentication
- Tailwind CSS
- Nodemailer for email
"
```

### 3. رفع المشروع

```bash
# رفع على الـ branch الرئيسي
git branch -M main
git push -u origin main
```

## الملفات المحمية بـ .gitignore ✅

الملفات التالية **لن ترفع** على GitHub (وهذا مطلوب للأمان):

### ملفات المتغيرات البيئية:
- `.env.local` (يحتوي على مفاتيح Supabase و JWT)
- `.env`
- `.env.production`
- `.env.development`

### ملفات Node.js:
- `node_modules/` (سيتم تنزيلها بـ npm install)
- `.next/` (ملفات البناء)
- `.pnpm-debug.log*`

### ملفات التطوير:
- `*.tsbuildinfo`
- `.vercel/`

## ملفات الإرشادات المرفوعة 📚

الملفات التالية **سترفع** لتساعد المطورين الآخرين:

### ملفات الإعداد:
- `.env.example` - نموذج للمتغيرات البيئية
- `SETUP_GUIDE.md` - دليل التثبيت الكامل
- `ROLES_SYSTEM.md` - شرح نظام الصلاحيات
- `package.json` - التبعيات والـ scripts

### ملفات قاعدة البيانات:
- `database-schema-new.sql`
- `setup-test-data.sql`
- `update-notifications-table.sql`
- جميع ملفات `.sql` في المجلد

### ملفات الكود:
- جميع ملفات `src/`
- ملفات الإعداد (`next.config.mjs`, `tailwind.config.js`, إلخ)

## إنشاء Repository على GitHub 🌐

### الخطوات في موقع GitHub:

1. **اذهب إلى GitHub.com وسجل دخول بالحساب الجديد**

2. **اضغط على "+" ثم "New repository"**

3. **املأ البيانات:**
   ```
   Repository name: khadamat-taalimia
   Description: Educational Services Platform - نظام إدارة الخدمات التعليمية
   ✅ Public (أو Private حسب الرغبة)
   ❌ لا تختر "Add a README file" (لأن لديك ملفات بالفعل)
   ❌ لا تختر .gitignore (موجود بالفعل)
   ❌ لا تختر License (يمكن إضافة لاحقاً)
   ```

4. **اضغط "Create repository"**

5. **انسخ رابط الـ repository:**
   ```
   https://github.com/YOUR_USERNAME/khadamat-taalimia.git
   ```

## إعدادات أمنية إضافية 🔒

### إضافة متغيرات بيئية في GitHub (للـ CI/CD مستقبلاً):

1. اذهب إلى Settings → Secrets and variables → Actions
2. أضف المتغيرات التالية كـ Repository secrets:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   JWT_SECRET
   SMTP_HOST
   SMTP_USER
   SMTP_PASS
   ```

## README.md للـ Repository 📖

سأنشئ ملف README.md جذاب للمشروع:

```markdown
# نظام خدمات تعليمية | Educational Services Platform

<div dir="rtl">

منصة شاملة لإدارة الخدمات التعليمية مع نظام أدوار متكامل ولوحات تحكم متخصصة.

## ✨ الميزات

- 🔐 نظام مصادقة كامل (4 أدوار: مدير، مشرف، مندوب، عميل)
- 📧 التحقق من البريد الإلكتروني
- 🛒 نظام طلب الخدمات للعملاء
- 📄 إدارة العقود مع الإرسال بالبريد
- 👨‍💼 توزيع المهام للمشرفين
- 💬 نظام رسائل فوري مع إشعارات
- ⚙️ لوحة تحكم إدارية شاملة
- 🎯 إدارة ديناميكية للخدمات

## 🛠️ التقنيات المستخدمة

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT
- **Email**: Nodemailer
- **Storage**: Supabase Storage

## 📋 متطلبات التشغيل

- Node.js 18+
- حساب Supabase
- حساب Gmail (للبريد الإلكتروني)

## 🚀 التثبيت والإعداد

راجع ملف [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) للحصول على تعليمات مفصلة.

### الخطوات السريعة:

1. **استنساخ المشروع:**
   \```bash
   git clone https://github.com/YOUR_USERNAME/khadamat-taalimia.git
   cd khadamat-taalimia
   \```

2. **تثبيت التبعيات:**
   \```bash
   npm install
   \```

3. **إعداد المتغيرات البيئية:**
   \```bash
   cp .env.example .env.local
   # ثم عدّل .env.local بالقيم الصحيحة
   \```

4. **تشغيل المشروع:**
   \```bash
   npm run dev
   \```

## 📊 هيكل المشروع

\```
src/
├── app/                    # صفحات Next.js
│   ├── admin/             # لوحة الإدارة
│   ├── supervisor/        # لوحة المشرف
│   ├── delegate/          # لوحة المندوب
│   └── api/              # واجهات البرمجة
├── components/            # المكونات المشتركة
├── lib/                  # المكتبات المساعدة
└── models/               # نماذج البيانات
\```

## 🔑 الأدوار والصلاحيات

- **مدير**: إدارة كاملة للنظام
- **مشرف**: توزيع المهام ومتابعة الطلبات
- **مندوب**: تنفيذ المهام والتواصل
- **عميل**: طلب الخدمات ومتابعة الطلبات

## 📱 الواجهات

### للعميل:
- عرض الخدمات وإضافتها للسلة
- تتبع الطلبات والعقود
- نظام رسائل مع المشرفين

### للإدارة:
- إدارة الخدمات والمستخدمين
- متابعة جميع الطلبات
- إحصائيات شاملة

### للمشرف:
- توزيع المهام على المندوبين
- التواصل مع العملاء والمندوبين
- متابعة تقدم الأعمال

### للمندوب:
- عرض المهام المخصصة
- رفع تقارير التقدم
- التواصل مع المشرفين

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## 🤝 المساهمة

نرحب بالمساهمات! يرجى قراءة دليل المساهمة قبل تقديم Pull Request.

## 📞 التواصل

للدعم والاستفسارات، يمكنكم التواصل عبر Issues في GitHub.

</div>
```

## الأوامر النهائية 💻

```bash
# في PowerShell أو CMD:

cd "d:\next.js\khadamat-taalimia"

# إعداد Git وإضافة remote جديد
git init
git remote remove origin
git remote add origin https://github.com/YOUR_NEW_USERNAME/khadamat-taalimia.git

# إضافة الملفات وعمل commit
git add .
git commit -m "Initial commit: Educational Services Platform"

# رفع على GitHub
git branch -M main
git push -u origin main
```

**ملاحظة مهمة:** تأكد من استبدال `YOUR_NEW_USERNAME` باسم المستخدم الجديد في GitHub!