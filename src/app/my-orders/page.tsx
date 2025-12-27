'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface UserOrder {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  updated_at: string;
  services: string[];
  supervisor_id?: string;
  delegate_id?: string;
  assigned_supervisor_id?: string;
  assigned_delegate_id?: string;
  guardianInfo?: {
    fullName: string;
    mobileNumber: string;
    nationalId: string;
    email: string;
  };
  studentInfo?: {
    fullName?: string;
    name?: string; // دعم كلا التنسيقين
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

interface DecodedToken {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<DecodedToken | null>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUserInfo(decoded);
        fetchMyOrders(token);
      } catch (error) {
        setError('خطأ في التحقق من الهوية');
        setLoading(false);
      }
    } else {
      setError('يجب تسجيل الدخول أولاً');
      setLoading(false);
    }
  }, []);

  const fetchMyOrders = async (token: string) => {
    try {
      const response = await fetch('/api/orders', {
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

  // دالة للحصول على الحالة المعروضة للعميل
  // العميل لا يرى "تعيين مشرف" أو "تعيين مندوب" - بدلاً من ذلك يرى "تحت المراجعة"
  const getClientVisibleStatus = (order: any) => {
    const status = order.status;
    const hasSupervisor = !!order.assigned_supervisor_id;
    const hasDelegate = !!order.assigned_delegate_id;
    
    // إذا كانت الحالة "تعيين مشرف" أو "تعيين مندوب" - إخفاءها عن العميل
    if (status === 'تعيين مشرف' || status === 'تعيين مندوب' || 
        status === 'new' || status === 'pending' || status === 'assigned') {
      return 'تحت المراجعة';
    }
    
    // باقي الحالات تظهر كما هي
    return status;
  };

  const getStatusText = (status: string, order?: any) => {
    // إذا كان هناك order، نستخدم الحالة المرئية للعميل
    const visibleStatus = order ? getClientVisibleStatus(order) : status;
    
    switch (visibleStatus) {
      // الحالة المجمعة للعميل
      case 'تحت المراجعة':
        return 'تحت المراجعة';
      // الحالات التي يراها العميل
      case 'تحت الإجراء':
        return 'قيد التنفيذ';
      case 'مطلوب بيانات إضافية أو مرفقات':
        return 'مطلوب بيانات إضافية';
      case 'بانتظار رد العميل':
        return 'بانتظار ردك';
      case 'تم الانتهاء بنجاح':
        return 'مكتمل ✓';
      // الحالات القديمة للتوافقية
      case 'in-progress':
      case 'in progress':
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'completed':
      case 'done':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      case 'paid':
        return 'تم الدفع';
      default:
        return visibleStatus;
    }
  };

  const getStatusColor = (status: string, order?: any) => {
    // إذا كان هناك order، نستخدم الحالة المرئية للعميل
    const visibleStatus = order ? getClientVisibleStatus(order) : status;
    
    switch (visibleStatus) {
      // الحالة المجمعة للعميل
      case 'تحت المراجعة':
        return 'bg-blue-100 text-blue-800';
      // الحالات التي يراها العميل
      case 'تحت الإجراء':
        return 'bg-blue-100 text-blue-800';
      case 'مطلوب بيانات إضافية أو مرفقات':
        return 'bg-yellow-100 text-yellow-800';
      case 'بانتظار رد العميل':
        return 'bg-purple-100 text-purple-800';
      case 'تم الانتهاء بنجاح':
        return 'bg-green-100 text-green-800';
      // الحالات القديمة للتوافقية
      case 'in-progress':
      case 'in progress':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDescription = (status: string, hasSupervisor: boolean, hasDelegate: boolean, order?: any) => {
    // إذا كان هناك order، نستخدم الحالة المرئية للعميل
    const visibleStatus = order ? getClientVisibleStatus(order) : status;
    
    switch (visibleStatus) {
      // الحالة المجمعة للعميل - "تحت المراجعة"
      case 'تحت المراجعة':
        return 'طلبك تحت المراجعة وسيتم تعيين فريق العمل قريباً';
      // الحالات التي يراها العميل
      case 'تحت الإجراء':
        return 'يتم العمل على طلبك حالياً من قبل فريقنا المختص';
      case 'مطلوب بيانات إضافية أو مرفقات':
        return 'يرجى تقديم البيانات أو المرفقات المطلوبة لإكمال طلبك';
      case 'بانتظار رد العميل':
        return 'فريقنا ينتظر ردك أو تأكيدك لمتابعة الطلب';
      case 'تم الانتهاء بنجاح':
        return 'تم إنجاز طلبك بنجاح! شكراً لثقتك بنا ✓';
      // الحالات القديمة للتوافقية
      case 'in progress':
      case 'in-progress':
        return 'يتم العمل على طلبك حالياً من قبل فريقنا المختص';
      case 'done':
      case 'completed':
        return 'تم إنجاز طلبك بنجاح! شكراً لثقتك بنا ✓';
      case 'cancelled':
        return 'تم إلغاء الطلب. للاستفسار تواصل معنا';
      default:
        return 'حالة الطلب غير محددة';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل طلباتك...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <p className="font-semibold">خطأ</p>
            <p className="mt-2">{error}</p>
            {error.includes('تسجيل الدخول') && (
              <a
                href="/login"
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                تسجيل الدخول
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">طلباتي</h1>
              {userInfo && (
                <p className="text-gray-600 mt-1">مرحباً {userInfo.name}</p>
              )}
            </div>
            <div className="flex gap-4">
              <a
                href="/services"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                طلب خدمة جديدة
              </a>
              <a
                href="/"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                العودة للرئيسية
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات بعد</h3>
              <p className="text-gray-600 mb-6">لم تقم بإرسال أي طلبات حتى الآن</p>
              <a
                href="/services"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 inline-block"
              >
                تصفح خدماتنا
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        طلب رقم: {order.id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        تاريخ الطلب: {new Date(order.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-left">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status, order)}`}>
                        {getStatusText(order.status, order)}
                      </span>
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        {order.total_price} جنيه مصري
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Status Description */}
                <div className="px-6 py-4 bg-blue-50 border-b">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        (order.status === 'completed' || order.status === 'done' || order.status === 'تم الانتهاء بنجاح') ? 'bg-green-500' :
                        (order.status === 'تحت الإجراء' || order.status === 'in-progress' || order.status === 'in progress' || order.status === 'in_progress') ? 'bg-yellow-500' :
                        order.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                    </div>
                    <div className="mr-3">
                      <p className="text-sm text-gray-700">
                        {getStatusDescription(order.status, !!order.assigned_supervisor_id, !!order.assigned_delegate_id, order)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="px-6 py-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Service Details */}
                    {order.serviceDetails && order.serviceDetails.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">الخدمات المطلوبة</h4>
                        <div className="space-y-2">
                          {order.serviceDetails.map((service, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">{service.title}</p>
                                {service.description && (
                                  <p className="text-sm text-gray-600">{service.description}</p>
                                )}
                              </div>
                              <span className="font-semibold text-blue-600">{service.price} جنيه مصري</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student & Guardian Info */}
                    <div className="space-y-4">
                      {order.studentInfo && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">معلومات الطالب</h4>
                          <div className="bg-gray-50 p-3 rounded-lg text-sm">
                            <p><span className="font-medium">الاسم:</span> {order.studentInfo.fullName || order.studentInfo.name || 'غير محدد'}</p>
                            <p><span className="font-medium">الصف:</span> {order.studentInfo.grade || 'غير محدد'}</p>
                            <p><span className="font-medium">المجموع:</span> {order.studentInfo.totalScore || 'غير محدد'}</p>
                            <p><span className="font-medium">نوع الشهادة:</span> {order.studentInfo.certificateType || 'غير محدد'}</p>
                          </div>
                        </div>
                      )}

                      {order.guardianInfo && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">معلومات ولي الأمر</h4>
                          <div className="bg-gray-50 p-3 rounded-lg text-sm">
                            <p><span className="font-medium">الاسم:</span> {order.guardianInfo.fullName}</p>
                            <p><span className="font-medium">الجوال:</span> {order.guardianInfo.mobileNumber}</p>
                            <p><span className="font-medium">الهوية:</span> {order.guardianInfo.nationalId}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Info */}
                  {order.paymentInfo && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2">معلومات الدفع</h4>
                      <div className="flex justify-between items-center text-sm">
                        <span>طريقة الدفع: {order.paymentInfo.method}</span>
                        <span>تاريخ الدفع: {new Date(order.paymentInfo.timestamp).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                  )}

                  {/* Completion Info */}
                  {order.status === 'done' && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-semibold text-green-800 mb-2">✓ تم إنجاز الطلب</h4>
                      <div className="bg-green-50 p-3 rounded-lg text-sm">
                        <p className="text-green-700">تم إنجاز طلبك بنجاح من قبل فريقنا المختص. شكراً لثقتك بنا!</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    آخر تحديث: {new Date(order.updated_at).toLocaleDateString('ar-SA')}
                  </div>
                  <div className="flex gap-3">
                    {order.status === 'new' && (
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        طلب إلغاء
                      </button>
                    )}
                    <a
                      href={`/my-orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      تفاصيل أكثر
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}