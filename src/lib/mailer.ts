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
  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          margin-bottom: 5px;
        }
        .header p {
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          color: #333;
          margin-bottom: 20px;
        }
        .message-box {
          background-color: #f0f4ff;
          border-right: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 14px;
          color: #555;
          line-height: 1.8;
        }
        .verification-section {
          margin: 30px 0;
          text-align: center;
        }
        .verification-text {
          font-size: 14px;
          color: #666;
          margin-bottom: 20px;
        }
        .verification-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 40px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .verification-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        .link-section {
          background-color: #f9f9f9;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        }
        .link-label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .link-text {
          font-size: 12px;
          word-break: break-all;
          color: #667eea;
          font-family: 'Courier New', monospace;
        }
        .important-note {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 13px;
          color: #856404;
        }
        .footer {
          background-color: #f8f9fa;
          border-top: 1px solid #e0e0e0;
          padding: 20px 30px;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        .footer-links {
          margin-top: 10px;
        }
        .footer-links a {
          color: #667eea;
          text-decoration: none;
          margin: 0 10px;
        }
        .divider {
          height: 1px;
          background-color: #e0e0e0;
          margin: 20px 0;
        }
        .feature-list {
          margin: 20px 0;
          font-size: 14px;
          color: #555;
        }
        .feature-list li {
          margin: 8px 0;
          padding-right: 20px;
        }
        @media only screen and (max-width: 600px) {
          .container {
            border-radius: 0;
          }
          .content {
            padding: 20px;
          }
          .header {
            padding: 20px 15px;
          }
          .header h1 {
            font-size: 22px;
          }
          .verification-button {
            width: 100%;
            display: block;
            padding: 12px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>🎓 خدمات تعليمية متميزة</h1>
          <p>تفعيل حسابك في النظام</p>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="greeting">
            مرحباً بك! 👋
          </div>

          <div class="message-box">
            شكراً لتسجيلك في منصتنا التعليمية. لقد قمت بإنشاء حسابك بنجاح، والآن تحتاج إلى تفعيله للبدء في استخدام جميع المميزات.
          </div>

          <div class="verification-section">
            <div class="verification-text">
              <strong>اضغط على الزر أدناه لتفعيل حسابك:</strong>
            </div>
            <a href="${verificationUrl}" class="verification-button">
              ✓ تفعيل الحساب
            </a>
          </div>

          <div class="divider"></div>

          <!-- Alternative Link -->
          <div class="link-section">
            <div class="link-label">أو انسخ الرابط التالي في المتصفح:</div>
            <div class="link-text">${verificationUrl}</div>
          </div>

          <!-- Important Note -->
          <div class="important-note">
            <strong>⚠️ تنبيه مهم:</strong> لن تتمكن من تسجيل الدخول إلى حسابك إلا بعد تفعيله. الرابط صالح لمدة ساعة واحدة فقط من الآن.
          </div>

          <!-- What You Can Do -->
          <div>
            <h3 style="color: #333; font-size: 16px; margin-bottom: 10px;">بعد تفعيل حسابك يمكنك:</h3>
            <ul class="feature-list">
              <li>✓ تصفح الخدمات التعليمية المتاحة</li>
              <li>✓ إنشاء طلبات جديدة</li>
              <li>✓ متابعة حالة طلباتك</li>
              <li>✓ التواصل مع فريق الدعم</li>
            </ul>
          </div>
        </div>

        <!-- Divider -->
        <div style="height: 1px; background-color: #e0e0e0;"></div>

        <!-- Footer -->
        <div class="footer">
          <p style="margin-bottom: 10px;">هذا البريد الإلكتروني تم إرساله إليك بناءً على تسجيلك الجديد في المنصة.</p>
          <p style="margin-bottom: 15px; font-size: 11px; color: #bbb;">إذا لم تقم بهذا التسجيل، يرجى حذف هذا البريد وتجاهله.</p>
          <div class="footer-links">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}">الموقع الرئيسي</a>
            <span style="color: #e0e0e0;">|</span>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/about">من نحن</a>
          </div>
          <p style="margin-top: 15px; font-size: 10px; color: #ccc;">
            © ${new Date().getFullYear()} خدمات تعليمية متميزة. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject: '✓ تفعيل حسابك في منصة الخدمات التعليمية',
    html,
    text: `مرحباً!\n\nتفعيل الحساب: ${verificationUrl}\n\nالرابط صالح لمدة ساعة واحدة فقط.`
  };
  
  await transporter.sendMail(mailOptions);
}

// دالة إرسال بريد إعادة تعيين كلمة المرور
export async function sendPasswordResetEmail(to: string, name: string, resetLink: string) {
  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          margin-bottom: 5px;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          color: #333;
          margin-bottom: 20px;
        }
        .message-box {
          background-color: #fff3cd;
          border-right: 4px solid #ffc107;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 14px;
          color: #555;
          line-height: 1.8;
        }
        .reset-button {
          display: inline-block;
          margin: 30px 0;
          padding: 15px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          font-size: 16px;
        }
        .reset-link {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border: 1px dashed #ccc;
          border-radius: 4px;
          word-break: break-all;
          font-size: 12px;
          color: #666;
        }
        .warning {
          background-color: #fee;
          border-right: 4px solid #f44336;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 13px;
          color: #d32f2f;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #888;
          font-size: 12px;
        }
        .divider {
          height: 1px;
          background: linear-gradient(to left, rgba(102, 126, 234, 0), rgba(102, 126, 234, 0.5), rgba(102, 126, 234, 0));
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 إعادة تعيين كلمة المرور</h1>
          <p>منصة الخدمات التعليمية</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            مرحباً ${name}،
          </div>
          
          <div class="message-box">
            لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. إذا لم تقم بهذا الطلب، يرجى تجاهل هذا البريد الإلكتروني.
          </div>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="reset-button">
              إعادة تعيين كلمة المرور
            </a>
          </div>
          
          <div class="warning">
            ⚠️ هذا الرابط صالح لمدة ساعة واحدة فقط من وقت إرسال هذا البريد.
          </div>
          
          <div class="divider"></div>
          
          <p style="font-size: 13px; color: #666; margin-bottom: 10px;">
            إذا لم يعمل الزر أعلاه، يمكنك نسخ الرابط التالي ولصقه في المتصفح:
          </p>
          
          <div class="reset-link">
            ${resetLink}
          </div>
          
          <div class="divider"></div>
          
          <p style="font-size: 13px; color: #888; text-align: center;">
            إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.<br>
            حسابك آمن ولن يتم تغيير أي شيء.
          </p>
        </div>
        
        <div class="footer">
          <p>هذا بريد إلكتروني تلقائي، يرجى عدم الرد عليه</p>
          <p style="margin-top: 10px;">© 2024 منصة الخدمات التعليمية. جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: '🔐 إعادة تعيين كلمة المرور - منصة الخدمات التعليمية',
    html
  });
}
 