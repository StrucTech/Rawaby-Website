import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/jwt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// POST - رفع ملفات من العميل وإغلاق الطلب
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
    }

    const { id: orderId, requestId } = await params;

    // التحقق من أن المستخدم هو صاحب الطلب
    const { data: dataRequest, error: requestError } = await supabase
      .from('data_requests')
      .select('*')
      .eq('id', requestId)
      .eq('order_id', orderId)
      .single();

    if (requestError || !dataRequest) {
      return NextResponse.json({ error: 'طلب البيانات غير موجود' }, { status: 404 });
    }

    // التحقق من أن العميل هو المستهدف
    if (dataRequest.client_id !== payload.userId && payload.role === 'user') {
      return NextResponse.json({ error: 'غير مصرح بالوصول لهذا الطلب' }, { status: 403 });
    }

    // التحقق من أن الطلب لم يتم إغلاقه (يمكن الرد على pending أو responded)
    if (dataRequest.status === 'closed') {
      return NextResponse.json({ error: 'تم إغلاق هذا الطلب' }, { status: 400 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const clientNote = formData.get('note') as string || '';

    if (files.length === 0) {
      return NextResponse.json({ error: 'يجب رفع ملف واحد على الأقل' }, { status: 400 });
    }

    const uploadedFiles: any[] = [];

    // رفع الملفات إلى Supabase Storage
    for (const file of files) {
      const fileName = `${orderId}/${requestId}/${Date.now()}_${file.name}`;
      const buffer = await file.arrayBuffer();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-uploads')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      // الحصول على الرابط العام
      const { data: urlData } = supabase.storage
        .from('client-uploads')
        .getPublicUrl(fileName);

      uploadedFiles.push({
        name: file.name,
        path: fileName,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString()
      });
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: 'فشل في رفع الملفات' }, { status: 500 });
    }

    // تحديث طلب البيانات
    const { data: updatedRequest, error: updateError } = await supabase
      .from('data_requests')
      .update({
        status: 'responded',
        uploaded_files: uploadedFiles,
        client_note: clientNote,
        responded_at: new Date().toISOString(),
        responded_by: 'client',
        responded_by_id: payload.userId
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'خطأ في تحديث الطلب' }, { status: 500 });
    }

    // تحديث حالة الطلب الرئيسي إلى "مطلوب بيانات إضافية" (للمراجعة من المشرف)
    await supabase
      .from('orders')
      .update({ status: 'مطلوب بيانات إضافية أو مرفقات' })
      .eq('id', orderId);

    return NextResponse.json({ 
      message: 'تم رفع الملفات بنجاح',
      request: updatedRequest,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// GET - جلب تفاصيل طلب بيانات معين
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
    }

    const { id: orderId, requestId } = await params;

    const { data: dataRequest, error } = await supabase
      .from('data_requests')
      .select(`
        *,
        supervisor:users!data_requests_supervisor_id_fkey(id, name, email),
        client:users!data_requests_client_id_fkey(id, name, email)
      `)
      .eq('id', requestId)
      .eq('order_id', orderId)
      .single();

    if (error || !dataRequest) {
      return NextResponse.json({ error: 'طلب البيانات غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ request: dataRequest });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// PATCH - إغلاق الطلب من المشرف بعد مراجعة الملفات
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = request.cookies.get('token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'supervisor' && payload.role !== 'admin')) {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحية مشرف' }, { status: 403 });
    }

    const { id: orderId, requestId } = await params;

    // إغلاق الطلب
    const { data: updatedRequest, error: updateError } = await supabase
      .from('data_requests')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'خطأ في إغلاق الطلب' }, { status: 500 });
    }

    // تحديث حالة الطلب الرئيسي إلى "تحت الإجراء"
    await supabase
      .from('orders')
      .update({ status: 'تحت الإجراء' })
      .eq('id', orderId);

    return NextResponse.json({ 
      message: 'تم إغلاق الطلب بنجاح',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
