'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';
import ReviewModal from '@/components/ReviewModal';

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
  
  // حالة التقييم
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<{id: string, serviceName: string} | null>(null);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
  
  // حالة طلب الإلغاء
  const [cancellationInProgress, setCancellationInProgress] = useState<string | null>(null);
  
  // حالة الإشعارات
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded = jwt_decode<DecodedToken>(token);
        setUserInfo(decoded);
        fetchMyOrders(token);
        checkReviewedOrders(token);
        fetchClientNotifications(token);
      } catch (error) {
        setError('خطأ في التحقق من الهوية');
        setLoading(false);
      }
    } else {
      setError('يجب تسجيل الدخول أولاً');
      setLoading(false);
    }
  }, []);

  // التحقق من الطلبات التي تم تقييمها
  const checkReviewedOrders = async (token: string) => {
    try {
      // سنتحقق من كل طلب مكتمل
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const completedOrders = (data.orders || []).filter(
        (o: UserOrder) => o.status === 'completed' || o.status === 'done' || o.status === 'تم الانتهاء بنجاح'
      );
      
      const reviewed = new Set<string>();
      for (const order of completedOrders) {
        const reviewRes = await fetch(`/api/reviews/submit?order_id=${order.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const reviewData = await reviewRes.json();
        if (reviewData.review) {
          reviewed.add(order.id);
        }
      }
      setReviewedOrders(reviewed);
    } catch (error) {
      console.error('Error checking reviewed orders:', error);
    }
  };

  // دالة لفتح نافذة التقييم
  const openReviewModal = (orderId: string, serviceName: string) => {
    setSelectedOrderForReview({ id: orderId, serviceName });
    setReviewModalOpen(true);
  };

  // دالة عند نجاح التقييم
  const handleReviewSuccess = () => {
    if (selectedOrderForReview) {
      setReviewedOrders(prev => new Set([...prev, selectedOrderForReview.id]));
    }
    alert('شكراً لتقييمك! سيتم مراجعته ونشره قريباً');
  };

  // دالة طلب إلغاء الطلب
  const handleCancellationRequest = async (orderId: string) => {
    const confirmCancel = window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الطلب واسترجاع المبلغ؟');
    if (!confirmCancel) return;

    setCancellationInProgress(orderId);
    try {
      const token = Cookies.get('token');
      if (!token) {
        alert('يجب تسجيل الدخول');
        return;
      }

      const response = await fetch(`/api/orders/${orderId}/request-cancellation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        alert('خطأ: ' + (data.error || 'فشل في إرسال طلب الإلغاء'));
        return;
      }

      alert('تم إرسال طلب الإلغاء للمشرف. سيتم مراجعته قريباً');
      // تحديث الطلب في القائمة - نضيف علامة cancellation_requested في metadata
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, cancellation_requested: true } : o
      ));
    } catch (error: any) {
      alert('خطأ: ' + error.message);
    } finally {
      setCancellationInProgress(null);
    }
  };

  // جلب إشعارات العميل
  const fetchClientNotifications = async (token: string) => {
    try {
      setLoadingNotifications(true);
      const response = await fetch('/api/delegate-completion?status=unread', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // تصفية الإشعارات الخاصة بالعميل (cancellation_approved و cancellation_rejected)
        const clientNotifs = (data.notifications || []).filter(
          (n: any) => n.type === 'cancellation_approved' || n.type === 'cancellation_rejected'
        );
        setNotifications(clientNotifs);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // حذف إشعار بعد قراءته
  const dismissNotification = async (notificationId: string) => {
    try {
      const token = Cookies.get('token');
      await fetch('/api/delegate-completion', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId, status: 'read' })
      });

      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // التحقق إذا كان الطلب مكتمل وقابل للتقييم
  const isOrderCompletedAndReviewable = (order: UserOrder) => {
    const completedStatuses = ['completed', 'done', 'تم الانتهاء بنجاح'];
    return completedStatuses.includes(order.status) && !reviewedOrders.has(order.id);
  };

  // التحقق إذا تم تقييم الطلب
  const isOrderReviewed = (orderId: string) => {
    return reviewedOrders.has(orderId);
  };

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
        {/* قسم الإشعارات */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-3">
            <h2 className="text-lg font-bold text-gray-900 mb-3">📬 إشعارات هامة</h2>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg p-4 border-l-4 ${
                  notification.type === 'cancellation_approved'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`font-semibold mb-1 ${
                      notification.type === 'cancellation_approved'
                        ? 'text-green-800'
                        : 'text-red-800'
                    }`}>
                      {notification.type === 'cancellation_approved' ? '✅ تم قبول طلب الإلغاء' : '❌ تم رفض طلب الإلغاء'}
                    </p>
                    <p className="text-gray-700 whitespace-pre-line">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.created_at).toLocaleString('ar-SA')}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600 ml-3"
                    title="إخفاء الإشعار"
                  >
                    ✖
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
                  {(order.status === 'done' || order.status === 'completed' || order.status === 'تم الانتهاء بنجاح') && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-semibold text-green-800 mb-2">✓ تم إنجاز الطلب</h4>
                      <div className="bg-green-50 p-3 rounded-lg text-sm">
                        <p className="text-green-700">تم إنجاز طلبك بنجاح من قبل فريقنا المختص. شكراً لثقتك بنا!</p>
                      </div>
                      
                      {/* زر التقييم */}
                      {isOrderCompletedAndReviewable(order) && (
                        <button
                          onClick={() => openReviewModal(
                            order.id, 
                            order.serviceDetails?.[0]?.title || 'خدمة'
                          )}
                          className="mt-4 w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          قيّم تجربتك مع خدماتنا
                        </button>
                      )}
                      
                      {/* تم التقييم */}
                      {isOrderReviewed(order.id) && (
                        <div className="mt-4 p-3 bg-purple-50 rounded-lg flex items-center gap-2 text-purple-700">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">شكراً! تم إرسال تقييمك</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    آخر تحديث: {new Date(order.updated_at).toLocaleDateString('ar-SA')}
                  </div>
                  <div className="flex gap-3">
                    {/* زر طلب الإلغاء - يظهر طول الوقت إلا عند انتهاء الطلب أو إلغاؤه */}
                    {order.status !== 'done' && order.status !== 'completed' && order.status !== 'تم الانتهاء بنجاح' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancellationRequest(order.id)}
                        disabled={cancellationInProgress === order.id || (order as any).cancellation_requested}
                        className={`text-sm font-medium px-3 py-2 rounded transition-colors ${
                          (order as any).cancellation_requested
                            ? 'bg-orange-100 text-orange-700 cursor-wait'
                            : 'text-red-600 hover:text-red-800 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        {(order as any).cancellation_requested
                          ? 'في انتظار قرار الإلغاء...'
                          : cancellationInProgress === order.id
                          ? 'جاري الإرسال...'
                          : 'طلب إلغاء'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Review Modal */}
      {selectedOrderForReview && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          orderId={selectedOrderForReview.id}
          serviceName={selectedOrderForReview.serviceName}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}