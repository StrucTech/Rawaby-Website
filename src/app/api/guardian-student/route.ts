import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - حفظ بيانات ولي الأمر والطالب
export async function POST(req: NextRequest) {
  try {
    console.log('API Guardian-Student: POST request received');
    
    // التحقق من المصادقة
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

    const userId = payload.userId;
    console.log('User ID:', userId);

    const body = await req.json();
    console.log('Received body:', body);
    const { guardian: guardianData, student: studentData } = body;

    // التحقق من الحقول المطلوبة
    if (!guardianData || !studentData) {
      console.log('Missing guardian or student data');
      return NextResponse.json({ error: 'بيانات ولي الأمر والطالب مطلوبة' }, { status: 400 });
    }

    // التحقق من بيانات ولي الأمر
    if (!guardianData.fullName || !guardianData.mobileNumber || !guardianData.nationalId) {
      console.log('Missing guardian fields:', { fullName: !!guardianData.fullName, mobileNumber: !!guardianData.mobileNumber, nationalId: !!guardianData.nationalId });
      return NextResponse.json({ error: 'جميع بيانات ولي الأمر مطلوبة' }, { status: 400 });
    }

    // التحقق من بيانات الطالب
    if (!studentData.fullName || !studentData.grade || !studentData.totalScore || !studentData.certificateType) {
      console.log('Missing student fields:', { fullName: !!studentData.fullName, grade: !!studentData.grade, totalScore: !!studentData.totalScore, certificateType: !!studentData.certificateType });
      return NextResponse.json({ error: 'جميع بيانات الطالب مطلوبة' }, { status: 400 });
    }

    // التحقق من صحة رقم الجوال المصري
    const egyptPattern = /^(01)[0-9]{9}$/;
    if (!egyptPattern.test(guardianData.mobileNumber.replace(/[\s\-\+]/g, ''))) {
      console.log('Invalid mobile number:', guardianData.mobileNumber);
      return NextResponse.json({ error: 'رقم الجوال المصري غير صحيح' }, { status: 400 });
    }

    // التحقق من صحة الرقم القومي المصري
    const nationalIdRegex = /^[0-9]{14}$/;
    if (!nationalIdRegex.test(guardianData.nationalId)) {
      console.log('Invalid national ID:', guardianData.nationalId);
      return NextResponse.json({ error: 'الرقم القومي المصري غير صحيح (14 رقم)' }, { status: 400 });
    }

    console.log('Starting database operations...');

    // التحقق من عدم تكرار الهوية الوطنية
    try {
      const { data: existingGuardianByNationalId } = await supabaseAdmin
        .from('guardians')
        .select('user_id')
        .eq('national_id', guardianData.nationalId)
        .single();

      if (existingGuardianByNationalId && existingGuardianByNationalId.user_id !== userId) {
        console.log('National ID already exists for another user');
        return NextResponse.json({ error: 'الرقم القومي مستخدم مسبقاً' }, { status: 400 });
      }
    } catch (error: any) {
      // إذا لم توجد بيانات، هذا طبيعي
      if (error.code !== 'PGRST116') {
        console.error('Error checking national ID:', error);
      }
    }

    // التحقق من عدم تكرار رقم الجوال
    try {
      const { data: existingGuardianByMobile } = await supabaseAdmin
        .from('guardians')
        .select('user_id')
        .eq('mobile_number', guardianData.mobileNumber)
        .single();

      if (existingGuardianByMobile && existingGuardianByMobile.user_id !== userId) {
        console.log('Mobile number already exists for another user');
        return NextResponse.json({ error: 'رقم الجوال مستخدم مسبقاً' }, { status: 400 });
      }
    } catch (error: any) {
      // إذا لم توجد بيانات، هذا طبيعي
      if (error.code !== 'PGRST116') {
        console.error('Error checking mobile number:', error);
      }
    }

    // البحث عن ولي أمر موجود للمستخدم
    let guardianRecord;
    try {
      console.log('Finding existing guardian...');
      const { data: existingGuardian } = await supabaseAdmin
        .from('guardians')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      guardianRecord = existingGuardian;
      console.log('Existing guardian found:', !!guardianRecord);
    } catch (error: any) {
      if (error.code !== 'PGRST116') {
        console.error('Error finding guardian by user ID:', error);
        throw error;
      }
    }

    if (guardianRecord) {
      // تحديث ولي الأمر الموجود
      try {
        console.log('Updating existing guardian...');
        const { data: updatedGuardian, error } = await supabaseAdmin
          .from('guardians')
          .update({
            full_name: guardianData.fullName,
            mobile_number: guardianData.mobileNumber,
            national_id: guardianData.nationalId,
            address: guardianData.address || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', guardianRecord.id)
          .select()
          .single();

        if (error) throw error;
        guardianRecord = updatedGuardian;
        console.log('Guardian updated successfully');
      } catch (error) {
        console.error('Error updating guardian:', error);
        throw error;
      }
    } else {
      // إنشاء ولي أمر جديد
      try {
        console.log('Creating new guardian...');
        const { data: newGuardian, error } = await supabaseAdmin
          .from('guardians')
          .insert({
            user_id: userId,
            full_name: guardianData.fullName,
            mobile_number: guardianData.mobileNumber,
            national_id: guardianData.nationalId,
            address: guardianData.address || null
          })
          .select()
          .single();

        if (error) throw error;
        guardianRecord = newGuardian;
        console.log('Guardian created successfully');
      } catch (error) {
        console.error('Error creating guardian:', error);
        throw error;
      }
    }

    // إنشاء طالب جديد (يمكن للمستخدم أن يكون له أكثر من طالب)
    let studentRecord;
    try {
      console.log('Creating new student...');
      const { data: newStudent, error } = await supabaseAdmin
        .from('students')
        .insert({
          guardian_id: guardianRecord.id,
          full_name: studentData.fullName,
          grade: studentData.grade,
          school_name: studentData.schoolName || null,
          total_score: studentData.totalScore,
          certificate_type: studentData.certificateType
        })
        .select()
        .single();

      if (error) throw error;
      studentRecord = newStudent;
      console.log('Student created successfully');
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }

    console.log('All operations completed successfully');
    return NextResponse.json({
      message: 'تم حفظ البيانات بنجاح',
      guardian: guardianRecord,
      student: studentRecord
    }, { status: 201 });

  } catch (error: any) {
    console.error('API Guardian-Student error:', error);
    console.error('Error stack:', error.stack);

    return NextResponse.json({ 
      error: 'حدث خطأ أثناء حفظ البيانات',
      details: error.message 
    }, { status: 500 });
  }
}

// GET - جلب بيانات ولي الأمر والطلاب
export async function GET(req: NextRequest) {
  try {
    // التحقق من المصادقة
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

    const userId = payload.userId;

    // جلب بيانات ولي الأمر
    const { data: guardian } = await supabaseAdmin
      .from('guardians')
      .select('*')
      .eq('user_id', userId)
      .single();

    // جلب بيانات الطلاب
    const { data: students } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('guardian_id', guardian?.id);

    return NextResponse.json({
      guardian,
      students
    });

  } catch (error: any) {
    console.error('Get guardian/student info error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 });
  }
}