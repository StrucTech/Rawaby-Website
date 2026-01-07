import { supabase, supabaseAdmin } from '@/lib/supabase';

export interface Student {
  id: string;
  user_id: string;
  guardian_id: string;
  full_name: string;
  grade: string;
  total_score: string;
  certificate_type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentData {
  user_id: string;
  guardian_id: string;
  full_name: string;
  grade: string;
  total_score: string;
  certificate_type: string;
}

export class StudentModel {
  // إنشاء طالب جديد
  static async create(studentData: CreateStudentData): Promise<Student> {
    const { data, error } = await supabaseAdmin
      .from('students')
      .insert([studentData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating student: ${error.message}`);
    }

    return data;
  }

  // البحث عن طالب بالـ ID
  static async findById(id: string): Promise<Student | null> {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding student: ${error.message}`);
    }

    return data;
  }

  // البحث عن طالب بـ user_id
  static async findByUserId(userId: string): Promise<Student[]> {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding students by user ID: ${error.message}`);
    }

    return data || [];
  }

  // البحث عن طلاب ولي أمر معين
  static async findByGuardianId(guardianId: string): Promise<Student[]> {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('guardian_id', guardianId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding students by guardian ID: ${error.message}`);
    }

    return data || [];
  }

  // الحصول على جميع الطلاب
  static async findAll(): Promise<Student[]> {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching students: ${error.message}`);
    }

    return data || [];
  }

  // تحديث طالب
  static async update(id: string, updateData: Partial<Student>): Promise<Student> {
    const { data, error } = await supabaseAdmin
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating student: ${error.message}`);
    }

    return data;
  }

  // حذف طالب
  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting student: ${error.message}`);
    }
  }

  // البحث عن طلاب بنوع شهادة معين
  static async findByCertificateType(certificateType: string): Promise<Student[]> {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('certificate_type', certificateType)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding students by certificate type: ${error.message}`);
    }

    return data || [];
  }

  // الحصول على بيانات الطالب مع بيانات ولي الأمر والمستخدم
  static async findWithGuardianAndUser(studentId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        guardian:guardians(
          id,
          full_name,
          mobile_number,
          national_id,
          user:users(id, name, email, phone)
        )
      `)
      .eq('id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error finding student with guardian and user data: ${error.message}`);
    }

    return data;
  }

  // الحصول على جميع طلاب مستخدم معين مع بيانات ولي الأمر
  static async findUserStudentsWithGuardian(userId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select(`
        *,
        guardian:guardians(
          id,
          full_name,
          mobile_number,
          national_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error finding user students with guardian data: ${error.message}`);
    }

    return data || [];
  }

  // إحصائيات الطلاب حسب نوع الشهادة
  static async getCertificateTypeStats(): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('certificate_type');

    if (error) {
      throw new Error(`Error getting certificate type statistics: ${error.message}`);
    }

    // تجميع النتائج
    const stats: { [key: string]: number } = {};
    data?.forEach((student: any) => {
      stats[student.certificate_type] = (stats[student.certificate_type] || 0) + 1;
    });

    return stats;
  }
}