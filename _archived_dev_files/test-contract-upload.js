// اختبار لتشخيص مشاكل رفع العقود
console.log('Contract Upload Test');

const testFormData = new FormData();

// إنشاء ملف اختبار
const testFile1 = new File(['Test contract 1 content'], 'test-contract-1.pdf', { type: 'application/pdf' });
const testFile2 = new File(['Test contract 2 content'], 'test-contract-2.pdf', { type: 'application/pdf' });

testFormData.append('contract1', testFile1);
testFormData.append('contract2', testFile2);

console.log('Test files created:');
console.log('File 1:', testFile1.name, testFile1.size, testFile1.type);
console.log('File 2:', testFile2.name, testFile2.size, testFile2.type);

// تحقق من الأنواع المسموحة
const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

console.log('File validation:');
console.log('File 1 allowed:', allowedTypes.includes(testFile1.type));
console.log('File 2 allowed:', allowedTypes.includes(testFile2.type));

const maxSize = 10 * 1024 * 1024; // 10MB
console.log('Size validation:');
console.log('File 1 size ok:', testFile1.size <= maxSize);
console.log('File 2 size ok:', testFile2.size <= maxSize);

console.log('\nExpected API endpoints:');
console.log('1. POST /api/upload-contracts (primary)');
console.log('2. POST /api/upload-contracts-simple (fallback)');
console.log('\nRequired headers:');
console.log('Authorization: Bearer [JWT_TOKEN]');
console.log('Content-Type: multipart/form-data (automatic with FormData)');