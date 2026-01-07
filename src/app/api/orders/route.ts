import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const delegateId = searchParams.get('delegateId');
    const supervisorId = searchParams.get('supervisorId');
    const role = searchParams.get('role'); // معامل جديد لتحديد نوع العرض
    const detailed = searchParams.get('detailed'); // استخدام الـ view المفصل

    let query = supabaseAdmin.from('orders').select(`
      *,
      assigned_supervisor:users!orders_assigned_supervisor_id_fkey(id, name, email),
      assigned_delegate:users!orders_assigned_delegate_id_fkey(id, name, email),
      client:users!orders_client_id_fkey(id, name, email, phone)
    `);

    // فلترة الطلبات بناء على المعاملات والصلاحيات
    if (payload.role === 'admin') {
      // الأدمن يرى جميع الطلبات
      // لا نطبق فلتر
    } else if (payload.role === 'supervisor') {
      if (role === 'supervisor') {
        // المشرف يرى الطلبات غير المعينة + طلباته المعينة
        // سنقوم بالفلترة بعد الاستعلام
      } else if (supervisorId === 'all') {
        // المشرف يطلب جميع الطلبات - لا نطبق فلتر
      } else if (supervisorId) {
        query = query.eq('assigned_supervisor_id', supervisorId);
      } else {
        // بدون معاملات، اعرض الطلبات التي يشرف عليها
        query = query.eq('assigned_supervisor_id', payload.userId);
      }
    } else if (payload.role === 'delegate') {
      // المندوب يرى الطلبات المُعيّنة له فقط (سنقوم بالفلترة بعد الاستعلام)
      console.log('Delegate filtering for userId:', payload.userId);
      // لا نطبق فلتر هنا، سنفلتر بعد جلب البيانات
    } else if (delegateId) {
      // فلترة المندوب مباشرة بالاستعلام الجديد
      console.log('Will filter by delegateId:', delegateId);
      query = query.eq('assigned_delegate_id', delegateId);
      
      // أضافة فلتر بديل لدعم العمود القديم إذا كان موجود
      // كما أضيف فلتر للـ delegate_id
      // query = query.or(`assigned_delegate_id.eq.${delegateId},delegate_id.eq.${delegateId}`);
    } else {
      // مستخدم عادي يرى طلباته فقط
      query = query.eq('client_id', payload.userId);
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    console.log('Query result - orders found:', orders?.length || 0);
    if (error) {
      console.log('Query error:', error);
    }

    console.log('Database query result - orders found:', orders?.length || 0);
    
    if (error) {
      console.error('Database error details:', error);
      return NextResponse.json({ 
        error: 'Database error fetching orders',
        details: error.message
      }, { status: 500 });
    }

    if (delegateId && orders) {
      console.log('Orders for delegate analysis:', orders.map((o: any) => ({
        id: o.id.substring(0, 8),
        assigned_delegate_id: o.assigned_delegate_id,
        delegate_id: o.delegate_id,
        status: o.status
      })));
    }
    
    let finalOrders = orders || [];
    console.log('Final orders count:', finalOrders.length);

    // معالجة البيانات للعمل مع الهيكل الجديد
    const processedOrders = finalOrders?.map((order: any) => {
      // استخدام الـ metadata بدلاً من note للتفاصيل
      const metadata = order.metadata || {};

      return {
        ...order,
        // تفاصيل سهلة القراءة 
        clientInfo: order.client || order.assigned_supervisor || null,
        supervisorInfo: order.assigned_supervisor || null,
        delegateInfo: order.assigned_delegate || null,
        // تفاصيل من الـ metadata
        guardianName: metadata.guardianName || null,
        serviceName: metadata.serviceName || null,
        studentInfo: metadata.studentInfo || null,
        // حالة طلب الإلغاء
        cancellation_requested: metadata.cancellation_requested || false,
        cancellation_requested_at: metadata.cancellation_requested_at || null,
        // الحقول المحدثة
        assignedSupervisorId: order.assigned_supervisor_id,
        assignedDelegateId: order.assigned_delegate_id,
        assignedDelegate: order.assigned_delegate_id,
        assignedAt: order.assigned_at || null,
        paymentInfo: {
          method: metadata.paymentMethod || order.payment_method || 'Unknown',
          timestamp: metadata.paymentTimestamp || order.created_at,
          amount: order.total_price
        }
      };
    }) || [];

    // فلترة بناء على الدور
    let filteredOrders = processedOrders;
    
    if (payload.role === 'delegate') {
      // المندوب يرى الطلبات المعينة له فقط
      filteredOrders = processedOrders.filter((order: any) => 
        order.assignedDelegate === payload.userId
      );
      console.log(`Filtered ${processedOrders.length} orders to ${filteredOrders.length} for delegate ${payload.userId}`);
    } else if (payload.role === 'supervisor' && role === 'supervisor') {
      // المشرف يرى: الطلبات غير المعينة لأي مشرف + طلباته المعينة
      filteredOrders = processedOrders.filter((order: any) => 
        !order.assignedSupervisorId || // طلبات غير معينة لأي مشرف
        order.assignedSupervisorId === payload.userId // أو طلباته المعينة
      );
      console.log(`Supervisor ${payload.userId} sees ${filteredOrders.length} orders out of ${processedOrders.length}`);
    } else if (delegateId) {
      // لا نحتاج للفلترة هنا لأن الاستعلام فلتر بالفعل
      filteredOrders = processedOrders;
    }

    return NextResponse.json({ 
      orders: filteredOrders,
      totalCount: filteredOrders.length 
    }, { status: 200 });

  } catch (error: any) {
    console.error('GET orders error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/orders - Starting ===');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      console.log('Token verified for user:', payload.userId);
    } catch (error) {
      console.log('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { serviceIds, paymentMethod, totalAmount, guardianData, studentData } = body;
    
    console.log('Request body:', { serviceIds, paymentMethod, totalAmount, guardianData, studentData });

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      console.log('Invalid serviceIds');
      return NextResponse.json({ error: 'At least one service must be selected' }, { status: 400 });
    }

    // محاولة جلب الخدمات من قاعدة البيانات أولاً، وإلا استخدام البيانات الوهمية
    let services;
    try {
      console.log('Attempting to fetch services from database...');
      const { data: dbServices, error: servicesError } = await supabaseAdmin
        .from('services')
        .select('*')
        .in('id', serviceIds);

      if (servicesError) {
        console.log('Database services fetch failed, using mock data:', servicesError);
        services = serviceIds.map((id: any) => ({
          id: id,
          title: `Service ${id}`,
          price: totalAmount / serviceIds.length,
          description: `Description for service ${id}`
        }));
      } else {
        console.log('Services fetched from database:', dbServices);
        services = dbServices || [];
      }
    } catch (error) {
      console.log('Error fetching services, using mock data:', error);
      services = serviceIds.map((id: any) => ({
        id: id,
        title: `Service ${id}`,
        price: totalAmount / serviceIds.length,
        description: `Description for service ${id}`
      }));
    }

    // إعداد البيانات للهيكل الجديد
    console.log('Preparing order data for new schema...');
    
    const orderData = {
      client_id: payload.userId, // UUID مباشرة
      service_ids: serviceIds, // مصفوفة UUID
      status: 'new',
      total_price: parseFloat(totalAmount),
      payment_method: paymentMethod,
      metadata: {
        // بيانات الدفع
        paymentMethod: paymentMethod,
        paymentTimestamp: new Date().toISOString(),
        
        // تفاصيل الخدمات المختارة
        selectedServices: services.map((service: any) => ({
          id: service.id,
          title: service.title,
          price: service.price,
          description: service.description || ''
        })),
        
        // بيانات ولي الأمر (إذا وجدت)
        guardianName: guardianData?.fullName || null,
        guardianPhone: guardianData?.mobileNumber || null,
        guardianNationalId: guardianData?.nationalId || null,
        
        // بيانات الطالب (إذا وجدت)  
        studentInfo: studentData ? {
          name: studentData.fullName || '',
          grade: studentData.grade || '',
          totalScore: studentData.totalScore || '',
          certificateType: studentData.certificateType || ''
        } : null,
        
        // ملخص الطلب
        serviceName: services.map((s: any) => s.title).join(' + ')
      }
    };

    // حفظ الطلب في قاعدة البيانات
    let finalOrder;
    try {
      console.log('Saving order to database with new schema...');
      console.log('Order data:', orderData);
      
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert(orderData)
        .select('*')
        .single();

      if (orderError) {
        console.error('Database save failed:', orderError);
        console.error('Error details:', orderError.message, orderError.code);
        throw new Error(`Failed to save order: ${orderError.message}`);
      }

      console.log('Order saved to database successfully:', order.id);
      finalOrder = order;
      
      // ربط العقود المرفوعة مسبقاً بهذا الطلب
      try {
        console.log('Linking existing contracts to order...');
        const { data: updatedContracts, error: contractsError } = await supabaseAdmin
          .from('contracts')
          .update({ order_id: order.id })
          .eq('user_id', payload.userId)
          .is('order_id', null) // فقط العقود التي لم تُربط بطلب بعد
          .select();

        if (contractsError) {
          console.error('Error linking contracts to order:', contractsError);
        } else if (updatedContracts && updatedContracts.length > 0) {
          console.log(`Successfully linked ${updatedContracts.length} contracts to order ${order.id}`);
        } else {
          console.log('No contracts found to link to this order');
        }
      } catch (contractLinkError) {
        console.error('Error in contract linking process:', contractLinkError);
      }
      
    } catch (error: any) {
      console.error('Error saving order to database:', error);
      return NextResponse.json({
        error: 'Failed to create order',
        details: error.message,
        received_data: {
          serviceIds,
          paymentMethod,
          totalAmount,
          hasGuardianData: !!guardianData,
          hasStudentData: !!studentData
        }
      }, { status: 500 });
    }

    console.log('Final order data:', finalOrder);

    // إشعار المشرفين بالطلب الجديد
    try {
      console.log('Notifying supervisors...');
      await notifySupervisors(finalOrder, services);
    } catch (notifyError) {
      console.error('Error notifying supervisors:', notifyError);
    }

    console.log(`Order ${finalOrder.id} processed successfully with full details`);

    return NextResponse.json({
      message: 'Order created successfully with full details',
      order: {
        id: finalOrder.id,
        status: finalOrder.status,
        total_price: finalOrder.total_price,
        created_at: finalOrder.created_at,
        services: services,
        guardianData: guardianData,
        studentData: studentData,
        paymentMethod: paymentMethod,
        detailsIncluded: true
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST orders error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { orderId, assigned_supervisor_id, assigned_delegate_id, status, note } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    
    // السماح بتحديث المشرف حتى لو كان null أو undefined
    if (assigned_supervisor_id !== undefined) {
      updateData.assigned_supervisor_id = assigned_supervisor_id;
      updateData.assigned_at = new Date().toISOString();
    }
    // السماح بتحديث المندوب حتى لو كان null أو undefined
    if (assigned_delegate_id !== undefined) {
      updateData.assigned_delegate_id = assigned_delegate_id;
      if (!updateData.assigned_at) updateData.assigned_at = new Date().toISOString();
    }
    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = assigned_delegate_id || payload.userId;
      }
    }
    if (note) updateData.note = note;
    
    updateData.updated_at = new Date().toISOString();

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Order updated successfully',
      order
    }, { status: 200 });

  } catch (error: any) {
    console.error('PUT orders error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

async function notifySupervisors(order: any, services: any[]) {
  try {
    const { data: supervisors, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('role', 'supervisor')
      .eq('active', true);

    if (error || !supervisors || supervisors.length === 0) {
      console.log('No active supervisors found');
      return;
    }

    console.log(`New order ${order.id} - notifying ${supervisors.length} supervisors`);
    
    for (const supervisor of supervisors) {
      console.log(`Notify supervisor ${supervisor.name} (${supervisor.email}) about order ${order.id}`);
    }

  } catch (error) {
    console.error('Error in notifySupervisors:', error);
    throw error;
  }
}
