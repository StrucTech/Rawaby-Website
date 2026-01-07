export default function Custom500() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100" dir="rtl">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
        <div className="text-8xl font-bold text-red-600 mb-4">500</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          خطأ في الخادم
        </h1>
        <p className="text-gray-600 mb-8">
          عذراً، حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.
        </p>
        <a
          href="/"
          className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
}
