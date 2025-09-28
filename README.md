# نظام خدمات تعليمية | Educational Services Platform

<div align="center">

![Platform](https://img.shields.io/badge/Platform-Next.js-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

</div>

<div dir="rtl">

## 📖 نظرة عامة

منصة شاملة لإدارة الخدمات التعليمية مع نظام أدوار متكامل ولوحات تحكم متخصصة. تم تصميم المنصة لتسهيل التواصل بين العملاء، المشرفين، والمندوبين في بيئة تعليمية احترافية.

## ✨ الميزات الرئيسية

### 🔐 نظام المصادقة والأدوار
- **4 أدوار متخصصة**: مدير، مشرف، مندوب، عميل
- تحقق من البريد الإلكتروني
- حماية الصفحات حسب الصلاحيات
- JWT authentication مع انتهاء صلاحية

### 🛒 إدارة الطلبات والخدمات
- **للعملاء**: تصفح الخدمات، إضافة للسلة، تتبع الطلبات
- **للإدارة**: إضافة/تعديل الخدمات ديناميكياً
- **للمشرفين**: توزيع المهام ومتابعة التقدم
- **للمندوبين**: تنفيذ المهام وإرسال التحديثات

### 📄 نظام إدارة العقود
- رفع العقود وربطها بالطلبات
- إرسال العقود للعملاء بالبريد الإلكتروني
- تتبع حالة العقود والموافقات
- تخزين آمن في Supabase Storage

### 💬 نظام الرسائل والإشعارات
- **مشرف ↔ مندوب**: تعليمات وتحديثات المهام
- **مشرف ↔ عميل**: تحديثات الحالة والاستفسارات
- إشعارات فورية مع عدادات غير مقروءة
- أنواع رسائل مختلفة (عادية، عاجلة، استفسار، تحديث)

</div>

## 🚀 البدء السريع

### المتطلبات
- Node.js 18+
- حساب Supabase
- حساب Gmail (للبريد)

### التثبيت
```bash
# استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/khadamat-taalimia.git
cd khadamat-taalimia

# تثبيت التبعيات
npm install

# إعداد المتغيرات البيئية
cp .env.example .env.local
# عدّل .env.local بالقيم الصحيحة

# تشغيل المشروع
npm run dev

```

🎉 **المشروع جاهز على**: http://localhost:3000

## 🔑 الأدوار والواجهات

<div dir="rtl">

| الدور | الصفحات الرئيسية | الوصف |
|-------|-------------------|--------|
| **🔴 مدير** | `/admin` | إدارة شاملة للنظام والمستخدمين |
| **🔵 مشرف** | `/supervisor/dashboard` | توزيع المهام والتواصل |
| **🟢 مندوب** | `/delegate-tasks` | تنفيذ المهام والتقارير |
| **🟡 عميل** | `/services`, `/my-orders` | طلب الخدمات والمتابعة |

</div>

## 🛠️ التقنيات المستخدمة

- **Next.js 14** - إطار العمل الرئيسي
- **TypeScript** - للأمان والجودة
- **Supabase** - قاعدة البيانات والمصادقة
- **Tailwind CSS** - للتصميم المتجاوب
- **JWT** - للمصادقة الآمنة
- **Nodemailer** - لإرسال البريد الإلكتروني

## 📚 الموارد والدلائل

- 📖 [**دليل الإعداد الكامل**](./SETUP_GUIDE.md)
- 🔐 [**نظام الأدوار**](./ROLES_SYSTEM.md)  
- 🚀 [**رفع على GitHub**](./GITHUB_UPLOAD_GUIDE.md)

## 🤝 المساهمة

مرحب بالمساهمات! راجع دليل المساهمة وافتح Pull Request.

## 📄 الترخيص

مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
