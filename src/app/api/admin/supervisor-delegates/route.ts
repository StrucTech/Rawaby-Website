import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

// إضافة ربط مشرف-مندوب
export async function POST(req: NextRequest) {
  try {
    // التحقق من التوكن والصلاحيات
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

    const { supervisorId, delegateId } = await req.json();
    if (!supervisorId || !delegateId) {
      return NextResponse.json({ error: 'supervisorId و delegateId مطلوبان' }, { status: 400 });
    }

    // تحقق من وجود المشرف والمندوب في قاعدة البيانات
    const { data: supervisor } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', supervisorId)
      .eq('role', 'supervisor')
      .single();

    const { data: delegate } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', delegateId)
      .eq('role', 'delegate')
      .single();

    if (!supervisor || !delegate) {
      return NextResponse.json({ error: 'المشرف أو المندوب غير موجود' }, { status: 404 });
    }

    // تحقق من عدم وجود الربط مسبقاً
    const { data: existingLink } = await supabaseAdmin
      .from('supervisor_delegates')
      .select('id')
      .eq('supervisor_id', supervisorId)
      .eq('delegate_id', delegateId)
      .single();

    if (existingLink) {
      return NextResponse.json({ error: 'هذا الربط موجود بالفعل' }, { status: 400 });
    }

    // إنشاء الربط
    const { data: link, error } = await supabaseAdmin
      .from('supervisor_delegates')
      .insert({ 
        supervisor_id: supervisorId, 
        delegate_id: delegateId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating supervisor-delegate link:', error);
      return NextResponse.json({ error: 'حدث خطأ أثناء الربط' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم الربط بنجاح', link });
  } catch (error) {
    console.error('POST supervisor-delegates error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء الربط' }, { status: 500 });
  }
}

// جلب كل المندوبين المنسوبين لمشرف
export async function GET(req: NextRequest) {
  try {
    // التحقق من التوكن والصلاحيات
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

    const { searchParams } = new URL(req.url);
    const supervisorId = searchParams.get('supervisorId');
    if (!supervisorId) {
      return NextResponse.json({ error: 'supervisorId مطلوب' }, { status: 400 });
    }

    // جلب المندوبين المرتبطين بالمشرف مع بيانات المندوب
    const { data: delegates, error } = await supabaseAdmin
      .from('supervisor_delegates')
      .select(`
        id,
        created_at,
        delegate:delegate_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('supervisor_id', supervisorId);

    if (error) {
      console.error('Error fetching supervisor delegates:', error);
      return NextResponse.json({ error: 'حدث خطأ أثناء الجلب' }, { status: 500 });
    }

    return NextResponse.json({ delegates: delegates || [] });
  } catch (error) {
    console.error('GET supervisor-delegates error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء الجلب' }, { status: 500 });
  }
}

// حذف الربط
export async function DELETE(req: NextRequest) {
  try {
    // التحقق من التوكن والصلاحيات
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'يجب تحديد id' }, { status: 400 });

    // حذف الربط من قاعدة البيانات
    const { data: deleted, error } = await supabaseAdmin
      .from('supervisor_delegates')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error || !deleted) {
      console.error('Error deleting supervisor delegate:', error);
      return NextResponse.json({ error: 'الربط غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ message: 'تم حذف الربط بنجاح' });
  } catch (error) {
    console.error('DELETE supervisor-delegates error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء الحذف' }, { status: 500 });
  }
} 