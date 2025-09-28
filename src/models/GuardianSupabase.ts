import { supabase, supabaseAdmin } from '@/lib/supabase';

export interface Guardian {
  id: string;
  user_id: string;
  full_name: string;
  mobile_number: string;
  national_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGuardianData {
  user_id: string;
  full_name: string;
  mobile_number: string;
  national_id: string;
}

export class GuardianModel {
  // إنشاء ولي أمر جديد
  static async create(guardianData: CreateGuardianData): Promise<Guardian> {
    const { data, error } = await supabaseAdmin
      .from('guardians')
      .insert([guardianData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating guardian: ${error.message}`);
    }

    return data;
  }

  // البحث عن ولي أمر بالـ ID
  static async findById(id: string): Promise<Guardian | null> {
    const { data, error } = await supabaseAdmin
      .from('guardians')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding guardian: ${error.message}`);
    }

    return data;
  }

  // البحث عن ولي أمر بـ user_id
  static async findByUserId(userId: string): Promise<Guardian | null> {
    const { data, error } = await supabaseAdmin
      .from('guardians')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding guardian by user ID: ${error.message}`);
    }

    return data;
  }

  // الحصول على جميع أولياء الأمور
  static async findAll(): Promise<Guardian[]> {
    const { data, error } = await supabaseAdmin
      .from('guardians')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching guardians: ${error.message}`);
    }

    return data || [];
  }

  // تحديث ولي أمر
  static async update(id: string, updateData: Partial<Guardian>): Promise<Guardian> {
    const { data, error } = await supabaseAdmin
      .from('guardians')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating guardian: ${error.message}`);
    }

    return data;
  }

  // حذف ولي أمر
  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('guardians')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting guardian: ${error.message}`);
    }
  }

  // البحث عن ولي أمر بالرقم القومي
  static async findByNationalId(nationalId: string): Promise<Guardian | null> {
    const { data, error } = await supabaseAdmin
      .from('guardians')
      .select('*')
      .eq('national_id', nationalId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding guardian by national ID: ${error.message}`);
    }

    return data;
  }

  // البحث عن ولي أمر برقم الجوال
  static async findByMobileNumber(mobileNumber: string): Promise<Guardian | null> {
    const { data, error } = await supabaseAdmin
      .from('guardians')
      .select('*')
      .eq('mobile_number', mobileNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding guardian by mobile number: ${error.message}`);
    }

    return data;
  }

  // الحصول على بيانات ولي الأمر مع بيانات المستخدم
  static async findWithUserData(userId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('guardians')
      .select(`
        *,
        user:users(id, name, email, phone)
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding guardian with user data: ${error.message}`);
    }

    return data;
  }
}
