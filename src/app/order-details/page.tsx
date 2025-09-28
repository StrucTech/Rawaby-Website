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

interface GuardianData {
  fullName: string;
  mobileNumber: string;
  nationalId: string;
}

interface StudentData {
  fullName: string;
  grade: string;
  totalScore: string;
  certificateType: string;
}

interface ServiceData {
  id: string;
  title: string;
  price: number;
  duration_days: number;
}

interface OrderData {
  guardian: GuardianData;
  student: StudentData;
  services: ServiceData[];
  totalPrice: number;
  timestamp: string;
  orderId?: string;
  status?: string;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null);

  useEffect(() => {
    // Check authentication
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login?redirectTo=/order-details');
      return;
    }

    try {
      const decoded = jwtDecode(token) as DecodedToken;
      setUserInfo(decoded);
      
      // Redirect delegates to their tasks page
      if (decoded.role === 'delegate') {
        router.push('/delegate-tasks');
        return;
      }
    } catch (error) {
      Cookies.remove('token');
      router.push('/login?redirectTo=/order-details');
      return;
    }

    // Load order data from localStorage
    const submittedGuardianData = localStorage.getItem('submittedGuardianData');
    if (submittedGuardianData) {
      try {
        const parsedData = JSON.parse(submittedGuardianData);
        setOrderData(parsedData);
      } catch (error) {
        console.error('Error parsing submitted guardian data:', error);
        router.push('/guardian-info');
        return;
      }
    } else {
      // No submitted data found, redirect back to guardian info
      router.push('/guardian-info');
      return;
    }
    
    setIsLoading(false);
  }, [router]);

  const handleProceedToContract = () => {
    router.push('/upload-contracts');
  };

  const handleBackToGuardianInfo = () => {
    router.push('/guardian-info');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">لا توجد بيانات طلب</h1>
          <Link 
            href="/services"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            العودة للخدمات
          </Link>
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
            تفاصيل الطلب
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            مراجعة نهائية لتفاصيل الطلب قبل إنشاء العقد
          </p>
        </div>

        <div className="space-y-8">
          {/* Order Summary */}
          {orderData.orderId && (
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">طلب رقم: {orderData.orderId}</h3>
                  <p className="text-sm text-gray-600">تم إنشاؤه في: {new Date(orderData.timestamp).toLocaleDateString('ar-SA')}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    orderData.status === 'done' ? 'bg-green-100 text-green-800' :
                    orderData.status === 'in progress' || orderData.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    orderData.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {orderData.status === 'done' ? 'تم التنفيذ' :
                     orderData.status === 'in progress' || orderData.status === 'in_progress' ? 'قيد التنفيذ' :
                     orderData.status === 'paid' ? 'تم الدفع' :
                     'معلق'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* User Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات المستخدم</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">الاسم:</span>
                <p className="font-medium">{userInfo?.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">البريد الإلكتروني:</span>
                <p className="font-medium">{userInfo?.email}</p>
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">بيانات ولي الأمر</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-600">الاسم الكامل:</span>
                <p className="font-medium">{orderData.guardian.fullName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">رقم الجوال:</span>
                <p className="font-medium">{orderData.guardian.mobileNumber}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">الرقم القومي:</span>
                <p className="font-medium">{orderData.guardian.nationalId}</p>
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">بيانات الطالب</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">اسم الطالب:</span>
                <p className="font-medium">{orderData.student.fullName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">الدرجة:</span>
                <p className="font-medium">{orderData.student.grade}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">المجموع الكلي:</span>
                <p className="font-medium">{orderData.student.totalScore}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">نوع الشهادة:</span>
                <p className="font-medium">{orderData.student.certificateType}</p>
              </div>
            </div>
          </div>

          {/* Services Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">الخدمات المطلوبة</h2>
            <div className="space-y-4">
              {orderData.services.map((service, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{service.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        مدة التنفيذ: {service.duration_days} يوم
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-semibold text-blue-600">
                        {service.price.toLocaleString()} ريال
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Total Price */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">المجموع الكلي:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {orderData.totalPrice.toLocaleString()} ريال
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Timestamp */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">تفاصيل إضافية</h2>
            <div>
              <span className="text-sm text-gray-600">تاريخ الطلب:</span>
              <p className="font-medium">
                {new Date(orderData.timestamp).toLocaleString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <button
              onClick={handleBackToGuardianInfo}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              تعديل البيانات
            </button>
            
            <button
              onClick={handleProceedToContract}
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              إرسال العقود والمتابعة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}