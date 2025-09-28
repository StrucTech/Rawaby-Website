'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface OrderDetails {
  services: Array<{
    id: number;
    title: string;
    description: string;
    duration: string;
    price: number;
    category: string;
  }>;
  totalPrice: number;
  timestamp: string;
}

const PaymentPage: React.FC = () => {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'mada' | 'apple' | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    // Check authentication
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login?redirect=/payment');
      return;
    }

    // Verify token
    try {
      jwtDecode(token);
    } catch (error) {
      Cookies.remove('token');
      router.push('/login?redirect=/payment');
      return;
    }

    // Load order details
    const savedOrderDetails = localStorage.getItem('orderDetails');
    if (savedOrderDetails) {
      try {
        const parsedDetails = JSON.parse(savedOrderDetails);
        if (parsedDetails.services && parsedDetails.totalPrice) {
          setOrderDetails(parsedDetails);
        } else {
          setError('بيانات الطلب غير صالحة');
          router.push('/services');
        }
      } catch (error) {
        setError('حدث خطأ أثناء تحميل بيانات الطلب');
        router.push('/services');
      }
    } else {
      setError('لم يتم العثور على تفاصيل الطلب');
      router.push('/services');
    }
  }, [router]);

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!paymentMethod) {
        setError('يرجى اختيار طريقة الدفع');
        return;
      }

      if (paymentMethod === 'credit' || paymentMethod === 'mada') {
        if (!cardNumber || !expiryDate || !cvv) {
          setError('يرجى إدخال جميع بيانات البطاقة');
          return;
        }
      }

      // Here you would typically integrate with a payment gateway
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // جلب كل تفاصيل الطلب (مع بيانات ولي الأمر والطالب)
      let fullOrderDetails = null;
      let guardianData = null;
      let studentData = null;
      
      // محاولة جلب البيانات من مصادر مختلفة
      const completeOrderDetails = localStorage.getItem('completeOrderDetails');
      const submittedGuardianData = localStorage.getItem('submittedGuardianData');
      
      if (completeOrderDetails) {
        fullOrderDetails = JSON.parse(completeOrderDetails);
        guardianData = fullOrderDetails.guardianInfo;
        studentData = fullOrderDetails.studentInfo;
      } else if (submittedGuardianData) {
        const submittedData = JSON.parse(submittedGuardianData);
        guardianData = submittedData.guardian;
        studentData = submittedData.student;
        fullOrderDetails = submittedData;
      } else if (orderDetails) {
        fullOrderDetails = orderDetails;
      }
      
      console.log('Guardian data found:', guardianData);
      console.log('Student data found:', studentData);

      // إرسال الطلب إلى قاعدة البيانات
      if (fullOrderDetails) {
        const token = Cookies.get('token');
        
        // استخراج معرفات الخدمات
        const serviceIds = (fullOrderDetails.services || []).map((s: any) => s.id || s._id || s.service || s);
        
        // إعداد بيانات الطلب الكاملة
        const orderData = {
          serviceIds,
          paymentMethod,
          totalAmount: orderDetails?.totalPrice || fullOrderDetails.totalPrice,
          guardianData: guardianData,
          studentData: studentData
        };

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(orderData)
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Order creation failed:', response.status, errorData);
          throw new Error(`فشل في إنشاء الطلب (${response.status}): ${errorData}`);
        }

        const result = await response.json();
        console.log('Order created successfully:', result.order);
      }

      // Save payment details to localStorage
      localStorage.setItem('paymentDetails', JSON.stringify({
        method: paymentMethod,
        amount: orderDetails?.totalPrice,
        timestamp: new Date().toISOString()
      }));

      // Clear cart and order details
      localStorage.removeItem('cart');
      localStorage.removeItem('orderDetails');
      localStorage.removeItem('contractSignature');
      localStorage.removeItem('completeOrderDetails');

      // Redirect to success page
      router.push('/payment/success');
    } catch (error: any) {
      console.error('Payment processing error:', error);
      setError(`حدث خطأ أثناء معالجة الدفع: ${error.message || 'خطأ غير محدد'}`);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!orderDetails) {
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
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              الدفع
            </h1>

            {/* Order Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ملخص الطلب</h2>
              <div className="space-y-4">
                {orderDetails.services.map((service) => (
                  <div key={service.id} className="flex justify-between items-center">
                    <span className="text-gray-600">{service.title}</span>
                    <span className="font-semibold">{service.price} ريال</span>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">المجموع الكلي:</span>
                    <span className="text-xl font-bold text-blue-600">{orderDetails.totalPrice} ريال</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">اختر طريقة الدفع</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('credit')}
                  className={`p-4 border rounded-lg text-center ${
                    paymentMethod === 'credit' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <img src="/credit-card.svg" alt="Credit Card" className="h-8 mx-auto mb-2" />
                  <span>بطاقة ائتمان</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('mada')}
                  className={`p-4 border rounded-lg text-center ${
                    paymentMethod === 'mada' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <img src="/mada.svg" alt="Mada" className="h-8 mx-auto mb-2" />
                  <span>مدى</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('apple')}
                  className={`p-4 border rounded-lg text-center ${
                    paymentMethod === 'apple' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  <img src="/apple-pay.svg" alt="Apple Pay" className="h-8 mx-auto mb-2" />
                  <span>Apple Pay</span>
                </button>
              </div>
            </div>

            {/* Card Details Form */}
            {(paymentMethod === 'credit' || paymentMethod === 'mada') && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">بيانات البطاقة</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم البطاقة
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        تاريخ الانتهاء
                      </label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        رمز الأمان
                      </label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                        className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className={`w-full bg-green-600 text-white py-3 px-4 rounded-md text-lg font-medium hover:bg-green-700 transition-colors duration-200 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'جاري معالجة الدفع...' : 'تأكيد الدفع'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 


//الاوردر مش بيسمع في الداتا بيز