import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    // التحقق من المصادقة
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    } catch (error) {
      return NextResponse.json({ error: 'رمز المصادقة غير صحيح' }, { status: 401 });
    }

    const userId = payload.userId;
    console.log('Uploading contracts for user:', userId);

    const formData = await req.formData();
    const contract1 = formData.get('contract1') as File;
    const contract2 = formData.get('contract2') as File;

    if (!contract1 || !contract2) {
      return NextResponse.json({ error: 'يجب رفع كلا الملفين' }, { status: 400 });
    }

    // التحقق من نوع الملفات
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    if (!allowedTypes.includes(contract1.type) || !allowedTypes.includes(contract2.type)) {
      return NextResponse.json({ 
        error: 'نوع الملف غير مدعوم. يرجى رفع ملفات PDF أو Word أو صور' 
      }, { status: 400 });
    }

    // التحقق من حجم الملفات (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (contract1.size > maxSize || contract2.size > maxSize) {
      return NextResponse.json({ 
        error: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت' 
      }, { status: 400 });
    }

    // الحصول على اسم المستخدم من قاعدة البيانات
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'خطأ في جلب بيانات المستخدم' }, { status: 500 });
    }

    // إنشاء أسماء فريدة للملفات بتنسيق userid-name-datetime
    const now = new Date();
    const dateTimeString = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5); // YYYY-MM-DD_HH-MM-SS
    const userName = userData.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_'); // تنظيف الاسم من الرموز الخاصة
    
    const contract1Extension = contract1.name.split('.').pop();
    const contract2Extension = contract2.name.split('.').pop();
    
    const contract1FileName = `${userId}-${userName}-${dateTimeString}_contract1.${contract1Extension}`;
    const contract2FileName = `${userId}-${userName}-${dateTimeString}_contract2.${contract2Extension}`;

    // تحويل الملفات إلى Buffer
    const contract1Buffer = Buffer.from(await contract1.arrayBuffer());
    const contract2Buffer = Buffer.from(await contract2.arrayBuffer());

    // التحقق من وجود bucket العقود وإنشاؤه إذا لم يكن موجوداً
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const contractsBucket = buckets?.find(b => b.name === 'contracts');
      
      if (!contractsBucket) {
        console.log('Creating contracts bucket...');
        const { error: bucketError } = await supabaseAdmin.storage.createBucket('contracts', {
          public: true,
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/jpg'
          ]
        });
        
        if (bucketError) {
          console.error('Error creating bucket:', bucketError);
          throw new Error('فشل في إنشاء مساحة التخزين');
        }
      }
    } catch (bucketCheckError) {
      console.error('Error checking/creating bucket:', bucketCheckError);
    }

    // رفع الملف الأول
    console.log('Uploading contract1:', contract1FileName);
    const { data: data1, error: error1 } = await supabaseAdmin.storage
      .from('contracts')
      .upload(contract1FileName, contract1Buffer, {
        contentType: contract1.type,
        upsert: true // السماح بالاستبدال إذا كان الملف موجود
      });

    if (error1) {
      console.error('Error uploading contract1:', error1);
      throw new Error(`خطأ في رفع العقد الأول: ${error1.message}`);
    }
    console.log('Contract1 uploaded successfully:', data1);

    // رفع الملف الثاني
    console.log('Uploading contract2:', contract2FileName);
    const { data: data2, error: error2 } = await supabaseAdmin.storage
      .from('contracts')
      .upload(contract2FileName, contract2Buffer, {
        contentType: contract2.type,
        upsert: true // السماح بالاستبدال إذا كان الملف موجود
      });

    if (error2) {
      console.error('Error uploading contract2:', error2);
      // حذف الملف الأول في حالة فشل رفع الثاني
      try {
        await supabaseAdmin.storage.from('contracts').remove([contract1FileName]);
      } catch (cleanupError) {
        console.error('Error cleaning up contract1:', cleanupError);
      }
      throw new Error(`خطأ في رفع العقد الثاني: ${error2.message}`);
    }
    console.log('Contract2 uploaded successfully:', data2);

    // الحصول على روابط الملفات العامة (تعمل الآن لأن bucket عام)
    const { data: url1 } = supabaseAdmin.storage
      .from('contracts')
      .getPublicUrl(contract1FileName);

    const { data: url2 } = supabaseAdmin.storage
      .from('contracts')
      .getPublicUrl(contract2FileName);

    // حفظ معلومات العقود في جدول contracts
    // التحقق من وجود order_id في الطلب
    const formOrderId = formData.get('orderId') as string;
    
    let contractData = null;
    try {
      console.log('Saving contract data to database...');
      const { data: savedContract, error: contractError } = await supabaseAdmin
        .from('contracts')
        .insert({
          user_id: userId,
          order_id: formOrderId || null, // ربط بالطلب إذا تم تمريره
          contract1_url: url1.publicUrl,
          contract2_url: url2.publicUrl,
          contract1_filename: contract1.name,
          contract2_filename: contract2.name,
          status: 'uploaded'
        })
        .select()
        .single();

      if (contractError) {
        console.error('Error saving contract to database:', contractError);
        
        // محاولة بديلة: حفظ في جدول المستخدمين
        console.log('Trying alternative: saving to user profile...');
        const contractInfo = {
          contract1_url: url1.publicUrl,
          contract2_url: url2.publicUrl,
          contract1_filename: contract1.name,
          contract2_filename: contract2.name,
          upload_timestamp: new Date().toISOString()
        };

        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            contract_info: contractInfo,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating user contract info:', updateError);
        } else {
          console.log('Contract info saved to user profile as fallback');
        }
      } else {
        contractData = savedContract;
        console.log('Contract data saved successfully to contracts table:', contractData.id);
      }
    } catch (saveError) {
      console.error('Error in contract save process:', saveError);
    }

    console.log('Contracts uploaded successfully');

    return NextResponse.json({
      message: 'تم رفع العقود بنجاح',
      contractId: contractData?.id || `temp_${userId}_${Date.now()}`,
      files: {
        contract1: {
          url: url1.publicUrl,
          filename: contract1.name
        },
        contract2: {
          url: url2.publicUrl,
          filename: contract2.name
        }
      },
      saved_to_database: !!contractData
    }, { status: 201 });

  } catch (error: any) {
    console.error('Upload contracts error:', error);

    // معالجة أخطاء المصادقة
    if (error.message === 'No token provided' || 
        error.message === 'Invalid token' || 
        error.message === 'Token expired') {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'حدث خطأ أثناء رفع العقود',
      details: error.message 
    }, { status: 500 });
  }
}