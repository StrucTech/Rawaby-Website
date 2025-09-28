@echo off
chcp 65001 >nul
echo 🧹 بدء تنظيف مشروع خدمات تعليمية...

REM إنشاء مجلد للأرشفة
if not exist "_archived_dev_files" mkdir "_archived_dev_files"

echo 📦 أرشفة ملفات التطوير...

REM نقل ملفات الاختبار والتطوير
move "test-*.js" "_archived_dev_files\" >nul 2>&1
move "test-*.html" "_archived_dev_files\" >nul 2>&1
move "test-*.sql" "_archived_dev_files\" >nul 2>&1

move "check-*.js" "_archived_dev_files\" >nul 2>&1
move "check-*.sql" "_archived_dev_files\" >nul 2>&1

move "debug-*.js" "_archived_dev_files\" >nul 2>&1
move "setup-*.js" "_archived_dev_files\" >nul 2>&1
move "setup-*.sql" "_archived_dev_files\" >nul 2>&1
move "create-*.js" "_archived_dev_files\" >nul 2>&1
move "create-*.sql" "_archived_dev_files\" >nul 2>&1
move "execute-*.js" "_archived_dev_files\" >nul 2>&1
move "generate-*.js" "_archived_dev_files\" >nul 2>&1
move "rename-*.js" "_archived_dev_files\" >nul 2>&1
move "make-*.js" "_archived_dev_files\" >nul 2>&1

move "fix-*.js" "_archived_dev_files\" >nul 2>&1
move "database-fixes.sql" "_archived_dev_files\" >nul 2>&1
move "fix-orders-*.sql" "_archived_dev_files\" >nul 2>&1
move "verify-*.sql" "_archived_dev_files\" >nul 2>&1

move "temp-*.json" "_archived_dev_files\" >nul 2>&1
move "final-*.js" "_archived_dev_files\" >nul 2>&1

move "cleanup-test-pages.bat" "_archived_dev_files\" >nul 2>&1
move "migrate-to-supabase.sh" "_archived_dev_files\" >nul 2>&1

echo ✅ تم الاحتفاظ بالملفات المهمة:
echo   - database-schema-new.sql (الهيكل النهائي)
echo   - sample-data.sql (البيانات التجريبية)
echo   - supabase-schema.sql (هيكل Supabase)

REM إنشاء ملف README للأرشيف
(
echo # ملفات التطوير المؤرشفة
echo.
echo هذا المجلد يحتوي على ملفات التطوير والاختبار التي تم استخدامها أثناء بناء المشروع.
echo.
echo ## يمكن حذف هذا المجلد بأمان بعد التأكد من:
echo 1. عمل جميع وظائف النظام بشكل صحيح
echo 2. عدم وجود أخطاء في الإنتاج لمدة أسبوع  
echo 3. إنشاء نسخة احتياطية من المشروع
echo.
echo ## الملفات المحفوظة في المشروع الرئيسي:
echo - database-schema-new.sql - الهيكل النهائي لقاعدة البيانات
echo - sample-data.sql - البيانات التجريبية النظيفة
echo - supabase-schema.sql - هيكل Supabase الكامل
echo.
echo تاريخ الأرشفة: %date% %time%
) > "_archived_dev_files\README.md"

echo 📁 تم إنشاء مجلد _archived_dev_files
echo ⚠️  راجع المجلد واحذفه بعد التأكد من عمل النظام
echo ✨ تنظيف المشروع مكتمل!

REM عد الملفات المؤرشفة
for /f %%i in ('dir "_archived_dev_files" /b /a-d ^| find /c /v ""') do set archived_count=%%i
echo 📊 تم أرشفة %archived_count% ملف

echo.
echo 🚀 المشروع جاهز للرفع على GitHub!
echo 📋 الخطوات التالية:
echo   1. git add .
echo   2. git commit -m "إصدار نهائي - نظام إدارة الخدمات التعليمية"
echo   3. git push origin main

pause