/**
 * مكتبة تنظيف المدخلات للحماية من XSS و SQL Injection
 */

// تنظيف النص من HTML tags الخطيرة
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // إزالة script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // إزالة event handlers
    .replace(/\son\w+\s*=/gi, '')
    // تحويل الأقواس الزاوية
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // تحويل علامات الاقتباس
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // إزالة javascript: URLs
    .replace(/javascript:/gi, '')
    // إزالة data: URLs
    .replace(/data:/gi, '');
}

// تنظيف للعرض فقط (يسمح ببعض HTML الآمن)
export function sanitizeForDisplay(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // إزالة script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // إزالة event handlers
    .replace(/\son\w+\s*=/gi, '')
    // إزالة javascript: URLs
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '');
}

// تنظيف للحفظ في قاعدة البيانات
export function sanitizeForDatabase(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    // إزالة null bytes
    .replace(/\0/g, '')
    // تنظيف HTML
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '');
}

// التحقق من صحة البريد الإلكتروني
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// التحقق من صحة رقم الهاتف
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  // يقبل أرقام الهاتف المصرية والسعودية
  const phoneRegex = /^(\+?966|0)?5[0-9]{8}$|^(\+?20|0)?1[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// التحقق من صحة UUID
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// تنظيف اسم الملف
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') return 'file';
  
  return fileName
    // إزالة المسارات
    .replace(/^.*[\\\/]/, '')
    // إزالة الأحرف الخطيرة
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    // تقصير الاسم
    .substring(0, 255);
}

// تنظيف كائن كامل
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeForDatabase(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item: unknown) => 
          typeof item === 'string' ? sanitizeForDatabase(item) : 
          typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
        );
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized as T;
}

// التحقق من طول النص
export function validateLength(input: string, min: number, max: number): boolean {
  if (!input || typeof input !== 'string') return min === 0;
  return input.length >= min && input.length <= max;
}

// تنظيف رقم
export function sanitizeNumber(input: any, defaultValue: number = 0): number {
  const num = Number(input);
  return isNaN(num) ? defaultValue : num;
}

// تنظيف boolean
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    return input.toLowerCase() === 'true' || input === '1';
  }
  return Boolean(input);
}
