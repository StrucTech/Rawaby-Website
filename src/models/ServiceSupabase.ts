import { supabase, supabaseAdmin } from '@/lib/supabase';

export interface Service {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceData {
  title: string;
  description: string;
  duration_days: number;
  price: number;
  notes?: string | null;
}

export class ServiceModel {
  // إنشاء خدمة جديدة
  static async create(serviceData: CreateServiceData): Promise<Service> {
    const { data, error } = await supabaseAdmin
      .from('services')
      .insert([serviceData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating service: ${error.message}`);
    }

    return data;
  }

  // البحث عن خدمة بالـ ID
  static async findById(id: string): Promise<Service | null> {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding service: ${error.message}`);
    }

    return data;
  }

  // الحصول على جميع الخدمات
  static async findAll(): Promise<Service[]> {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching services: ${error.message}`);
    }

    return data || [];
  }

  // تحديث خدمة
  static async update(id: string, updateData: Partial<Service>): Promise<Service> {
    const { data, error } = await supabaseAdmin
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating service: ${error.message}`);
    }

    return data;
  }

  // حذف خدمة
  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting service: ${error.message}`);
    }
  }

  // البحث عن خدمات بأسعار في نطاق معين
  static async findByPriceRange(minPrice: number, maxPrice: number): Promise<Service[]> {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .gte('price', minPrice)
      .lte('price', maxPrice)
      .order('price', { ascending: true });

    if (error) {
      throw new Error(`Error finding services by price range: ${error.message}`);
    }

    return data || [];
  }

  // البحث عن خدمات بمدة معينة
  static async findByDuration(durationDays: number): Promise<Service[]> {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('duration_days', durationDays)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding services by duration: ${error.message}`);
    }

    return data || [];
  }

  // البحث في النص
  static async search(searchTerm: string): Promise<Service[]> {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error searching services: ${error.message}`);
    }

    return data || [];
  }
}