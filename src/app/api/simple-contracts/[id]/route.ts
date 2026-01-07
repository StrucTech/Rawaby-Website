import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== SIMPLE CONTRACTS API CALLED ===');
  console.log('Order ID:', params.id);
  
  try {
    // التحقق من التوكن
    const authHeader = request.headers.get('authorization');
    console.log('Auth header exists:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      console.log('Token verified - User ID:', payload.userId, 'Role:', payload.role);
    } catch (error) {
      console.log('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const orderId = params.id;
    console.log('Looking for order:', orderId);

    // جلب الطلب بشكل مبسط
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    console.log('Order query result:', { found: !!order, error: orderError?.message });
    
    if (orderError || !order) {
      console.log('Order not found in database');
      return NextResponse.json({ 
        error: 'Order not found',
        orderId: orderId,
        details: 'Order does not exist in database'
      }, { status: 404 });
    }

    console.log('Order found:', {
      id: order.id.substring(0, 8),
      client_id: order.client_id?.substring(0, 8),
      assigned_delegate_id: order.assigned_delegate_id?.substring(0, 8),
      status: order.status
    });

    // التحقق من الصلاحيات
    console.log('Role-based access check:', {
      userRole: payload.role,
      userId: payload.userId.substring(0, 8),
      orderClientId: order.client_id.substring(0, 8),
      orderSupervisorId: order.assigned_supervisor_id?.substring(0, 8),
      orderDelegateId: order.assigned_delegate_id?.substring(0, 8)
    });

    // الأدمن والمشرفين يمكنهم الوصول لأي طلب
    if (payload.role === 'admin' || payload.role === 'supervisor') {
      console.log('Admin/Supervisor access granted');
    } else if (payload.role === 'delegate') {
      // للمندوبين: التحقق من التخصيص
      const isAssigned = order.assigned_delegate_id === payload.userId;
      console.log('Delegate access check:', { isAssigned });
      
      if (!isAssigned) {
        return NextResponse.json({ 
          error: 'Access denied - Not assigned to this order',
          message: 'غير مصرح - هذا الطلب غير معيّن لك',
          userDelegateId: payload.userId,
          orderDelegateId: order.assigned_delegate_id
        }, { status: 403 });
      }
    } else if (payload.role === 'user') {
      // للمستخدمين العاديين: التحقق من الملكية
      const isOwner = order.client_id === payload.userId;
      console.log('User/Owner access check:', { isOwner });
      
      if (!isOwner) {
        return NextResponse.json({ 
          error: 'Access denied - Not the order owner',
          message: 'غير مصرح - هذا الطلب ليس لك',
          userClientId: payload.userId,
          orderClientId: order.client_id
        }, { status: 403 });
      }
    }

    // جلب العقود من قاعدة البيانات
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .eq('order_id', orderId);

    console.log('Contracts query result (by order_id):', { 
      count: contracts?.length || 0, 
      error: contractsError?.message 
    });

    // إذا لم تُوجد عقود بالـ order_id، جرب البحث عن عقود العميل
    let finalContracts = contracts || [];
    if ((!finalContracts || finalContracts.length === 0) && order.client_id) {
      console.log('No contracts found by order_id, searching by client_id...');
      
      const { data: clientContracts, error: clientContractsError } = await supabaseAdmin
        .from('contracts')
        .select('*')
        .eq('user_id', order.client_id);
      
      console.log('Client contracts query result:', { 
        count: clientContracts?.length || 0, 
        error: clientContractsError?.message 
      });
      
      if (clientContracts && clientContracts.length > 0) {
        finalContracts = clientContracts;
      }
    }

    // إذا لم نجد عقود في قاعدة البيانات، ابحث في Storage
    if ((!finalContracts || finalContracts.length === 0) && order.client_id) {
      console.log('No contracts found in database, searching in storage...');
      
      try {
        const bucketName = 'client-contracts';
        
        // أولاً: جلب قائمة مجلدات العملاء في الـ bucket
        const { data: rootFolders, error: rootError } = await supabaseAdmin.storage
          .from(bucketName)
          .list('', { limit: 100 });
        
        console.log('Root folders in bucket:', rootFolders?.map(f => f.name));
        
        if (rootFolders && rootFolders.length > 0) {
          // البحث عن مجلد العميل (يحتوي على client_id substring)
          const clientIdShort = order.client_id.substring(0, 8);
          const clientFolder = rootFolders.find(f => f.name.includes(clientIdShort))?.name;
          
          console.log('Looking for client folder with ID:', clientIdShort, 'Found:', clientFolder);
          
          if (clientFolder) {
            // جلب مجلدات الطلبات داخل مجلد العميل
            const { data: orderFolders, error: orderFoldersError } = await supabaseAdmin.storage
              .from(bucketName)
              .list(`${clientFolder}/`, { limit: 100 });
            
            console.log('Order folders in client folder:', orderFolders?.map(f => f.name));
            
            if (orderFolders && orderFolders.length > 0) {
              const storageContracts = [];
              
              // لكل مجلد طلب، جلب الملفات
              for (const orderFolder of orderFolders) {
                if (orderFolder.name.startsWith('order-')) {
                  const folderPath = `${clientFolder}/${orderFolder.name}`;
                  
                  const { data: contractFiles, error: filesError } = await supabaseAdmin.storage
                    .from(bucketName)
                    .list(`${folderPath}/`, { limit: 10 });
                  
                  console.log(`Files in ${folderPath}:`, contractFiles?.map(f => f.name));
                  
                  if (contractFiles && contractFiles.length > 0) {
                    // فصل ملفات contract1 و contract2
                    const contract1File = contractFiles.find(f => f.name.includes('contract1'));
                    const contract2File = contractFiles.find(f => f.name.includes('contract2'));
                    
                    // بناء Signed URLs للملفات (صالحة لمدة ساعة)
                    let contract1Url = null;
                    let contract2Url = null;
                    
                    if (contract1File) {
                      const { data: signedData1 } = await supabaseAdmin.storage
                        .from(bucketName)
                        .createSignedUrl(`${folderPath}/${contract1File.name}`, 3600); // ساعة واحدة
                      contract1Url = signedData1?.signedUrl;
                    }
                    
                    if (contract2File) {
                      const { data: signedData2 } = await supabaseAdmin.storage
                        .from(bucketName)
                        .createSignedUrl(`${folderPath}/${contract2File.name}`, 3600); // ساعة واحدة
                      contract2Url = signedData2?.signedUrl;
                    }
                    
                    storageContracts.push({
                      id: `storage_${orderFolder.name}`,
                      user_id: order.client_id,
                      order_id: orderId,
                      contract1_filename: contract1File?.name || 'العقد الأول',
                      contract2_filename: contract2File?.name || 'العقد الثاني',
                      contract1_url: contract1Url,
                      contract2_url: contract2Url,
                      status: 'uploaded',
                      created_at: orderFolder.created_at,
                      source: 'storage'
                    });
                  }
                }
              }
              
              if (storageContracts.length > 0) {
                finalContracts = storageContracts;
                console.log('Found contracts from storage:', storageContracts.length);
              }
            }
          }
        }
      } catch (storageError) {
        console.error('Error searching storage:', storageError);
      }
    }

    console.log('Returning contracts data:', {
      contractsCount: finalContracts?.length || 0,
      firstContract: finalContracts?.[0] ? {
        id: finalContracts[0].id?.substring(0, 8),
        contract1_filename: finalContracts[0].contract1_filename,
        contract2_filename: finalContracts[0].contract2_filename,
        source: finalContracts[0].source || 'database'
      } : null
    });

    return NextResponse.json({
      success: true,
      orderId: orderId,
      contracts: finalContracts || [],
      order: {
        id: order.id,
        status: order.status,
        assigned_delegate_id: order.assigned_delegate_id
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: 'فشل في جلب العقود',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}