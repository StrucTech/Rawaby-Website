import { supabase, supabaseAdmin } from '@/lib/supabase';

export interface Order {
  id: string;
  client_id: string;
  supervisor_id: string | null;
  delegate_id: string | null;
  staff_id: string | null;
  services: string[];
  status: 'new' | 'in_progress' | 'done' | 'pending' | 'paid';
  note: string | null;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  client_id: string;
  supervisor_id?: string | null;
  delegate_id?: string | null;
  staff_id?: string | null;
  services: string[];
  status?: 'new' | 'in_progress' | 'done' | 'pending' | 'paid';
  note?: string | null;
  total_price: number;
}

export class OrderModel {
  // إنشاء طلب جديد
  static async create(orderData: CreateOrderData): Promise<Order> {
    const newOrder = {
      ...orderData,
      status: orderData.status || 'new',
    };

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([newOrder])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating order: ${error.message}`);
    }

    return data;
  }

  // البحث عن طلب بالـ ID
  static async findById(id: string): Promise<Order | null> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding order: ${error.message}`);
    }

    return data;
  }

  // الحصول على جميع الطلبات
  static async findAll(): Promise<Order[]> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching orders: ${error.message}`);
    }

    return data || [];
  }

  // تحديث طلب
  static async update(id: string, updateData: Partial<Order>): Promise<Order> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating order: ${error.message}`);
    }

    return data;
  }

  // حذف طلب
  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting order: ${error.message}`);
    }
  }

  // الحصول على طلبات العميل
  static async findByClientId(clientId: string): Promise<Order[]> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding orders by client: ${error.message}`);
    }

    return data || [];
  }

  // الحصول على طلبات المشرف
  static async findBySupervisorId(supervisorId: string): Promise<Order[]> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding orders by supervisor: ${error.message}`);
    }

    return data || [];
  }

  // الحصول على طلبات المندوب
  static async findByDelegateId(delegateId: string): Promise<Order[]> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('delegate_id', delegateId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding orders by delegate: ${error.message}`);
    }

    return data || [];
  }

  // الحصول على طلبات بحالة معينة
  static async findByStatus(status: string): Promise<Order[]> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding orders by status: ${error.message}`);
    }

    return data || [];
  }

  // الحصول على الطلبات مع تفاصيل المستخدمين والخدمات
  static async findWithDetails(id?: string): Promise<any[]> {
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        client:users!client_id(id, name, email, phone),
        supervisor:users!supervisor_id(id, name, email),
        delegate:users!delegate_id(id, name, email)
      `);

    if (id) {
      query = query.eq('id', id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding orders with details: ${error.message}`);
    }

    return data || [];
  }

  // إحصائيات الطلبات
  static async getStats(): Promise<any> {
    const { data: totalData, error: totalError } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true });

    const { data: newData, error: newError } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new');

    const { data: progressData, error: progressError } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    const { data: doneData, error: doneError } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'done');

    if (totalError || newError || progressError || doneError) {
      throw new Error('Error getting order statistics');
    }

    return {
      total: totalData?.length || 0,
      new: newData?.length || 0,
      in_progress: progressData?.length || 0,
      done: doneData?.length || 0,
    };
  }
}