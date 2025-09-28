import 'dotenv/config';
import { sendVerificationEmail } from './mailer';

console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' : 'NOT SET');
console.log('SMTP_FROM:', process.env.SMTP_FROM);
console.log('BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);

(async () => {
  const testEmail = process.env.SMTP_USER || 'your-test-email@example.com';
  const testToken = 'test-token-123';
  try {
    await sendVerificationEmail(testEmail, testToken);
    console.log('✅ تم إرسال الإيميل بنجاح إلى:', testEmail);
    console.log('رابط التفعيل التجريبي:');
    console.log(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${testToken}`);
  } catch (err) {
    console.error('❌ فشل إرسال الإيميل:', err);
  }
})(); 