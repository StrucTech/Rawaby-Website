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

    // التحقق من صلاحيات الأدمن
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    console.log('Admin fetching all contracts');

    // جلب جميع العقود من جدول contracts
    const { data: contracts, error } = await supabaseAdmin
      .from('contracts')
      .select(`
        *,
        user:user_id(id, name, email, phone),
        order:order_id(id, status, total_price)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
      return NextResponse.json({ error: 'خطأ في جلب العقود' }, { status: 500 });
    }

    // جلب معلومات العقود المحفوظة في ملفات المستخدمين كبديل
    const { data: usersWithContracts, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone, contract_info')
      .not('contract_info', 'is', null);

    let additionalContracts: any[] = [];
    if (!usersError && usersWithContracts) {
      additionalContracts = usersWithContracts.map(user => ({
        id: `user_profile_${user.id}`,
        user_id: user.id,
        order_id: null,
        contract1_url: user.contract_info?.contract1_url,
        contract2_url: user.contract_info?.contract2_url,
        contract1_filename: user.contract_info?.contract1_filename,
        contract2_filename: user.contract_info?.contract2_filename,
        status: 'uploaded',
        created_at: user.contract_info?.upload_timestamp,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        source: 'user_profile'
      }));
    }

    const allContracts = [...(contracts || []), ...additionalContracts];

    return NextResponse.json({
      contracts: allContracts,
      total: allContracts.length,
      from_contracts_table: contracts?.length || 0,
      from_user_profiles: additionalContracts.length
    });

  } catch (error: any) {
    console.error('Admin get contracts error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء جلب العقود',
      details: error.message 
    }, { status: 500 });
  }
}