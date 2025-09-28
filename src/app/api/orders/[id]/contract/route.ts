import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Contract terms in Arabic
const CONTRACT_TERMS = `
شروط وأحكام العقد

1. يلتزم الطرف الأول (العميل) بدفع المبلغ المتفق عليه كاملاً قبل بدء الخدمة.
2. يلتزم الطرف الثاني (المزود) بتقديم الخدمة وفق المواصفات المتفق عليها.
3. يمكن إلغاء العقد قبل 24 ساعة من موعد الخدمة.
4. في حالة الإلغاء بعد 24 ساعة، يتم خصم 50% من المبلغ.
5. يلتزم الطرفان بالسرية التامة فيما يتعلق ببيانات العملاء.
`;

interface ServiceDetails {
  id: string;
  name: string;
  price: number;
  duration: string;
}

interface PopulatedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  national_id: string;
}

interface PopulatedOrder {
  id: string;
  user_id: string;
  services: ServiceDetails[];
  guardian_name: string;
  guardian_phone: string;
  student_name: string;
  student_grade: string;
  total_price: number;
  status: string;
  created_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من التوكن
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'غير مصرح لك بالوصول' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: 'توكن غير صالح' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get order data
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (orderError || !order) {
      return new NextResponse(
        JSON.stringify({ error: 'الطلب غير موجود' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('name, email, phone, national_id')
      .eq('id', order.user_id)
      .single();

    if (!order) {
      return new NextResponse(
        JSON.stringify({ error: 'الطلب غير موجود' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user owns the order
    if (order.userId._id.toString() !== user.userId) {
      return new NextResponse(
        JSON.stringify({ error: 'غير مصرح لك بالوصول لهذا الطلب' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      layout: 'portrait'
    });

    // Create a buffer to store the PDF
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Add content to PDF
    doc
      .font('Helvetica')
      .fontSize(20)
      .text('عقد تقديم الخدمات', { align: 'center' })
      .moveDown(2);

    // User Information
    doc
      .fontSize(14)
      .text('معلومات العميل:', { align: 'right' })
      .moveDown(0.5)
      .fontSize(12)
      .text(`الاسم: ${order.userId.name}`, { align: 'right' })
      .text(`البريد الإلكتروني: ${order.userId.email}`, { align: 'right' })
      .text(`رقم الجوال: ${order.userId.phone}`, { align: 'right' })
      .text(`الرقم القومي: ${order.userId.nationalId}`, { align: 'right' })
      .moveDown(1);

    // Order Information
    doc
      .fontSize(14)
      .text('تفاصيل الطلب:', { align: 'right' })
      .moveDown(0.5)
      .fontSize(12)
      .text(`رقم الطلب: ${order._id}`, { align: 'right' })
      .text(`تاريخ الطلب: ${new Date(order.createdAt).toLocaleDateString('ar-SA')}`, { align: 'right' })
      .moveDown(1);

    // Services
    doc
      .fontSize(14)
      .text('الخدمات المطلوبة:', { align: 'right' })
      .moveDown(0.5)
      .fontSize(12);

    order.services.forEach((service) => {
      doc
        .text(`- ${service.name}`, { align: 'right' })
        .text(`  المدة: ${service.duration}`, { align: 'right' })
        .text(`  السعر: ${service.price} ريال`, { align: 'right' })
        .moveDown(0.5);
    });

    // Total
    doc
      .moveDown(1)
      .fontSize(14)
      .text(`المبلغ الإجمالي: ${order.totalPrice} ريال`, { align: 'right' })
      .moveDown(2);

    // Contract Terms
    doc
      .fontSize(14)
      .text('شروط وأحكام العقد:', { align: 'right' })
      .moveDown(0.5)
      .fontSize(12)
      .text(CONTRACT_TERMS, { align: 'right' })
      .moveDown(2);

    // Signatures
    doc
      .fontSize(12)
      .text('توقيع العميل: _________________', { align: 'right' })
      .moveDown(1)
      .text('توقيع المزود: _________________', { align: 'right' });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be generated
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Return PDF file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contract-${order._id}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating contract:', error);
    return new NextResponse(
      JSON.stringify({ error: 'حدث خطأ أثناء إنشاء العقد' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 