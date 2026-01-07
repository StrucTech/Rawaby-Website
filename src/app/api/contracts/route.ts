import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true'; // للأدمن لرؤية جميع العقود

    console.log('Fetching contracts for user:', userId, 'all:', all);

    let query = supabaseAdmin.from('contracts').select(`
      *,
      user:user_id(id, name, email),
      order:order_id(id, status, total_price)
    `);

    // إذا لم يكن أدمن، جلب عقود المستخدم فقط
    if (!all || payload.role !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data: contracts, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
      return NextResponse.json({ error: 'خطأ في جلب العقود' }, { status: 500 });
    }

    // إذا لم توجد عقود في الجدول، جرب البحث في معلومات المستخدم
    if (!contracts || contracts.length === 0) {
      console.log('No contracts found in contracts table, checking user profile...');
      
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('contract_info')
        .eq('id', userId)
        .single();

      if (!userError && userData?.contract_info) {
        console.log('Found contract info in user profile');
        return NextResponse.json({
          contracts: [{
            id: `user_profile_${userId}`,
            user_id: userId,
            order_id: null,
            contract1_url: userData.contract_info.contract1_url,
            contract2_url: userData.contract_info.contract2_url,
            contract1_filename: userData.contract_info.contract1_filename,
            contract2_filename: userData.contract_info.contract2_filename,
            status: 'uploaded',
            created_at: userData.contract_info.upload_timestamp,
            source: 'user_profile'
          }],
          total: 1
        });
      }
    }

    return NextResponse.json({
      contracts: contracts || [],
      total: contracts?.length || 0
    });

  } catch (error: any) {
    console.error('Get contracts error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء جلب العقود',
      details: error.message 
    }, { status: 500 });
  }
}