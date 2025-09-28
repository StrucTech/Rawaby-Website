@echo off
echo تنظيف صفحات الاختبار (اختياري)

:: حذف صفحات الاختبار
if exist "src\app\test-orders" (
    echo حذف مجلد test-orders...
    rmdir /s /q "src\app\test-orders"
)

if exist "src\app\database-status" (
    echo حذف مجلد database-status...
    rmdir /s /q "src\app\database-status"
)

:: حذف APIs الاختبار
if exist "src\app\api\test-db" (
    echo حذف مجلد test-db API...
    rmdir /s /q "src\app\api\test-db"
)

if exist "src\app\api\db-simple" (
    echo حذف مجلد db-simple API...
    rmdir /s /q "src\app\api\db-simple"
)

if exist "src\app\api\orders-simple" (
    echo حذف مجلد orders-simple API...
    rmdir /s /q "src\app\api\orders-simple"
)

if exist "src\app\api\orders-normal" (
    echo حذف مجلد orders-normal API...
    rmdir /s /q "src\app\api\orders-normal"
)

echo تم الانتهاء من التنظيف!
pause