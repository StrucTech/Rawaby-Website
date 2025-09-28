import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for server-side operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
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
        };
        Insert: {
          id?: string;
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
          user_id?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          country?: string;
          phone?: string;
          national_id?: string;
          email?: string;
          password?: string;
          role?: 'user' | 'admin' | 'supervisor' | 'delegate';
          active?: boolean;
          email_verification_token?: string | null;
          email_verified?: boolean;
          user_id?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          title: string;
          description: string;
          duration_days: number;
          price: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          duration_days: number;
          price: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          duration_days?: number;
          price?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
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
        };
        Insert: {
          id?: string;
          client_id: string;
          supervisor_id?: string | null;
          delegate_id?: string | null;
          staff_id?: string | null;
          services: string[];
          status?: 'new' | 'in_progress' | 'done' | 'pending' | 'paid';
          note?: string | null;
          total_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          supervisor_id?: string | null;
          delegate_id?: string | null;
          staff_id?: string | null;
          services?: string[];
          status?: 'new' | 'in_progress' | 'done' | 'pending' | 'paid';
          note?: string | null;
          total_price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      supervisor_delegates: {
        Row: {
          id: string;
          supervisor_id: string;
          delegate_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supervisor_id: string;
          delegate_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supervisor_id?: string;
          delegate_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}