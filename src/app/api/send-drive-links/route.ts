import { NextRequest, NextResponse } from 'next/server';
import { sendMailWithDriveLinks } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, studentName, guardianName } = body;

    if (!email || !studentName || !guardianName) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    // ضع هنا روابط Google Drive الحقيقية لاحقاً
    const contract1 = 'https://docs.google.com/document/d/1CJmeqYd65Viy5xNy3kpiyGOaDAjxpeoe/edit?usp=sharing&ouid=100779046842441458148&rtpof=true&sd=true';
    const contract2 = 'https://docs.google.com/document/d/1B6uPZo878sGT6ZpVY15zVXJgaefo7gZO/edit?usp=sharing&ouid=100779046842441458148&rtpof=true&sd=true';

    await sendMailWithDriveLinks(email, {
      studentName,
      guardianName,
      contract1,
      contract2
    });

    return NextResponse.json({ message: 'تم إرسال روابط العقود إلى بريدك الإلكتروني.' });
  } catch (error) {
    console.error('Send drive links error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إرسال الإيميل.' }, { status: 500 });
  }
} 