import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const authHeader = req.headers.get('authorization');
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

    const body = await req.json();
    const { name, email, phone, nationalId, password, isActive, activeFrom, activeTo } = body;

    if (!name || !email || !phone || !nationalId || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    // تحقق من عدم وجود المستخدم مسبقًا
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone},national_id.eq.${nationalId}`);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: 'المستخدم موجود مسبقاً' }, { status: 400 });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // إنشاء المندوب
    const { data: delegate, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        phone,
        national_id: nationalId,
        password: hashedPassword,
        role: 'delegate',
        active: true,
        email_verified: true,
        created_at: new Date().toISOString(),
        is_active: isActive !== false,
        active_from: activeFrom || null,
        active_to: activeTo || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating delegate:', error);
      return NextResponse.json({ error: 'حدث خطأ أثناء إضافة المندوب' }, { status: 500 });
    }

    // إزالة كلمة المرور من الاستجابة
    const { password: _, ...delegateResponse } = delegate;

    return NextResponse.json({ message: 'تم إضافة المندوب بنجاح', delegate: delegateResponse }, { status: 201 });
  } catch (error) {
    console.error('Add delegate error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة المندوب' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const authHeader = req.headers.get('authorization');
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

    if (payload.role !== 'admin' && payload.role !== 'supervisor') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: delegates, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone, national_id, active, created_at, is_active, active_from, active_to')
      .eq('role', 'delegate');

    if (error) {
      console.error('Error fetching delegates:', error);
      return NextResponse.json({ error: 'حدث خطأ أثناء جلب المندوبين' }, { status: 500 });
    }

    return NextResponse.json({ delegates: delegates || [] });
  } catch (error) {
    console.error('GET delegates error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب المندوبين' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const authHeader = req.headers.get('authorization');
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'يجب تحديد id' }, { status: 400 });

    const { data: deleted, error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)
      .eq('role', 'delegate')
      .select()
      .single();

    if (error || !deleted) {
      console.error('Error deleting delegate:', error);
      return NextResponse.json({ error: 'المندوب غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ message: 'تم حذف المندوب بنجاح' });
  } catch (error) {
    console.error('DELETE delegate error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء الحذف' }, { status: 500 });
  }
} 