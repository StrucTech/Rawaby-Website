import { supabase, supabaseAdmin } from '@/lib/supabase';

export interface SupervisorDelegate {
  id: string;
  supervisor_id: string;
  delegate_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSupervisorDelegateData {
  supervisor_id: string;
  delegate_id: string;
}

export class SupervisorDelegateModel {
  // إنشاء علاقة مشرف-مندوب جديدة
  static async create(data: CreateSupervisorDelegateData): Promise<SupervisorDelegate> {
    const { data: result, error } = await supabaseAdmin
      .from('supervisor_delegates')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating supervisor-delegate relationship: ${error.message}`);
    }

    return result;
  }

  // البحث عن علاقة بالـ ID
  static async findById(id: string): Promise<SupervisorDelegate | null> {
    const { data, error } = await supabaseAdmin
      .from('supervisor_delegates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding supervisor-delegate relationship: ${error.message}`);
    }

    return data;
  }

  // الحصول على جميع العلاقات
  static async findAll(): Promise<SupervisorDelegate[]> {
    const { data, error } = await supabaseAdmin
      .from('supervisor_delegates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching supervisor-delegate relationships: ${error.message}`);
    }

    return data || [];
  }

  // الحصول على المندوبين المرتبطين بمشرف معين
  static async findDelegatesBySupervisor(supervisorId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('supervisor_delegates')
      .select(`
        *,
        delegate:users!delegate_id(id, name, email, phone, user_id)
      `)
      .eq('supervisor_id', supervisorId);

    if (error) {
      throw new Error(`Error finding delegates by supervisor: ${error.message}`);
    }

    return data || [];
  }

  // الحصول على المشرفين المرتبطين بمندوب معين
  static async findSupervisorsByDelegate(delegateId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('supervisor_delegates')
      .select(`
        *,
        supervisor:users!supervisor_id(id, name, email, phone, user_id)
      `)
      .eq('delegate_id', delegateId);

    if (error) {
      throw new Error(`Error finding supervisors by delegate: ${error.message}`);
    }

    return data || [];
  }

  // حذف علاقة مشرف-مندوب
  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('supervisor_delegates')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting supervisor-delegate relationship: ${error.message}`);
    }
  }

  // حذف علاقة بناءً على المشرف والمندوب
  static async deleteByIds(supervisorId: string, delegateId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('supervisor_delegates')
      .delete()
      .eq('supervisor_id', supervisorId)
      .eq('delegate_id', delegateId);

    if (error) {
      throw new Error(`Error deleting supervisor-delegate relationship: ${error.message}`);
    }
  }

  // التحقق من وجود علاقة
  static async exists(supervisorId: string, delegateId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('supervisor_delegates')
      .select('id')
      .eq('supervisor_id', supervisorId)
      .eq('delegate_id', delegateId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error checking supervisor-delegate relationship: ${error.message}`);
    }

    return data !== null;
  }

  // الحصول على جميع العلاقات مع تفاصيل المستخدمين
  static async findAllWithDetails(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('supervisor_delegates')
      .select(`
        *,
        supervisor:users!supervisor_id(id, name, email, phone, user_id),
        delegate:users!delegate_id(id, name, email, phone, user_id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding supervisor-delegate relationships with details: ${error.message}`);
    }

    return data || [];
  }
}