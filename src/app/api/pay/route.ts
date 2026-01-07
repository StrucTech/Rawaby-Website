import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return new NextResponse(
        JSON.stringify({ error: 'الرجاء تحديد رقم الطلب' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Find the order and verify ownership
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', payload.userId)
      .single();

    if (fetchError || !order) {
      return new NextResponse(
        JSON.stringify({ error: 'الطلب غير موجود' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (order.status !== 'pending') {
      return new NextResponse(
        JSON.stringify({ error: 'لا يمكن الدفع لهذا الطلب' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update order status to paid
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        status: 'paid',
        payment_date: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return new NextResponse(
        JSON.stringify({ error: 'حدث خطأ أثناء تحديث الطلب' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Return success response
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'تم الدفع بنجاح',
        data: {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          totalPrice: updatedOrder.total_price,
          paymentDate: updatedOrder.payment_date
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Payment error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'حدث خطأ أثناء معالجة الدفع' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 