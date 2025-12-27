'use client';
import React, { useRef, useState } from 'react';
import Cookies from 'js-cookie';

export default function ContractsAdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const contract1Ref = useRef<HTMLInputElement>(null);
  const contract2Ref = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const token = Cookies.get('token');
    if (!token) {
      setMessage('يجب تسجيل الدخول أولاً');
      setMessageType('error');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    if (contract1Ref.current?.files?.[0]) {
      formData.append("contract1", contract1Ref.current.files[0]);
    }
    if (contract2Ref.current?.files?.[0]) {
      formData.append("contract2", contract2Ref.current.files[0]);
    }

    try {
      const res = await fetch("/api/admin/contracts/upload", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ تم رفع قوالب العقود بنجاح");
        setMessageType('success');
        // مسح الملفات بعد الرفع الناجح
        if (contract1Ref.current) contract1Ref.current.value = '';
        if (contract2Ref.current) contract2Ref.current.value = '';
      } else {
        setMessage(data.error || "حدث خطأ أثناء الرفع");
        setMessageType('error');
      }
    } catch (err) {
      setMessage("حدث خطأ أثناء الاتصال بالسيرفر");
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const token = Cookies.get('token');
      // تحميل من contract-templates bucket
      window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/contract-templates/${fileName}`, "_blank");
    } catch (error) {
      console.error('Download error:', error);
      setMessage('فشل في تحميل الملف');
      setMessageType('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-purple-900">إدارة قوالب العقود</h1>
        
        {/* معلومات النظام */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 معلومات هامة:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• قوالب العقود الفارغة تُرسل للعملاء عند طلب الخدمة</li>
            <li>• يقوم العميل بطباعتها وملئها وتوقيعها ثم رفعها</li>
            <li>• يتم تخزين القوالب في: <code className="bg-blue-100 px-1 rounded">contract-templates</code></li>
            <li>• الصيغ المدعومة: Word (.doc, .docx) أو PDF</li>
          </ul>
        </div>

        {/* نموذج رفع القوالب */}
        <form onSubmit={handleUpload} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">رفع قوالب العقود الفارغة</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                قالب العقد الأول (Word أو PDF)
              </label>
              <input 
                type="file" 
                accept=".doc,.docx,.pdf" 
                ref={contract1Ref} 
                required 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                قالب العقد الثاني (Word أو PDF)
              </label>
              <input 
                type="file" 
                accept=".doc,.docx,.pdf" 
                ref={contract2Ref} 
                required 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  جاري الرفع...
                </span>
              ) : (
                '📤 رفع قوالب العقود'
              )}
            </button>
          </div>

          {/* رسالة النتيجة */}
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-center ${
              messageType === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </form>

        {/* أزرار تحميل القوالب الحالية */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">تحميل القوالب الحالية</h2>
          <div className="flex gap-4">
            <button
              onClick={() => handleDownload("contract1.docx")}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              تحميل قالب العقد 1
            </button>
            <button
              onClick={() => handleDownload("contract2.docx")}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              تحميل قالب العقد 2
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            * إذا لم يتم رفع قوالب بعد، لن تعمل أزرار التحميل
          </p>
        </div>

        {/* رابط العودة */}
        <div className="mt-6 text-center">
          <a href="/admin" className="text-purple-600 hover:text-purple-800 underline">
            ← العودة للوحة التحكم
          </a>
        </div>
      </div>
    </div>
  );
} 