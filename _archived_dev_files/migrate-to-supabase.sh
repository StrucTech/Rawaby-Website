#!/bin/bash

echo "🚀 بدء عملية تحويل API Routes إلى Supabase..."

# إنشاء نسخ احتياطية
echo "📁 إنشاء نسخ احتياطية..."
mkdir -p src/app/api/_backups
cp -r src/app/api/* src/app/api/_backups/ 2>/dev/null || true

echo "✅ تم إنشاء النسخ الاحتياطية"

# قائمة الملفات التي تحتاج تحديث
echo "📝 الملفات التي تحتاج تحديث:"
echo "   - src/app/api/orders/route.ts"
echo "   - src/app/api/orders/[id]/contract/route.ts"
echo "   - src/app/api/admin/delegates/route.ts"
echo "   - src/app/api/admin/supervisors/route.ts"
echo "   - src/app/api/admin/supervisor-delegates/route.ts"
echo "   - src/app/api/auth/verify-email/route.ts"
echo "   - src/app/api/admin/orders/[id]/route.ts"

echo ""
echo "⚠️  تحذير: يجب تحديث هذه الملفات يدوياً:"
echo "   1. استبدال import mongoose بـ Supabase models"
echo "   2. إزالة connectDB() calls"
echo "   3. استخدام الدوال الجديدة مثل:"
echo "      - UserModel.findByEmail()"
echo "      - OrderModel.create()"
echo "      - ServiceModel.findAll()"

echo ""
echo "📋 مثال على التغييرات المطلوبة:"
echo ""
echo "القديم:"
echo "import { User } from '@/models/User';"
echo "await connectDB();"
echo "const user = await User.findOne({ email });"
echo ""
echo "الجديد:"
echo "import { UserModel } from '@/models/UserSupabase';"
echo "const user = await UserModel.findByEmail(email);"

echo ""
echo "🔧 خطوات إضافية مطلوبة:"
echo "1. تحديث ملف .env بمعلومات Supabase"
echo "2. تنفيذ السكريپت SQL في Supabase"
echo "3. تحديث جميع API routes يدوياً"
echo "4. اختبار المشروع"

echo ""
echo "✨ انتهت عملية التحضير للتحويل!"