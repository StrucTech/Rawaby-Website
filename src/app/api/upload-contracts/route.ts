import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { validateFile, checkForMaliciousContent, generateSafeFileName, FILE_SIZE_LIMITS } from '@/lib/fileValidation';
import { checkRateLimit, getClientIP, createRateLimitKey, rateLimitConfigs } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// =============================================
// API لرفع العقود الممتلئة والموقعة من العملاء
// يتم تخزينها في bucket: client-contracts
// بتنسيق: [اسم-العميل-id]/order-[orderId]/filename
// =============================================

export async function POST(req: NextRequest) {
  try {
    // Rate Limiting
    const clientIP = getClientIP(req);
    const rateLimitKey = createRateLimitKey(clientIP, 'upload-contracts');
    const rateLimitResult = checkRateLimit(rateLimitKey, rateLimitConfigs.upload);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
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
    console.log('Uploading signed contracts for user:', userId);

    const formData = await req.formData();
    const contract1 = formData.get('contract1') as File;
    const contract2 = formData.get('contract2') as File;
    const orderId = formData.get('orderId') as string;

    if (!contract1 || !contract2) {
      return NextResponse.json({ error: 'يجب رفع كلا الملفين' }, { status: 400 });
    }

    // التحقق الشامل من الملفات باستخدام المكتبة الجديدة
    const validation1 = await validateFile(contract1, {
      allowedTypes: 'all',
      maxSize: FILE_SIZE_LIMITS.contract,
      fileName: contract1.name
    });

    const validation2 = await validateFile(contract2, {
      allowedTypes: 'all',
      maxSize: FILE_SIZE_LIMITS.contract,
      fileName: contract2.name
    });

    if (!validation1.valid) {
      return NextResponse.json({ 
        error: `الملف الأول: ${validation1.error}` 
      }, { status: 400 });
    }

    if (!validation2.valid) {
      return NextResponse.json({ 
        error: `الملف الثاني: ${validation2.error}` 
      }, { status: 400 });
    }

    // فحص المحتوى الضار
    const isSafe1 = await checkForMaliciousContent(contract1);
    const isSafe2 = await checkForMaliciousContent(contract2);

    if (!isSafe1 || !isSafe2) {
      return NextResponse.json({ 
        error: 'تم اكتشاف محتوى غير آمن في الملف' 
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

    // =============================================
    // إنشاء مسار التخزين الجديد
    // bucket: client-contracts
    // path: [اسم-العميل-id]/order-[orderId]/filename
    // =============================================
    const clientBucket = 'client-contracts';
    
    // تنظيف اسم العميل للاستخدام في المسار
    const cleanClientName = userData.name
      .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // إنشاء مسار المجلد
    const clientFolder = `${cleanClientName}-${userId.slice(0, 8)}`;
    const orderFolder = orderId ? `order-${orderId.slice(0, 8)}` : `order-${Date.now()}`;
    
    // أسماء الملفات
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const contract1Extension = contract1.name.split('.').pop();
    const contract2Extension = contract2.name.split('.').pop();
    
    const contract1Path = `${clientFolder}/${orderFolder}/contract1_signed_${timestamp}.${contract1Extension}`;
    const contract2Path = `${clientFolder}/${orderFolder}/contract2_signed_${timestamp}.${contract2Extension}`;

    // تحويل الملفات إلى Buffer
    const contract1Buffer = Buffer.from(await contract1.arrayBuffer());
    const contract2Buffer = Buffer.from(await contract2.arrayBuffer());

    // التحقق من وجود bucket العقود وإنشاؤه إذا لم يكن موجوداً
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const clientContractsBucket = buckets?.find((b: any) => b.name === clientBucket);
      
      if (!clientContractsBucket) {
        console.log('Creating client-contracts bucket...');
        const { error: bucketError } = await supabaseAdmin.storage.createBucket(clientBucket, {
          public: false, // خاص - فقط للمستخدمين المصرح لهم
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
        console.log('✅ تم إنشاء bucket العقود الموقعة');
      }
    } catch (bucketCheckError) {
      console.error('Error checking/creating bucket:', bucketCheckError);
    }

    // رفع الملف الأول
    console.log('Uploading signed contract1:', contract1Path);
    const { data: data1, error: error1 } = await supabaseAdmin.storage
      .from(clientBucket)
      .upload(contract1Path, contract1Buffer, {
        contentType: contract1.type,
        upsert: true
      });

    if (error1) {
      console.error('Error uploading contract1:', error1);
      throw new Error(`خطأ في رفع العقد الأول: ${error1.message}`);
    }
    console.log('Contract1 uploaded successfully:', data1);

    // رفع الملف الثاني
    console.log('Uploading signed contract2:', contract2Path);
    const { data: data2, error: error2 } = await supabaseAdmin.storage
      .from(clientBucket)
      .upload(contract2Path, contract2Buffer, {
        contentType: contract2.type,
        upsert: true
      });

    if (error2) {
      console.error('Error uploading contract2:', error2);
      // حذف الملف الأول في حالة فشل رفع الثاني
      try {
        await supabaseAdmin.storage.from(clientBucket).remove([contract1Path]);
      } catch (cleanupError) {
        console.error('Error cleaning up contract1:', cleanupError);
      }
      throw new Error(`خطأ في رفع العقد الثاني: ${error2.message}`);
    }
    console.log('Contract2 uploaded successfully:', data2);

    // حفظ معلومات العقود في جدول contracts
    let contractData = null;
    try {
      console.log('Saving contract data to database...');
      const { data: savedContract, error: contractError } = await supabaseAdmin
        .from('contracts')
        .insert({
          user_id: userId,
          order_id: orderId || null,
          contract1_url: contract1Path, // حفظ المسار بدلاً من URL العام
          contract2_url: contract2Path,
          contract1_filename: contract1.name,
          contract2_filename: contract2.name,
          storage_bucket: clientBucket, // حفظ اسم الـ bucket
          client_folder: clientFolder, // حفظ مجلد العميل
          status: 'uploaded'
        })
        .select()
        .single();

      if (contractError) {
        console.error('Error saving contract to database:', contractError);
        
        // محاولة بديلة: حفظ في جدول المستخدمين
        console.log('Trying alternative: saving to user profile...');
        const contractInfo = {
          contract1_path: contract1Path,
          contract2_path: contract2Path,
          contract1_filename: contract1.name,
          contract2_filename: contract2.name,
          storage_bucket: clientBucket,
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

    console.log('✅ Signed contracts uploaded successfully to:', clientFolder);

    return NextResponse.json({
      message: 'تم رفع العقود الموقعة بنجاح',
      contractId: contractData?.id || `temp_${userId}_${Date.now()}`,
      storage: {
        bucket: clientBucket,
        clientFolder: clientFolder,
        orderFolder: orderFolder
      },
      files: {
        contract1: {
          path: contract1Path,
          filename: contract1.name
        },
        contract2: {
          path: contract2Path,
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