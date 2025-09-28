# 🎓 نظام الخدمات التعليمية | Educational Services System

منصة متكاملة لإدارة وتقديم الخدمات التعليمية مع نظام إدارة شامل وأدوار متعددة.

## 📋 المحتويات

- [الميزات](#الميزات)
- [التقنيات المستخدمة](#التقنيات-المستخدمة)
- [التثبيت والإعداد](#التثبيت-والإعداد)
- [إعداد قاعدة البيانات](#إعداد-قاعدة-البيانات)
- [المتغيرات البيئية](#المتغيرات-البيئية)
- [الاستخدام](#الاستخدام)

## ✨ الميزات

### 🔐 نظام المصادقة والأدوار
- **4 أدوار رئيسية**: Admin, Supervisor, Delegate, User
- تسجيل دخول وحساب جديد مع JWT Authentication
- التحقق من البريد الإلكتروني
- نظام صلاحيات هرمي

### 🛒 إدارة الخدمات والطلبات
- **إدارة ديناميكية للخدمات** (Admin)
- سلة مشتريات ونظام دفع متكامل
- تتبع الطلبات ومراحلها
- معلومات الطالب وولي الأمر

### 📄 نظام العقود
- رفع وتنزيل العقود
- إرسال العقود عبر البريد الإلكتروني
- ربط العقود بالطلبات

### 💬 نظام المراسلة المتقدم
- **مراسلة المشرف ↔ المندوب**
- **مراسلة المشرف ↔ العميل**
- إشعارات الوقت الفعلي
- عدادات الرسائل غير المقروءة

## 🛠 التقنيات المستخدمة

- **Next.js 14.2.30** - React Framework
- **TypeScript** - Type Safety
- **Supabase** - Database & Storage
- **Tailwind CSS** - Styling
- **JWT** - Authentication
- **Nodemailer** - Email Service

## 🚀 التثبيت والإعداد

### المتطلبات
- Node.js 18+
- npm أو yarn
- حساب Supabase

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone [repository-url]
cd khadamat-taalimia
```

2. **تثبيت التبعيات**
```bash
npm install
```

3. **إعداد المتغيرات البيئية**
```bash
cp .env.example .env.local
```

4. **تشغيل المشروع**
```bash
npm run dev
```

## 🗄️ إعداد قاعدة البيانات

### 1. إعداد Supabase
1. إنشاء مشروع جديد في [Supabase](https://supabase.com)
2. الحصول على `Project URL` و `Service Role Key`

### 2. تنفيذ Schema
```sql
-- تنفيذ الملفات بالترتيب في SQL Editor:
-- 1. supabase-schema.sql (الهيكل الأساسي)
-- 2. update-notifications-table.sql (جدول الرسائل)
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
