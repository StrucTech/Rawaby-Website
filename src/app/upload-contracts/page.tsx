'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export default function UploadContractsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null);
  const [step, setStep] = useState<'send' | 'upload' | 'countdown'>('send');
  const [contract1File, setContract1File] = useState<File | null>(null);
  const [contract2File, setContract2File] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Check authentication
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login?redirectTo=/upload-contracts');
      return;
    }

    try {
      const decoded = jwtDecode(token) as DecodedToken;
      setUserInfo(decoded);
    } catch (error) {
      Cookies.remove('token');
      router.push('/login?redirectTo=/upload-contracts');
      return;
    }
  }, [router]);

  // Countdown effect
  useEffect(() => {
    if (step === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (step === 'countdown' && countdown === 0) {
      router.push('/payment');
    }
  }, [step, countdown, router]);

  const handleSendContracts = async () => {
    setIsLoading(true);
    setUploadStatus(null);

    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/send-contract', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ في إرسال العقود');
      }

      setUploadStatus({
        type: 'success',
        message: `تم إرسال ملفات العقد بنجاح إلى ${data.email}`
      });

      setStep('upload');

    } catch (error: any) {
      console.error('Send contracts error:', error);
      setUploadStatus({
        type: 'error',
        message: error.message || 'حدث خطأ في إرسال العقود'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (fileType: 'contract1' | 'contract2', file: File | null) => {
    if (fileType === 'contract1') {
      setContract1File(file);
    } else {
      setContract2File(file);
    }
  };

  const handleUploadContracts = async () => {
    if (!contract1File || !contract2File) {
      setUploadStatus({
        type: 'error',
        message: 'يرجى اختيار كلا الملفين'
      });
      return;
    }

    setIsLoading(true);
    setUploadStatus(null);

    try {
      const token = Cookies.get('token');
      const formData = new FormData();
      formData.append('contract1', contract1File);
      formData.append('contract2', contract2File);

      // محاولة API الأساسي أولاً، ثم البديل البسيط
      let response = await fetch('/api/upload-contracts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      // إذا فشل API الأساسي، جرب البديل البسيط
      if (!response.ok) {
        console.log('Primary API failed, trying simple API...');
        response = await fetch('/api/upload-contracts-simple', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ في رفع العقود');
      }

      setUploadStatus({
        type: 'success',
        message: 'تم رفع العقود بنجاح! سيتم توجيهك لصفحة الدفع'
      });

      setStep('countdown');

    } catch (error: any) {
      console.error('Upload contracts error:', error);
      setUploadStatus({
        type: 'error',
        message: error.message || 'حدث خطأ في رفع العقود'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSendStep = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">إرسال ملفات العقد</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">الخطوات التالية:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>سنقوم بإرسال ملفات العقد إلى بريدك الإلكتروني</li>
              <li>قم بتحميل الملفين وطباعتهما</li>
              <li>املأ البيانات المطلوبة ووقع على العقود</li>
              <li>ارفع الملفين الموقعين هنا</li>
              <li>ستتم إعادة توجيهك لصفحة الدفع</li>
            </ol>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">الملفات التي سيتم إرسالها:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>📄 عقد وتوكيل خدمات استشارية تعليمية 2025</li>
              <li>📄 نموذج توكيل خاص الراوبى</li>
            </ul>
          </div>

          <button
            onClick={handleSendContracts}
            disabled={isLoading}
            className={`w-full px-6 py-3 rounded-md text-white font-medium transition-colors duration-200 ${
              isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'جاري الإرسال...' : 'إرسال ملفات العقد إلى بريدي الإلكتروني'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderUploadStep = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">رفع العقود الموقعة</h2>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">
            ✅ تم إرسال ملفات العقد إلى بريدك الإلكتروني. يرجى تحميلها وملؤها وتوقيعها ثم رفعها هنا.
          </p>
        </div>

        <div className="space-y-6">
          {/* Upload Contract 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عقد وتوكيل خدمات استشارية تعليمية 2025 *
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('contract1', e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {contract1File && (
              <p className="mt-1 text-sm text-green-600">✅ تم اختيار: {contract1File.name}</p>
            )}
          </div>

          {/* Upload Contract 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نموذج توكيل خاص الراوبى *
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('contract2', e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {contract2File && (
              <p className="mt-1 text-sm text-green-600">✅ تم اختيار: {contract2File.name}</p>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>ملاحظة:</strong> يمكنك رفع الملفات بصيغة PDF أو Word أو صور (JPG/PNG). الحد الأقصى لحجم الملف 10 ميجابايت.
            </p>
          </div>

          <button
            onClick={handleUploadContracts}
            disabled={isLoading || !contract1File || !contract2File}
            className={`w-full px-6 py-3 rounded-md text-white font-medium transition-colors duration-200 ${
              isLoading || !contract1File || !contract2File
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? 'جاري الرفع...' : 'رفع العقود والمتابعة للدفع'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderCountdownStep = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تم رفع العقود بنجاح!</h2>
          <p className="text-gray-600">سيتم توجيهك إلى صفحة الدفع خلال:</p>
        </div>
        
        <div className="text-6xl font-bold text-blue-600 mb-4">
          {countdown}
        </div>
        
        <p className="text-gray-500 mb-6">ثانية</p>
        
        <button
          onClick={() => router.push('/payment')}
          className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
        >
          الذهاب للدفع الآن
        </button>
      </div>
    </div>
  );

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            العقود والتوقيع
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            يرجى قراءة العقود والتوقيع عليها لإكمال الطلب
          </p>
        </div>

        {/* Status Messages */}
        {uploadStatus && (
          <div className={`mb-6 p-4 rounded-lg ${
            uploadStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : uploadStatus.type === 'info'
              ? 'bg-blue-50 border border-blue-200 text-blue-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {uploadStatus.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : uploadStatus.type === 'info' ? (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium">{uploadStatus.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        {step === 'send' && renderSendStep()}
        {step === 'upload' && renderUploadStep()}
        {step === 'countdown' && renderCountdownStep()}

        {/* Back Button */}
        {step === 'send' && (
          <div className="mt-8 text-center">
            <Link 
              href="/order-details"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              العودة لتفاصيل الطلب
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 