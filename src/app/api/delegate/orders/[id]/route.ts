import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;
    
    console.log('Delegate PATCH request body:', { status });

    if (!status) {
      return new NextResponse(
        JSON.stringify({ error: 'الرجاء تحديد حالة الطلب' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate status - المندوب يمكنه فقط تغيير الحالة إلى "done"
    if (status !== 'done') {
      return new NextResponse(
        JSON.stringify({ error: 'المندوب يمكنه فقط تغيير الحالة إلى مكتملة' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // التحقق من الصلاحيات - فقط المندوبين
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (payload.role !== 'delegate') {
      return NextResponse.json({ error: 'Access denied - delegates only' }, { status: 403 });
    }

    // البحث عن الطلب
    const { data: dbOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !dbOrder) {
      return new NextResponse(
        JSON.stringify({ error: 'الطلب غير موجود' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // التحقق من أن المندوب مُعيّن لهذا الطلب
    let noteData: any = {};
    try {
      noteData = dbOrder.note ? JSON.parse(dbOrder.note) : {};
    } catch (e) {
      console.log('Could not parse existing note');
    }

    const assignedDelegateId = noteData.assignedDelegate;
    if (assignedDelegateId !== payload.userId) {
      return new NextResponse(
        JSON.stringify({ error: 'غير مسموح - هذا الطلب غير مُعيّن لك' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // تحديث حالة الطلب وإضافة معلومات الإكمال
    noteData.completedBy = payload.userId;
    noteData.completedAt = new Date().toISOString();

    const updateData = {
      status: 'done',
      note: JSON.stringify(noteData)
    };

    console.log('Updating order with data:', updateData);
    const { data, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    console.log('Update result:', { data, updateError });

    if (updateError) {
      console.error('Update error details:', JSON.stringify(updateError, null, 2));
      return new NextResponse(
        JSON.stringify({ 
          error: 'حدث خطأ أثناء تحديث حالة الطلب',
          details: updateError.message 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'تم إكمال المهمة بنجاح',
        data: {
          orderId: data.id,
          status: data.status,
          completedBy: payload.userId,
          completedAt: noteData.completedAt
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error updating order:', error);
    return new NextResponse(
      JSON.stringify({ error: 'حدث خطأ أثناء تحديث حالة الطلب' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}