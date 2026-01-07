import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase admin client (only call inside functions, not at module level)
 * This ensures environment variables are available at request time, not build time
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}
