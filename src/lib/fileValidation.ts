/**
 * مكتبة فحص والتحقق من الملفات المرفوعة
 */

// أنواع الملفات المسموح بها
export const ALLOWED_FILE_TYPES = {
  documents: {
    mimes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    magicBytes: {
      'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
      'application/msword': [0xD0, 0xCF, 0x11, 0xE0], // DOC
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04], // DOCX (ZIP)
      'application/vnd.ms-excel': [0xD0, 0xCF, 0x11, 0xE0], // XLS
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [0x50, 0x4B, 0x03, 0x04] // XLSX (ZIP)
    }
  },
  images: {
    mimes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    magicBytes: {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46] // RIFF
    }
  }
};

// حدود حجم الملفات
export const FILE_SIZE_LIMITS = {
  document: 10 * 1024 * 1024,    // 10 MB
  image: 5 * 1024 * 1024,        // 5 MB
  contract: 50 * 1024 * 1024,    // 50 MB
  default: 10 * 1024 * 1024      // 10 MB
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
  detectedType?: string;
}

/**
 * التحقق من Magic Bytes للملف
 */
export function checkMagicBytes(buffer: ArrayBuffer, expectedMime: string): boolean {
  const uint8Array = new Uint8Array(buffer);
  
  // البحث في جميع أنواع الملفات
  for (const category of Object.values(ALLOWED_FILE_TYPES)) {
    const magicBytesRecord = category.magicBytes as Record<string, number[]>;
    const magicBytes = magicBytesRecord[expectedMime];
    if (magicBytes && Array.isArray(magicBytes)) {
      const matches = magicBytes.every((byte: number, index: number) => uint8Array[index] === byte);
      if (matches) return true;
    }
  }
  
  return false;
}

/**
 * الحصول على امتداد الملف
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot).toLowerCase();
}

/**
 * تنظيف اسم الملف
 */
export function sanitizeFileName(fileName: string): string {
  // إزالة المسار
  let name = fileName.replace(/^.*[\\\/]/, '');
  
  // إزالة الأحرف الخطيرة
  name = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
  
  // استبدال المسافات
  name = name.replace(/\s+/g, '_');
  
  // تقصير الاسم
  if (name.length > 200) {
    const ext = getFileExtension(name);
    name = name.substring(0, 200 - ext.length) + ext;
  }
  
  return name || 'file';
}

/**
 * التحقق الشامل من الملف
 */
export async function validateFile(
  file: File | Blob,
  options: {
    allowedTypes?: 'documents' | 'images' | 'all';
    maxSize?: number;
    fileName?: string;
  } = {}
): Promise<FileValidationResult> {
  const {
    allowedTypes = 'all',
    maxSize = FILE_SIZE_LIMITS.default,
    fileName = (file as File).name || 'unknown'
  } = options;

  // 1. التحقق من الحجم
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `حجم الملف يتجاوز الحد المسموح (${Math.round(maxSize / 1024 / 1024)} MB)`
    };
  }

  // 2. التحقق من أن الملف ليس فارغاً
  if (file.size === 0) {
    return {
      valid: false,
      error: 'الملف فارغ'
    };
  }

  // 3. الحصول على الامتداد
  const extension = getFileExtension(fileName);
  
  // 4. تحديد أنواع الملفات المسموحة
  let allowedMimes: string[] = [];
  let allowedExtensions: string[] = [];
  
  if (allowedTypes === 'documents' || allowedTypes === 'all') {
    allowedMimes.push(...ALLOWED_FILE_TYPES.documents.mimes);
    allowedExtensions.push(...ALLOWED_FILE_TYPES.documents.extensions);
  }
  if (allowedTypes === 'images' || allowedTypes === 'all') {
    allowedMimes.push(...ALLOWED_FILE_TYPES.images.mimes);
    allowedExtensions.push(...ALLOWED_FILE_TYPES.images.extensions);
  }

  // 5. التحقق من الامتداد
  if (extension && !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `نوع الملف غير مسموح. الأنواع المسموحة: ${allowedExtensions.join(', ')}`
    };
  }

  // 6. التحقق من MIME type
  const declaredMime = file.type;
  if (declaredMime && !allowedMimes.includes(declaredMime)) {
    return {
      valid: false,
      error: 'نوع الملف غير مسموح'
    };
  }

  // 7. التحقق من Magic Bytes (محتوى الملف الفعلي)
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // التحقق من أنواع معروفة
    let detectedType: string | null = null;
    
    // PDF
    if (uint8Array[0] === 0x25 && uint8Array[1] === 0x50 && 
        uint8Array[2] === 0x44 && uint8Array[3] === 0x46) {
      detectedType = 'application/pdf';
    }
    // JPEG
    else if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
      detectedType = 'image/jpeg';
    }
    // PNG
    else if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && 
             uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
      detectedType = 'image/png';
    }
    // GIF
    else if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46) {
      detectedType = 'image/gif';
    }
    // ZIP-based (DOCX, XLSX, etc.)
    else if (uint8Array[0] === 0x50 && uint8Array[1] === 0x4B && 
             uint8Array[2] === 0x03 && uint8Array[3] === 0x04) {
      // يمكن أن يكون DOCX, XLSX, أو ZIP
      if (extension === '.docx') {
        detectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (extension === '.xlsx') {
        detectedType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
    }
    // DOC/XLS (OLE)
    else if (uint8Array[0] === 0xD0 && uint8Array[1] === 0xCF && 
             uint8Array[2] === 0x11 && uint8Array[3] === 0xE0) {
      if (extension === '.doc') {
        detectedType = 'application/msword';
      } else if (extension === '.xls') {
        detectedType = 'application/vnd.ms-excel';
      }
    }
    // WebP
    else if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && 
             uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
      detectedType = 'image/webp';
    }

    // التحقق من أن النوع المكتشف مسموح
    if (detectedType && !allowedMimes.includes(detectedType)) {
      return {
        valid: false,
        error: 'محتوى الملف لا يتطابق مع النوع المسموح'
      };
    }

    // التحقق من تطابق النوع المُعلن مع المكتشف
    if (declaredMime && detectedType && declaredMime !== detectedType) {
      // بعض الاستثناءات المقبولة
      const acceptable = 
        (declaredMime === 'application/octet-stream') || // نوع عام
        (declaredMime.includes('zip') && detectedType.includes('openxmlformats'));
      
      if (!acceptable) {
        console.warn(`MIME type mismatch: declared=${declaredMime}, detected=${detectedType}`);
      }
    }

    return {
      valid: true,
      sanitizedName: sanitizeFileName(fileName),
      detectedType: detectedType || declaredMime
    };
  } catch (error) {
    console.error('Error validating file:', error);
    return {
      valid: false,
      error: 'فشل في التحقق من الملف'
    };
  }
}

/**
 * التحقق من أن الملف ليس script ضار
 */
export async function checkForMaliciousContent(file: File | Blob): Promise<boolean> {
  try {
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 1024));
    
    // البحث عن محتوى ضار
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i,
      /__proto__/i,
      /constructor\s*\[/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(text)) {
        return false; // محتوى ضار
      }
    }

    return true; // آمن
  } catch {
    return true; // في حالة الخطأ، نفترض أنه آمن (ملف binary)
  }
}

/**
 * إنشاء اسم ملف آمن وفريد
 */
export function generateSafeFileName(originalName: string, prefix?: string): string {
  const sanitized = sanitizeFileName(originalName);
  const ext = getFileExtension(sanitized);
  const nameWithoutExt = sanitized.replace(ext, '');
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `${prefix ? prefix + '_' : ''}${nameWithoutExt}_${timestamp}_${random}${ext}`;
}
