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
        setIsLoading(false);
        return;
      }

      if (paymentMethod === 'credit' || paymentMethod === 'mada') {
        if (!cardNumber || !expiryDate || !cvv) {
          setError('يرجى إدخال جميع بيانات البطاقة');
          setIsLoading(false);
          return;
        }

        // التحقق من صحة رقم البطاقة (يجب أن يكون 13-19 رقم)
        const cardRegex = /^[0-9]{13,19}$/;
        if (!cardRegex.test(cardNumber.replace(/\s/g, ''))) {
          setError('يرجى إدخال رقم بطاقة صحيح');
          setIsLoading(false);
          return;
        }

        // التحقق من صحة تاريخ الانتهاء (MM/YY)
        const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!expiryRegex.test(expiryDate)) {
          setError('يرجى إدخال تاريخ انتهاء صحيح بصيغة MM/YY');
          setIsLoading(false);
          return;
        }

        // التحقق من صحة CVV (3-4 أرقام)
        const cvvRegex = /^[0-9]{3,4}$/;
        if (!cvvRegex.test(cvv)) {
          setError('يرجى إدخال رمز الأمان صحيح');
          setIsLoading(false);
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
          setError(`فشل في إنشاء الطلب: ${errorData || 'حدث خطأ غير متوقع'}`);
          setIsLoading(false);
          return;
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
      setIsLoading(false);
    }
  };

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

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-700 font-medium">{error}</p>
                    <p className="text-red-600 text-sm mt-1">يرجى تصحيح البيانات أعلاه والمحاولة مجدداً</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">ملخص الطلب</h2>
              <div className="space-y-4">
                {orderDetails.services.map((service) => (
                  <div key={service.id} className="flex justify-between items-center">
                    <span className="text-gray-600">{service.title}</span>
                    <span className="font-semibold">{service.price} جنيه مصري</span>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">المجموع الكلي:</span>
                    <span className="text-xl font-bold text-blue-600">{orderDetails.totalPrice} جنيه مصري</span>
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
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, '');
                        setCardNumber(value.replace(/(\d{4})/g, '$1 ').trim());
                      }}
                      placeholder="1234 5678 9012 3456"
                      maxLength="23"
                      className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        error && !cardNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">13-19 أرقام</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        تاريخ الانتهاء
                      </label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + '/' + value.slice(2, 4);
                          }
                          setExpiryDate(value);
                        }}
                        placeholder="MM/YY"
                        maxLength="5"
                        className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                          error && !expiryDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">الصيغة: MM/YY</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        رمز الأمان
                      </label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        maxLength="4"
                        className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                          error && !cvv ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">3-4 أرقام</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-md text-lg font-medium transition-colors duration-200 ${
                isLoading 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري معالجة الدفع...
                </span>
              ) : (
                'تأكيد الدفع'
              )}
            </button>

            <div className="mt-6 text-center">
              <button
                onClick={() => window.history.back()}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                العودة إلى الخطوة السابقة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 


//الاوردر مش بيسمع في الداتا بيز