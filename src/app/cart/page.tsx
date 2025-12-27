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

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  category: string;
}

interface OrderDetails {
  services: Service[];
  totalPrice: number;
  timestamp: number;
}

export default function CartPage() {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login?redirectTo=/cart');
        return;
      }

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (!decoded) {
          throw new Error('Invalid token');
        }
      } catch (error) {
        Cookies.remove('token');
        router.push('/login?redirectTo=/cart');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const savedOrderDetails = localStorage.getItem('orderDetails');
    if (savedOrderDetails) {
      try {
        const parsedDetails = JSON.parse(savedOrderDetails);
        if (parsedDetails.services && Array.isArray(parsedDetails.services)) {
          setOrderDetails(parsedDetails);
        } else {
          throw new Error('Invalid order details format');
        }
      } catch (error) {
        setError('حدث خطأ في تحميل تفاصيل الطلب');
        router.push('/services');
      }
    } else {
      setError('لم يتم العثور على تفاصيل الطلب');
      router.push('/services');
    }
    setIsLoading(false);
  }, [router]);

  const handleRemoveService = (serviceId: string) => {
    if (!orderDetails) return;

    const updatedServices = orderDetails.services.filter(service => service.id !== serviceId);
    const updatedTotalPrice = updatedServices.reduce((total, service) => total + service.price, 0);

    const updatedOrderDetails = {
      ...orderDetails,
      services: updatedServices,
      totalPrice: updatedTotalPrice
    };

    setOrderDetails(updatedOrderDetails);
    localStorage.setItem('orderDetails', JSON.stringify(updatedOrderDetails));

    // If cart is empty, redirect to services page
    if (updatedServices.length === 0) {
      router.push('/services');
    }
  };

  const handleProceedToContract = () => {
    if (!orderDetails || orderDetails.services.length === 0) {
      setError('لا يمكن المتابعة بدون خدمات في السلة');
      return;
    }

    try {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login?redirectTo=/cart');
        return;
      }

      const decoded = jwtDecode<DecodedToken>(token);
      if (!decoded) {
        throw new Error('Invalid token');
      }

      // Redirect to guardian info page instead of contract
      router.push('/guardian-info');
    } catch (error) {
      setError('حدث خطأ في التحقق من تسجيل الدخول');
      Cookies.remove('token');
      router.push('/login?redirectTo=/cart');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">جاري تحميل سلة المشتريات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/services"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              العودة إلى الخدمات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">سلة المشتريات</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">تفاصيل الطلب المختار</p>
          </div>
          <div className="border-t border-gray-200">
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">الخدمات المختارة</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {orderDetails?.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{service.title}</h4>
                      <p className="text-sm text-gray-500">{service.description}</p>
                      <p className="text-sm text-gray-500">المدة: {service.duration}</p>
                      <p className="text-sm font-medium text-blue-600">{service.price} جنيه مصري</p>
                    </div>
                    <button
                      onClick={() => handleRemoveService(service.id)}
                      className="ml-4 text-red-600 hover:text-red-800"
                      title="إزالة الخدمة"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">المجموع</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className="text-lg font-bold text-blue-600">{orderDetails?.totalPrice} جنيه مصري</span>
              </dd>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Link
            href="/services"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            العودة إلى الخدمات
          </Link>
          <button
            onClick={handleProceedToContract}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            إدخال بيانات الطالب وولي الأمر
          </button>
        </div>
      </div>
    </div>
  );
} 