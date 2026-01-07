'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100" dir="rtl">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          حدث خطأ غير متوقع
        </h1>
        <p className="text-gray-600 mb-8">
          عذراً، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
        </p>
        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="block w-full px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
