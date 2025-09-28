import { supabase, supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcrypt';

export interface User {
  id: string;
  name: string;
  country: string;
  phone: string;
  national_id: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'supervisor' | 'delegate';
  active: boolean;
  email_verification_token: string | null;
  email_verified: boolean;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  name: string;
  country?: string;
  phone: string;
  national_id: string;
  email: string;
  password: string;
  role?: 'user' | 'admin' | 'supervisor' | 'delegate';
  active?: boolean;
  email_verification_token?: string | null;
  email_verified?: boolean;
}

export class UserModel {
  // إنشاء مستخدم جديد
  static async create(userData: CreateUserData): Promise<User> {
    // تشفير كلمة المرور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // إنتاج user_id فريد
    let userId = await this.generateUserId(userData.role || 'user');

    const newUser = {
      ...userData,
      password: hashedPassword,
      country: userData.country || 'السعودية',
      role: userData.role || 'user',
      active: userData.active || false,
      email_verified: userData.email_verified || false,
      user_id: userId,
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }

    return data;
  }

  // البحث عن مستخدم بالبريد الإلكتروني
  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // لم يتم العثور على المستخدم
      }
      throw new Error(`Error finding user: ${error.message}`);
    }

    return data;
  }

  // البحث عن مستخدم بالـ ID
  static async findById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding user: ${error.message}`);
    }

    return data;
  }

  // البحث عن مستخدم بـ user_id
  static async findByUserId(userId: number): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding user: ${error.message}`);
    }

    return data;
  }

  // تحديث مستخدم
  static async update(id: string, updateData: Partial<User>): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }

    return data;
  }

  // حذف مستخدم
  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // مقارنة كلمة المرور
  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // الحصول على جميع المستخدمين حسب الدور
  static async findByRole(role: string): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', role);

    if (error) {
      throw new Error(`Error finding users by role: ${error.message}`);
    }

    return data || [];
  }

  // إنتاج user_id فريد
  private static async generateUserId(role: string): Promise<number> {
    let start = 1;
    let roleFilter: any = {};

    if (role === 'supervisor') {
      start = 1000;
      roleFilter = { role: 'supervisor' };
    } else if (role === 'delegate') {
      start = 2000;
      roleFilter = { role: 'delegate' };
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .match(roleFilter)
      .order('user_id', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Error generating user ID: ${error.message}`);
    }

    if (data && data.length > 0) {
      return data[0].user_id + 1;
    }

    return start;
  }

  // الحصول على جميع المستخدمين
  static async findAll(): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }

    return data || [];
  }
}