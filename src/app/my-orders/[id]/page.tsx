'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface OrderDetail {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  updated_at: string;
  services: string[];
  supervisor_id?: string;
  delegate_id?: string;
  guardianInfo?: {
    fullName: string;
    mobileNumber: string;
    nationalId: string;
    email: string;
  };
  studentInfo?: {
    fullName: string;
    grade: string;
    totalScore: string;
    certificateType: string;
  };
  serviceDetails?: Array<{
    id: string;
    title: string;
    price: number;
    description: string;
  }>;
  paymentInfo?: {
    method: string;
    timestamp: string;
    amount: number;
  };
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        setError('يجب تسجيل الدخول أولاً');
        return;
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('الطلب غير موجود');
        } else if (response.status === 403) {
          setError('غير مسموح لك بعرض هذا الطلب');
        } else {
          setError('خطأ في جلب تفاصيل الطلب');
        }
        return;
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err: any) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'طلب جديد';
      case 'in-progress':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
            <p className="font-semibold">خطأ</p>
            <p className="mt-2">{error}</p>
            <div className="mt-4 space-x-2 space-x-reverse">
              <button
                onClick={() => router.back()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                العودة
              </button>
              <a
                href="/my-orders"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block"
              >
                طلباتي
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">لم يتم العثور على الطلب</p>
          <a
            href="/my-orders"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            العودة للطلبات
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  تفاصيل الطلب #{order.id.slice(-8).toUpperCase()}
                </h1>
                <p className="text-gray-600 mt-1">
                  تم الإرسال في {new Date(order.created_at).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ملخص الطلب</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">المبلغ الإجمالي</p>
                <p className="text-2xl font-bold text-blue-600">{order.total_price} ريال</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">عدد الخدمات</p>
                <p className="text-2xl font-bold text-green-600">{order.serviceDetails?.length || order.services.length}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">حالة الطلب</p>
                <p className="text-lg font-bold text-gray-900">{getStatusText(order.status)}</p>
              </div>
            </div>
          </div>

          {/* Services */}
          {order.serviceDetails && order.serviceDetails.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">الخدمات المطلوبة</h2>
              <div className="space-y-4">
                {order.serviceDetails.map((service, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{service.title}</h3>
                        {service.description && (
                          <p className="text-gray-600 mt-1">{service.description}</p>
                        )}
                      </div>
                      <div className="text-left mr-4">
                        <span className="text-xl font-bold text-blue-600">{service.price} ريال</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student & Guardian Information */}
          <div className="grid md:grid-cols-2 gap-8">
            {order.studentInfo && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات الطالب</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">الاسم الكامل</label>
                    <p className="text-gray-900">{order.studentInfo.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">الصف الدراسي</label>
                    <p className="text-gray-900">{order.studentInfo.grade}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">المجموع</label>
                    <p className="text-gray-900">{order.studentInfo.totalScore}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">نوع الشهادة</label>
                    <p className="text-gray-900">{order.studentInfo.certificateType}</p>
                  </div>
                </div>
              </div>
            )}

            {order.guardianInfo && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات ولي الأمر</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">الاسم الكامل</label>
                    <p className="text-gray-900">{order.guardianInfo.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">رقم الجوال</label>
                    <p className="text-gray-900" dir="ltr">{order.guardianInfo.mobileNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">رقم الهوية الوطنية</label>
                    <p className="text-gray-900" dir="ltr">{order.guardianInfo.nationalId}</p>
                  </div>
                  {order.guardianInfo.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">البريد الإلكتروني</label>
                      <p className="text-gray-900" dir="ltr">{order.guardianInfo.email}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Information */}
          {order.paymentInfo && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات الدفع</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">طريقة الدفع</label>
                  <p className="text-gray-900 mt-1">{order.paymentInfo.method}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">تاريخ الدفع</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(order.paymentInfo.timestamp).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">المبلغ المدفوع</label>
                  <p className="text-gray-900 mt-1 font-semibold">{order.paymentInfo.amount} ريال</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">سجل الطلب</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="mr-4">
                  <p className="font-medium text-gray-900">تم إرسال الطلب</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              {order.supervisor_id && (
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="mr-4">
                    <p className="font-medium text-gray-900">تم تعيين مشرف</p>
                    <p className="text-sm text-gray-600">تم تعيين مشرف للإشراف على تنفيذ طلبك</p>
                  </div>
                </div>
              )}

              {order.delegate_id && (
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="mr-4">
                    <p className="font-medium text-gray-900">تم تعيين مندوب</p>
                    <p className="text-sm text-gray-600">تم تعيين مندوب لتنفيذ طلبك</p>
                  </div>
                </div>
              )}

              {order.status === 'completed' && (
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-3 h-3 bg-green-600 rounded-full"></div>
                  <div className="mr-4">
                    <p className="font-medium text-gray-900">تم إنجاز الطلب</p>
                    <p className="text-sm text-gray-600">تم إكمال جميع الخدمات المطلوبة بنجاح</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <a
              href="/my-orders"
              className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700"
            >
              العودة لطلباتي
            </a>
            {order.status === 'new' && (
              <button className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700">
                طلب إلغاء الطلب
              </button>
            )}
            <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
              تواصل معنا
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}