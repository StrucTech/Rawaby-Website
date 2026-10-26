/**
 * حد لمحاولات تسجيل الدخول واستعادة كلمة المرور محفوظ في قاعدة البيانات
 * (الـ rate limit في الذاكرة لا يكفي على Vercel لأن كل نسخة سيرفر لها ذاكرتها)
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, RateLimitConfig } from '@/lib/rateLimit';

const TABLE = 'auth_attempts';

export interface ThrottleRule {
  key: string;
  max: number;
  windowMs: number;
}

async function countSince(key: string, windowMs: number): Promise<number> {
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await getSupabaseAdmin()
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', since);

  if (error) throw error;
  return count || 0;
}

/**
 * هل تم تجاوز أي من الحدود؟
 * لو الجدول غير موجود نرجع للـ rate limit في الذاكرة حتى لا يتعطل تسجيل الدخول
 */
export async function isThrottled(rules: ThrottleRule[]): Promise<boolean> {
  try {
    for (const rule of rules) {
      if ((await countSince(rule.key, rule.windowMs)) >= rule.max) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('authThrottle: database check failed, using in-memory fallback:', error);
    return rules.some(rule => {
      const config: RateLimitConfig = { windowMs: rule.windowMs, maxRequests: rule.max };
      return !checkRateLimit(`throttle-fallback:${rule.key}`, config).allowed;
    });
  }
}

/**
 * تسجيل محاولة (فاشلة) لكل المفاتيح
 */
export async function recordAttempt(keys: string[]): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from(TABLE).insert(keys.map(key => ({ key })));

    // تنظيف السجلات القديمة (أكثر من يوم)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from(TABLE).delete().lt('created_at', dayAgo);
  } catch (error) {
    console.error('authThrottle: failed to record attempt:', error);
  }
}

/**
 * مسح محاولات مفتاح معين (مثلاً بعد تسجيل دخول ناجح)
 */
export async function clearAttempts(key: string): Promise<void> {
  try {
    await getSupabaseAdmin().from(TABLE).delete().eq('key', key);
  } catch (error) {
    console.error('authThrottle: failed to clear attempts:', error);
  }
}
