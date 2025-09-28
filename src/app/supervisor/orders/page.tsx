'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface OrderDetails {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  clientInfo?: {
    name: string;
    email: string;
    phone: string;
  };
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

export default function SupervisorOrdersPage() {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('يجب تسجيل الدخول أولاً');
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/orders?supervisorId=all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('فشل في جلب الطلبات');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchOrders}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">إدارة الطلبات - المشرف</h1>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">لا توجد طلبات حالياً</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      طلب رقم: {order.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      تاريخ الإنشاء: {new Date(order.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'new' ? 'bg-green-100 text-green-800' :
                    order.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'new' ? 'جديد' : 
                     order.status === 'in-progress' ? 'قيد التنفيذ' : order.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* معلومات العميل */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">معلومات العميل</h4>
                    {order.clientInfo ? (
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">الاسم:</span> {order.clientInfo.name}</p>
                        <p><span className="font-medium">الإيميل:</span> {order.clientInfo.email}</p>
                        <p><span className="font-medium">الهاتف:</span> {order.clientInfo.phone}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">غير متوفر</p>
                    )}
                  </div>

                  {/* معلومات ولي الأمر */}
                  {order.guardianInfo && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">معلومات ولي الأمر</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">الاسم:</span> {order.guardianInfo.fullName}</p>
                        <p><span className="font-medium">الجوال:</span> {order.guardianInfo.mobileNumber}</p>
                        <p><span className="font-medium">الهوية:</span> {order.guardianInfo.nationalId}</p>
                        {order.guardianInfo.email && (
                          <p><span className="font-medium">الإيميل:</span> {order.guardianInfo.email}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* معلومات الطالب */}
                  {order.studentInfo && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">معلومات الطالب</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">الاسم:</span> {order.studentInfo.fullName}</p>
                        <p><span className="font-medium">الصف:</span> {order.studentInfo.grade}</p>
                        <p><span className="font-medium">المجموع:</span> {order.studentInfo.totalScore}</p>
                        <p><span className="font-medium">نوع الشهادة:</span> {order.studentInfo.certificateType}</p>
                      </div>
                    </div>
                  )}

                  {/* معلومات الدفع */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">معلومات الدفع</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">المبلغ:</span> {order.total_price} ريال</p>
                      {order.paymentInfo && (
                        <>
                          <p><span className="font-medium">طريقة الدفع:</span> {order.paymentInfo.method}</p>
                          <p><span className="font-medium">وقت الدفع:</span> {new Date(order.paymentInfo.timestamp).toLocaleString('ar-SA')}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* تفاصيل الخدمات */}
                {order.serviceDetails && order.serviceDetails.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">الخدمات المطلوبة</h4>
                    <div className="grid gap-3">
                      {order.serviceDetails.map((service, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{service.title}</h5>
                              {service.description && (
                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              )}
                            </div>
                            <span className="text-lg font-semibold text-blue-600">
                              {service.price} ريال
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* أزرار الإجراءات */}
                <div className="mt-6 flex gap-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    تعيين مندوب
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                    تحديث الحالة
                  </button>
                  <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                    إرسال رسالة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}