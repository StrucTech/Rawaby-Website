/**
 * نظام Rate Limiting للحماية من هجمات DoS
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// تخزين مؤقت في الذاكرة (في Production يفضل استخدام Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// تنظيف الإدخالات المنتهية كل 5 دقائق
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number;      // نافذة الوقت بالمللي ثانية
  maxRequests: number;   // الحد الأقصى للطلبات في النافذة
  message?: string;      // رسالة الخطأ
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

// إعدادات افتراضية لمختلف أنواع الطلبات
export const rateLimitConfigs = {
  // API عام
  default: {
    windowMs: 60 * 1000,      // دقيقة واحدة
    maxRequests: 100,
    message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة بعد دقيقة.'
  },
  // تسجيل الدخول
  login: {
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    maxRequests: 5,
    message: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة.'
  },
  // التسجيل
  register: {
    windowMs: 60 * 60 * 1000, // ساعة واحدة
    maxRequests: 3,
    message: 'تم تجاوز الحد الأقصى لمحاولات التسجيل. يرجى المحاولة بعد ساعة.'
  },
  // إرسال البريد
  email: {
    windowMs: 60 * 1000,      // دقيقة واحدة
    maxRequests: 3,
    message: 'تم تجاوز الحد الأقصى لإرسال البريد الإلكتروني. يرجى المحاولة بعد دقيقة.'
  },
  // رفع الملفات
  upload: {
    windowMs: 60 * 1000,      // دقيقة واحدة
    maxRequests: 10,
    message: 'تم تجاوز الحد الأقصى لرفع الملفات. يرجى المحاولة بعد دقيقة.'
  },
  // إنشاء الطلبات
  orders: {
    windowMs: 60 * 1000,      // دقيقة واحدة
    maxRequests: 5,
    message: 'تم تجاوز الحد الأقصى لإنشاء الطلبات. يرجى المحاولة بعد دقيقة.'
  },
  // الدفع
  payment: {
    windowMs: 60 * 1000,      // دقيقة واحدة
    maxRequests: 3,
    message: 'تم تجاوز الحد الأقصى لمحاولات الدفع. يرجى المحاولة بعد دقيقة.'
  },
  // APIs حساسة
  sensitive: {
    windowMs: 60 * 1000,      // دقيقة واحدة
    maxRequests: 10,
    message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة بعد دقيقة.'
  }
};

/**
 * فحص Rate Limit لعنوان IP معين
 */
export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig = rateLimitConfigs.default
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // إذا لم يكن هناك إدخال أو انتهت النافذة
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime
    };
  }
  
  // زيادة العداد
  entry.count++;
  
  // التحقق من تجاوز الحد
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      message: config.message
    };
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * الحصول على عنوان IP من الطلب
 */
export function getClientIP(request: Request): string {
  // Vercel / Cloudflare headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Real IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Cloudflare specific
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }
  
  return 'unknown';
}

/**
 * إنشاء معرف فريد للـ rate limiting
 */
export function createRateLimitKey(
  ip: string, 
  endpoint: string, 
  userId?: string
): string {
  if (userId) {
    return `${endpoint}:user:${userId}`;
  }
  return `${endpoint}:ip:${ip}`;
}

/**
 * مسح rate limit لمستخدم معين (مثلاً بعد تسجيل الدخول الناجح)
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * الحصول على معلومات Rate Limit
 */
export function getRateLimitInfo(identifier: string): RateLimitEntry | null {
  return rateLimitStore.get(identifier) || null;
}
