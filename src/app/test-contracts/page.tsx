'use client';

import { useState } from 'react';
import Cookies from 'js-cookie';

export default function TestContractsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testSendContract = async () => {
    setLoading(true);
    setResult(null);

    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/send-contract-simple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setResult({ type: 'send', success: response.ok, data });
    } catch (error: any) {
      setResult({ type: 'send', success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testUploadContract = async () => {
    setLoading(true);
    setResult(null);

    try {
      const token = Cookies.get('token');
      
      // إنشاء ملفات تجريبية
      const file1 = new File(['Test contract 1 content'], 'contract1.pdf', { type: 'application/pdf' });
      const file2 = new File(['Test contract 2 content'], 'contract2.pdf', { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('contract1', file1);
      formData.append('contract2', file2);

      const response = await fetch('/api/upload-contracts-simple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      setResult({ type: 'upload', success: response.ok, data });
    } catch (error: any) {
      setResult({ type: 'upload', success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">اختبار نظام العقود</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={testSendContract}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'جاري الاختبار...' : 'اختبار إرسال العقود'}
            </button>
            
            <button
              onClick={testUploadContract}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'جاري الاختبار...' : 'اختبار رفع العقود'}
            </button>
          </div>

          {result && (
            <div className={`p-4 rounded-lg ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className="font-semibold mb-2">
                نتيجة اختبار {result.type === 'send' ? 'إرسال العقود' : 'رفع العقود'}:
              </h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/upload-contracts"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            الذهاب لصفحة العقود الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}