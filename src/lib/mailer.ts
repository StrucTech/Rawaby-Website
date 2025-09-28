import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465', // فقط 465 يكون secure
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// دالة عامة لإرسال الإيميل
export async function sendEmail({ to, subject, text, html, attachments }: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
}) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
    attachments
  };
  
  await transporter.sendMail(mailOptions);
}

export async function sendVerificationEmail(to: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${token}`;
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: 'تفعيل حسابك',
    html: `<p>اضغط على الرابط التالي لتفعيل حسابك:</p><a href="${verificationUrl}">${verificationUrl}</a>`
  };
  await transporter.sendMail(mailOptions);
}

// دالة إرسال روابط العقود
export async function sendMailWithDriveLinks(to: string, { studentName, guardianName, contract1, contract2 }: { studentName: string, guardianName: string, contract1: string, contract2: string }) {
  const html = `
    <p>عزيزي ${studentName}،</p>
    <p>يرجى تحميل وتعبئة العقود التالية:</p>
    <ul>
      <li><a href="${contract1}">عقد خدمات استشارية</a></li>
      <li><a href="${contract2}">توكيل خاص</a></li>
    </ul>
    <p>بعد تعبئة العقود، يرجى رفعهما من خلال الموقع.</p>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'روابط العقود المطلوبة',
    html
  });
} 