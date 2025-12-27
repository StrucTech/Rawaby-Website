'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface UseActiveStatusCheckOptions {
  checkInterval?: number; // بالمللي ثانية - افتراضياً كل 30 ثانية
  onInactive?: (message: string) => void;
}

export function useActiveStatusCheck(options: UseActiveStatusCheckOptions = {}) {
  const { checkInterval = 30000, onInactive } = options;
  const router = useRouter();

  const checkStatus = useCallback(async () => {
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const res = await fetch('/api/auth/check-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!data.active) {
        // حذف التوكن وتسجيل الخروج
        Cookies.remove('token');
        
        // استدعاء callback إن وجد
        if (onInactive) {
          onInactive(data.message || 'حسابك غير نشط');
        }

        // إعادة التوجيه لصفحة تسجيل الدخول مع رسالة
        const loginUrl = new URL('/login', window.location.origin);
        loginUrl.searchParams.set('error', data.message || 'حسابك غير نشط');
        router.push(loginUrl.toString());
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  }, [router, onInactive]);

  useEffect(() => {
    // التحقق عند التحميل الأول
    checkStatus();

    // التحقق بشكل دوري
    const interval = setInterval(checkStatus, checkInterval);

    return () => clearInterval(interval);
  }, [checkStatus, checkInterval]);

  return { checkStatus };
}

// Component wrapper للاستخدام في الصفحات
export default function ActiveStatusChecker({ children }: { children: React.ReactNode }) {
  useActiveStatusCheck({
    checkInterval: 30000, // كل 30 ثانية
    onInactive: (message) => {
      alert(message);
    }
  });

  return <>{children}</>;
}
