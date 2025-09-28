#!/bin/bash

# تنظيف المشروع - الخطوة الأولى: تحويل إلى تعليقات
# هذا الملف لتنظيف ملفات التطوير والاختبار

echo "🧹 بدء تنظيف مشروع خدمات تعليمية..."

# إنشاء مجلد للأرشفة
mkdir -p _archived_dev_files

# نقل ملفات الاختبار والتطوير إلى مجلد الأرشفة
echo "📦 أرشفة ملفات التطوير..."

# ملفات الاختبار
mv test-*.js _archived_dev_files/ 2>/dev/null || true
mv test-*.html _archived_dev_files/ 2>/dev/null || true
mv test-*.sql _archived_dev_files/ 2>/dev/null || true

# ملفات الفحص
mv check-*.js _archived_dev_files/ 2>/dev/null || true
mv check-*.sql _archived_dev_files/ 2>/dev/null || true

# ملفات الإعداد والتطوير
mv debug-*.js _archived_dev_files/ 2>/dev/null || true
mv setup-*.js _archived_dev_files/ 2>/dev/null || true
mv setup-*.sql _archived_dev_files/ 2>/dev/null || true
mv create-*.js _archived_dev_files/ 2>/dev/null || true
mv create-*.sql _archived_dev_files/ 2>/dev/null || true
mv execute-*.js _archived_dev_files/ 2>/dev/null || true
mv generate-*.js _archived_dev_files/ 2>/dev/null || true
mv rename-*.js _archived_dev_files/ 2>/dev/null || true
mv make-*.js _archived_dev_files/ 2>/dev/null || true

# ملفات الإصلاح القديمة (عدا النهائية)
mv fix-*.js _archived_dev_files/ 2>/dev/null || true
mv database-fixes.sql _archived_dev_files/ 2>/dev/null || true
mv fix-orders-*.sql _archived_dev_files/ 2>/dev/null || true
mv verify-*.sql _archived_dev_files/ 2>/dev/null || true

# ملفات مؤقتة
mv temp-*.json _archived_dev_files/ 2>/dev/null || true
mv final-*.js _archived_dev_files/ 2>/dev/null || true

# ملفات أخرى
mv *.bat _archived_dev_files/ 2>/dev/null || true
mv *.sh _archived_dev_files/ 2>/dev/null || true

# الاحتفاظ بالملفات المهمة فقط:
echo "✅ تم الاحتفاظ بالملفات المهمة:"
echo "  - database-schema-new.sql (الهيكل النهائي)"
echo "  - sample-data.sql (البيانات التجريبية)"
echo "  - supabase-schema.sql (هيكل Supabase)"

# إنشاء ملف README للأرشيف
cat > _archived_dev_files/README.md << 'EOF'
# ملفات التطوير المؤرشفة

هذا المجلد يحتوي على ملفات التطوير والاختبار التي تم استخدامها أثناء بناء المشروع.

## يمكن حذف هذا المجلد بأمان بعد التأكد من:
1. عمل جميع وظائف النظام بشكل صحيح
2. عدم وجود أخطاء في الإنتاج لمدة أسبوع
3. إنشاء نسخة احتياطية من المشروع

## الملفات المحفوظة في المشروع الرئيسي:
- database-schema-new.sql - الهيكل النهائي لقاعدة البيانات
- sample-data.sql - البيانات التجريبية النظيفة
- supabase-schema.sql - هيكل Supabase الكامل

تاريخ الأرشفة: $(date)
EOF

echo "📁 تم إنشاء مجلد _archived_dev_files"
echo "⚠️  راجع المجلد واحذفه بعد التأكد من عمل النظام"
echo "✨ تنظيف المشروع مكتمل!"

# عد الملفات المؤرشفة
archived_count=$(find _archived_dev_files -type f | wc -l)
echo "📊 تم أرشفة $archived_count ملف"

echo ""
echo "🚀 المشروع جاهز للرفع على GitHub!"
echo "📋 الخطوات التالية:"
echo "  1. git add ."
echo "  2. git commit -m 'إصدار نهائي - نظام إدارة الخدمات التعليمية'"
echo "  3. git push origin main"