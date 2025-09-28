import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من الصلاحيات
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

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, nationalId } = body;

    if (!name || !email || !phone || !nationalId) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    // التحقق من وجود المندوب
    const { data: existingDelegate } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', params.id)
      .eq('role', 'delegate')
      .single();

    if (!existingDelegate) {
      return NextResponse.json({ error: 'المندوب غير موجود' }, { status: 404 });
    }

    // التحقق من عدم تكرار البيانات (باستثناء المندوب الحالي)
    const { data: duplicateUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone},national_id.eq.${nationalId}`)
      .neq('id', params.id);

    if (duplicateUsers && duplicateUsers.length > 0) {
      return NextResponse.json({ error: 'البيانات مُستخدمة من قبل مستخدم آخر' }, { status: 400 });
    }

    // تحديث بيانات المندوب
    const { data: updatedDelegate, error } = await supabaseAdmin
      .from('users')
      .update({
        name,
        email,
        phone,
        national_id: nationalId,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('role', 'delegate')
      .select()
      .single();

    if (error) {
      console.error('Error updating delegate:', error);
      return NextResponse.json({ error: 'حدث خطأ أثناء تحديث المندوب' }, { status: 500 });
    }

    // إزالة الحقول الحساسة من الاستجابة
    const { password: _, ...delegateResponse } = updatedDelegate;

    return NextResponse.json({ 
      message: 'تم تحديث بيانات المندوب بنجاح', 
      delegate: delegateResponse 
    }, { status: 200 });

  } catch (error) {
    console.error('Update delegate error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث المندوب' }, { status: 500 });
  }
}