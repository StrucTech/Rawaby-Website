'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';

interface PaymentDetails {
  method: string;
  amount: number;
  timestamp: string;
}

const PaymentSuccessPage: React.FC = () => {
  const router = useRouter();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Verify token
    try {
      jwt_decode(token);
    } catch (error) {
      Cookies.remove('token');
      router.push('/login');
      return;
    }

    // Load payment details
    const savedPaymentDetails = localStorage.getItem('paymentDetails');
    if (savedPaymentDetails) {
      try {
        const parsedDetails = JSON.parse(savedPaymentDetails);
        if (parsedDetails.method && parsedDetails.amount) {
          setPaymentDetails(parsedDetails);
        } else {
          setError('بيانات الدفع غير صالحة');
        }
      } catch (error) {
        setError('حدث خطأ أثناء تحميل بيانات الدفع');
      }
    } else {
      setError('لم يتم العثور على بيانات الدفع');
    }
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">{error}</h2>
          <button
            onClick={() => router.push('/services')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            العودة إلى الخدمات
          </button>
        </div>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">جاري التحميل...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              تم الدفع بنجاح!
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              شكراً لك على استخدام خدماتنا التعليمية
            </p>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                تفاصيل الدفع
              </h2>
              <div className="space-y-2 text-right">
                <p className="text-gray-600">
                  <span className="font-semibold">طريقة الدفع:</span>{' '}
                  {paymentDetails.method === 'credit' ? 'بطاقة ائتمان' :
                   paymentDetails.method === 'mada' ? 'مدى' :
                   paymentDetails.method === 'apple' ? 'Apple Pay' : paymentDetails.method}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">المبلغ:</span>{' '}
                  {paymentDetails.amount} ريال
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">تاريخ الدفع:</span>{' '}
                  {new Date(paymentDetails.timestamp).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="space-y-4">
              <p className="text-gray-600">
                سيتم التواصل معك قريباً لتأكيد مواعيد الخدمات المطلوبة
              </p>
              <div className="flex justify-center space-x-4 space-x-reverse">
                <button
                  onClick={() => router.push('/my-orders')}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                >
                  متابعة طلباتي
                </button>
                <button
                  onClick={() => router.push('/services')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  العودة إلى الخدمات
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
                >
                  العودة للرئيسية
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage; 