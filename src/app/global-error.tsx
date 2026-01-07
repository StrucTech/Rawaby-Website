'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
          <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
            <div className="text-6xl mb-4">🔴</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              خطأ حرج في التطبيق
            </h1>
            <p className="text-gray-600 mb-8">
              حدث خطأ حرج في التطبيق. يرجى تحديث الصفحة أو العودة لاحقاً.
            </p>
            <button
              onClick={reset}
              className="w-full px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
