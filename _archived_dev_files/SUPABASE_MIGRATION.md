# دليل التحويل من MongoDB إلى Supabase

تم إنشاء جميع الملفات اللازمة لتحويل المشروع من MongoDB إلى Supabase. إليك الخطوات المطلوبة لإكمال التحويل:

## الخطوات المطلوبة:

### 1. إعداد مشروع Supabase

1. اذهب إلى [Supabase](https://supabase.com) وقم بإنشاء حساب جديد
2. أنشئ مشروع جديد
3. احصل على:
   - Project URL
   - Anon Public Key  
   - Service Role Key

### 2. تحديث متغيرات البيئة

قم بتحديث ملف `.env` بالقيم الصحيحة:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. إنشاء قاعدة البيانات

1. اذهب إلى SQL Editor في لوحة تحكم Supabase
2. انسخ محتوى ملف `supabase-schema.sql` وقم بتشغيله
3. هذا سيقوم بإنشاء جميع الجداول والفهارس والسياسات المطلوبة

### 4. استبدال الملفات

استبدل الملفات القديمة بالملفات الجديدة:

```bash
# نسخ احتياطية من الملفات القديمة
mv src/app/api/auth/register/route.ts src/app/api/auth/register/route-mongodb.ts
mv src/app/api/auth/login/route.ts src/app/api/auth/login/route-mongodb.ts

# استخدام الملفات الجديدة
mv src/app/api/auth/register/route-supabase.ts src/app/api/auth/register/route.ts
mv src/app/api/auth/login/route-supabase.ts src/app/api/auth/login/route.ts
```

### 5. تحديث الاستيرادات

في جميع الملفات التي تستخدم النماذج، استبدل:

```typescript
// القديم
import { User } from '@/models/User';
import Order from '@/models/Order';
import { Service } from '@/models/Service';

// الجديد
import { UserModel } from '@/models/UserSupabase';
import { OrderModel } from '@/models/OrderSupabase';
import { ServiceModel } from '@/models/ServiceSupabase';
```

### 6. تحديث استعلامات قاعدة البيانات

استبدل استعلامات Mongoose بـ Supabase في جميع API routes:

```typescript
// القديم (Mongoose)
const user = await User.findOne({ email });
const users = await User.find({ role: 'admin' });

// الجديد (Supabase)
const user = await UserModel.findByEmail(email);
const users = await UserModel.findByRole('admin');
```

### 7. إزالة المكتبات غير المطلوبة

```bash
npm uninstall mongoose
```

### 8. الملفات الجديدة المُنشأة:

- `src/lib/supabase.ts` - إعداد Supabase
- `src/models/UserSupabase.ts` - نموذج المستخدم
- `src/models/ServiceSupabase.ts` - نموذج الخدمة  
- `src/models/OrderSupabase.ts` - نموذج الطلب
- `src/models/SupervisorDelegateSupabase.ts` - نموذج علاقات المشرف-المندوب
- `supabase-schema.sql` - سكريبت إنشاء قاعدة البيانات

### 9. ميزات Supabase المتاحة:

- **Row Level Security (RLS)**: حماية متقدمة للبيانات
- **Real-time subscriptions**: تحديثات فورية
- **Built-in authentication**: نظام مصادقة مدمج
- **Storage**: تخزين الملفات
- **Edge Functions**: دوال خادم عديمة الخادم

### 10. النصائح:

- اختبر كل API route بعد التحويل
- تأكد من تحديث جميع الاستيرادات
- احتفظ بنسخة احتياطية من البيانات قبل التحويل
- استخدم Supabase Dashboard لمراقبة قاعدة البيانات

### 11. اختبار التحويل:

```bash
npm run dev
```

تأكد من عمل:
- تسجيل الدخول والخروج
- إنشاء الحسابات
- عرض الخدمات والطلبات
- جميع وظائف CRUD

### مقارنة الأداء:

| الخاصية | MongoDB | Supabase |
|---------|---------|----------|
| السرعة | سريع | أسرع (PostgreSQL) |
| الحماية | يدوية | RLS مدمج |
| Real-time | يتطلب إعداد | مدمج |
| التخزين | GridFS | مدمج |
| التكلفة | حسب الاستخدام | مجاني حتى حد معين |

بعد إكمال هذه الخطوات، سيكون مشروعك يعمل بـ Supabase بدلاً من MongoDB!