// اختبار API رفع العقود بعد التحديث
console.log('=== اختبار API رفع العقود ===\n');

// بيانات اختبار
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

console.log('خطوات الاختبار:');
console.log('1. تسجيل الدخول للحصول على token');
console.log('2. إنشاء ملفات اختبار');
console.log('3. رفع العقود عبر API');
console.log('4. التحقق من قاعدة البيانات');

console.log('\n=== مثال على الطلب ===');
console.log('POST /api/upload-contracts');
console.log('Headers: Authorization: Bearer [TOKEN]');
console.log('Content-Type: multipart/form-data');

console.log('\nFormData:');
console.log('- contract1: File (PDF/DOC/Image)');
console.log('- contract2: File (PDF/DOC/Image)');

console.log('\n=== توقع الاستجابة الناجحة ===');
const expectedResponse = {
  message: 'تم رفع العقود بنجاح',
  contractId: 'uuid-here',
  files: {
    contract1: {
      url: 'https://supabase-url/storage/contracts/file1.pdf',
      filename: 'original-name-1.pdf'
    },
    contract2: {
      url: 'https://supabase-url/storage/contracts/file2.pdf',
      filename: 'original-name-2.pdf'
    }
  },
  saved_to_database: true
};

console.log(JSON.stringify(expectedResponse, null, 2));

console.log('\n=== التحقق من قاعدة البيانات ===');
console.log('SELECT * FROM contracts WHERE user_id = $USER_ID;');
console.log('أو');
console.log('SELECT contract_info FROM users WHERE id = $USER_ID;');

console.log('\n=== استكشاف الأخطاء ===');
console.log('- تحقق من bucket "contracts" في Supabase Storage');
console.log('- تحقق من أن order_id في جدول contracts اختياري');
console.log('- تحقق من صلاحيات JWT token');
console.log('- راجع logs في وحدة تحكم المتصفح');

console.log('\n=== عرض العقود في الأدمن ===');
console.log('URL: /admin/contracts-new');
console.log('أو');
console.log('API: GET /api/admin/contracts');