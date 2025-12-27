'use client';
import React, { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useActiveStatusCheck } from '@/components/ActiveStatusChecker';

interface UserPayload {
  userId: string;
  role: string;
  name: string;
  email: string;
}

interface DataRequest {
  id: string;
  order_id: string;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  uploaded_files: any[];
  client_note?: string;
  created_at: string;
  responded_at?: string;
  supervisor_reply?: string;
  supervisor_replied_at?: string;
}

interface CompletionNotification {
  id: string;
  order_id: string;
  delegate_id: string;
  message: string;
  status: string;
  created_at: string;
  delegate?: {
    id: string;
    name: string;
    email: string;
  };
  orders?: {
    id: string;
    status: string;
    metadata: any;
    order_number?: string;
  };
}

export default function SupervisorDashboard() {
  // التحقق من حالة النشاط كل 30 ثانية
  useActiveStatusCheck({ checkInterval: 30000 });

  const [orders, setOrders] = useState<any[]>([]);
  const [delegates, setDelegates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const delegateSelectRef = useRef<{ [orderId: string]: HTMLSelectElement | null }>({});
  const statusSelectRef = useRef<{ [orderId: string]: HTMLSelectElement | null }>({});
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  
  // حالات نافذة طلب البيانات
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedOrderForMessage, setSelectedOrderForMessage] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // حالات عرض الملفات المرفوعة
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  // إشعارات إتمام المندوبين
  const [completionNotifications, setCompletionNotifications] = useState<CompletionNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // حالات رد المشرف على العميل
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedRequestForReply, setSelectedRequestForReply] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // جميع حالات الطلب (للعرض)
  const allOrderStatuses = [
    { value: 'تعيين مشرف', label: 'تعيين مشرف', color: 'bg-red-100 text-red-800' },
    { value: 'تعيين مندوب', label: 'تعيين مندوب', color: 'bg-orange-100 text-orange-800' },
    { value: 'تحت الإجراء', label: 'تحت الإجراء', color: 'bg-blue-100 text-blue-800' },
    { value: 'مطلوب بيانات إضافية أو مرفقات', label: 'مطلوب بيانات إضافية', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'بانتظار رد العميل', label: 'بانتظار رد العميل', color: 'bg-purple-100 text-purple-800' },
    { value: 'تم الانتهاء بنجاح', label: 'تم الانتهاء بنجاح', color: 'bg-green-100 text-green-800' },
  ];

  // الحالات المسموحة للمشرف لتغييرها (فقط بعد تعيين الطلب له)
  const supervisorAllowedStatuses = [
    { value: 'تحت الإجراء', label: 'تحت الإجراء', color: 'bg-blue-100 text-blue-800' },
    { value: 'مطلوب بيانات إضافية أو مرفقات', label: 'مطلوب بيانات إضافية', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'بانتظار رد العميل', label: 'بانتظار رد العميل', color: 'bg-purple-100 text-purple-800' },
    { value: 'تم الانتهاء بنجاح', label: 'تم الانتهاء بنجاح', color: 'bg-green-100 text-green-800' },
  ];

  // للتوافقية مع الكود القديم
  const orderStatuses = allOrderStatuses;

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<UserPayload>(token);
        setSupervisorId(decodedToken.userId);
      } catch (error) {
        console.error('Invalid token:', error);
        Cookies.remove('token');
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  // جلب إشعارات إتمام المندوبين
  const fetchCompletionNotifications = async () => {
    if (!supervisorId) return;
    
    setLoadingNotifications(true);
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      const res = await fetch('/api/delegate-completion?status=unread', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCompletionNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // تحديث حالة الإشعار وتغيير حالة الطلب
  const handleAcknowledgeCompletion = async (notificationId: string, orderId: string) => {
    if (!confirm('هل تريد الموافقة على إتمام المهمة وتغيير حالة الطلب إلى "تم الانتهاء بنجاح"؟')) {
      return;
    }
    
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      // تحديث حالة الإشعار
      await fetch('/api/delegate-completion', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId, status: 'acknowledged' })
      });
      
      // تغيير حالة الطلب
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'تم الانتهاء بنجاح' })
      });
      
      // تحديث القوائم
      setCompletionNotifications(prev => prev.filter(n => n.id !== notificationId));
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return { ...order, status: 'تم الانتهاء بنجاح' };
        }
        return order;
      }));
      
      alert('تم تأكيد إتمام المهمة وتغيير حالة الطلب بنجاح');
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ');
    }
  };

  // تجاهل الإشعار
  const handleDismissNotification = async (notificationId: string) => {
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      await fetch('/api/delegate-completion', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId, status: 'read' })
      });
      
      setCompletionNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // جلب الإشعارات عند تحميل الصفحة
  useEffect(() => {
    if (supervisorId) {
      fetchCompletionNotifications();
    }
  }, [supervisorId]);



  useEffect(() => {
    if (!supervisorId) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('token');
        if (!token) {
          console.error('No token found');
          return;
        }
        
        // جلب الطلبات والمندوبين معًا
        // سنجلب جميع الطلبات وسنقوم بالفلترة في الواجهة
        const [ordersRes, delegatesRes] = await Promise.all([
          fetch('/api/orders?role=supervisor', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/delegates', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        const ordersData = await ordersRes.json();
        const delegatesData = await delegatesRes.json();
        
        if (ordersRes.ok) {
          setOrders(ordersData.orders || []);
        }
        
        if (delegatesRes.ok) {
          setDelegates(delegatesData.delegates || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [supervisorId]); // فقط supervisorId

  // تعيين مهمة لمندوب
  const handleAssign = async (orderId: string) => {
    const delegateId = delegateSelectRef.current[orderId]?.value;
    if (!delegateId || !supervisorId) return;

    setAssigning(orderId);
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ staffId: delegateId, status: 'تحت الإجراء' }),
      });
      
      if (res.ok) {
        const response = await res.json();
        // تحديث الطلب محليًا بدلاً من إعادة جلب كل الطلبات
        setOrders(prev => prev.map(order => {
          if (order.id === orderId) {
            return { 
              ...order, 
              assigned_delegate_id: delegateId,
              assigned_supervisor_id: supervisorId, // إضافة المشرف المسؤول
              status: 'تحت الإجراء',
              assigned_at: new Date().toISOString()
            };
          }
          return order;
        }));
        
        // إعادة تحميل البيانات للتأكد من التحديث
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error('Failed to assign task');
      }
    } catch (error) {
      console.error('Error assigning task:', error);
    } finally {
      setAssigning(null);
    }
  };

  // أخذ الطلب (تعيين المشرف نفسه للطلب) - يغير الحالة تلقائياً إلى "تعيين مندوب"
  const handleTakeOrder = async (orderId: string) => {
    if (!supervisorId) return;

    setAssigning(orderId);
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          assigned_supervisor_id: supervisorId,
          status: 'تعيين مندوب' // تغيير الحالة تلقائياً
        }),
      });
      
      if (res.ok) {
        // تحديث الطلب محليًا
        setOrders(prev => prev.map(order => {
          if (order.id === orderId) {
            return { 
              ...order, 
              assigned_supervisor_id: supervisorId,
              status: 'تعيين مندوب',
              assigned_at: new Date().toISOString()
            };
          }
          return order;
        }));
        
        alert('تم أخذ الطلب بنجاح! يمكنك الآن تعيين مندوب أو تغيير الحالة.');
      } else {
        const errorData = await res.json();
        alert(`خطأ: ${errorData.error || 'فشل في أخذ الطلب'}`);
      }
    } catch (error) {
      console.error('Error taking order:', error);
      alert('حدث خطأ أثناء أخذ الطلب');
    } finally {
      setAssigning(null);
    }
  };

  // تحديث حالة الطلب
  const handleStatusUpdate = async (orderId: string) => {
    const newStatus = statusSelectRef.current[orderId]?.value;
    if (!newStatus || !supervisorId) return;

    setUpdatingStatus(orderId);
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const responseData = await res.json();
      
      if (res.ok) {
        // تحديث الطلب محليًا
        setOrders(prev => prev.map(order => {
          if (order.id === orderId) {
            return { 
              ...order, 
              status: newStatus,
              updated_at: new Date().toISOString()
            };
          }
          return order;
        }));
        
        console.log('Status updated successfully:', responseData);
      } else {
        console.error('Failed to update status:', responseData);
        alert(`خطأ: ${responseData.error || 'فشل في تحديث الحالة'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('حدث خطأ أثناء تحديث الحالة');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // فتح نافذة مراسلة العميل
  const openMessageModal = (orderId: string) => {
    setSelectedOrderForMessage(orderId);
    setMessageText('');
    setShowMessageModal(true);
  };

  // إرسال طلب بيانات إضافية للعميل
  const handleSendDataRequest = async () => {
    if (!selectedOrderForMessage || !messageText.trim()) {
      alert('يرجى كتابة الرسالة');
      return;
    }

    setSendingMessage(true);
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const res = await fetch(`/api/orders/${selectedOrderForMessage}/data-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageText.trim() })
      });

      const data = await res.json();

      if (res.ok) {
        alert('تم إرسال طلب البيانات للعميل بنجاح');
        setShowMessageModal(false);
        setMessageText('');
        setSelectedOrderForMessage(null);
        
        // تحديث حالة الطلب محلياً
        setOrders(prev => prev.map(order => {
          if (order.id === selectedOrderForMessage) {
            return { ...order, status: 'بانتظار رد العميل' };
          }
          return order;
        }));
      } else {
        alert(`خطأ: ${data.error || 'فشل في إرسال الطلب'}`);
      }
    } catch (error) {
      console.error('Error sending data request:', error);
      alert('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSendingMessage(false);
    }
  };

  // جلب طلبات البيانات وعرض الملفات
  const fetchDataRequests = async (orderId: string) => {
    setLoadingRequests(true);
    setSelectedOrderForMessage(orderId);
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const res = await fetch(`/api/orders/${orderId}/data-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDataRequests(data.requests || []);
        setShowFilesModal(true);
      }
    } catch (error) {
      console.error('Error fetching data requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // إغلاق طلب البيانات بعد المراجعة
  const handleCloseDataRequest = async (requestId: string) => {
    if (!selectedOrderForMessage) return;
    
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const res = await fetch(`/api/orders/${selectedOrderForMessage}/data-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert('تم إغلاق الطلب بنجاح');
        // تحديث القائمة
        setDataRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: 'closed' } : req
        ));
        // تحديث حالة الطلب الرئيسي
        setOrders(prev => prev.map(order => {
          if (order.id === selectedOrderForMessage) {
            return { ...order, status: 'تحت الإجراء' };
          }
          return order;
        }));
      }
    } catch (error) {
      console.error('Error closing request:', error);
    }
  };

  // الرد على طلب البيانات (المشرف يرد على رسالة العميل)
  const handleSendReply = async () => {
    if (!selectedRequestForReply || !replyMessage.trim()) {
      alert('يرجى كتابة الرد');
      return;
    }

    setSendingReply(true);
    try {
      const token = Cookies.get('token');
      if (!token) return;

      // يجب إيجاد orderId من البيانات - نفترض أنها محفوظة في السياق
      const currentRequest = dataRequests.find(r => r.id === selectedRequestForReply);
      if (!currentRequest) {
        alert('طلب غير موجود');
        setSendingReply(false);
        return;
      }

      const res = await fetch(`/api/orders/${currentRequest.order_id}/data-requests/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          requestId: selectedRequestForReply,
          replyMessage: replyMessage.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('تم إرسال الرد للعميل بنجاح');
        setShowReplyModal(false);
        setReplyMessage('');
        setSelectedRequestForReply(null);
        
        // تحديث قائمة الطلبات
        setDataRequests(prev => prev.map(req => 
          req.id === selectedRequestForReply 
            ? { ...req, supervisor_reply: replyMessage, supervisor_replied_at: new Date().toISOString() }
            : req
        ));
      } else {
        alert(`خطأ: ${data.error || 'فشل في إرسال الرد'}`);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('حدث خطأ أثناء إرسال الرد');
    } finally {
      setSendingReply(false);
    }
  };

  // الحصول على معلومات الحالة
  const getStatusInfo = (status: string) => {
    const statusInfo = orderStatuses.find(s => s.value === status);
    return statusInfo || { value: status, label: status, color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">لوحة توزيع المهام على المندوبين</h2>
      </div>
      
      {/* قسم إشعارات إتمام المندوبين */}
      {completionNotifications.length > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
              🔔 إشعارات إتمام المهام ({completionNotifications.length})
            </h3>
            <button
              onClick={fetchCompletionNotifications}
              className="text-green-600 hover:text-green-800 text-sm"
              disabled={loadingNotifications}
            >
              {loadingNotifications ? 'جاري التحديث...' : '↻ تحديث'}
            </button>
          </div>
          
          <div className="space-y-3">
            {completionNotifications.map((notification) => (
              <div key={notification.id} className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-green-700">
                      المندوب <strong>{notification.delegate?.name || 'غير محدد'}</strong> يبلغ بإتمام المهمة
                    </p>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      🔢 رقم الطلب: #{notification.order_id.substring(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleString('ar-SA')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcknowledgeCompletion(notification.id, notification.order_id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      ✓ تأكيد الإتمام
                    </button>
                    <button
                      onClick={() => handleDismissNotification(notification.id)}
                      className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-400"
                    >
                      تجاهل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {loading ? <div>جاري التحميل...</div> : (
        <div>
          <div className="mb-4 flex gap-2">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'جاري التحميل...' : 'تحديث الطلبات'}
            </button>
            <div className="text-sm text-gray-600 flex items-center">
              عدد الطلبات: {orders.length} | عدد المندوبين: {delegates.length}
            </div>
          </div>
          
          <table className="w-full border rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">العنوان</th>
              <th className="p-2">العميل</th>
              <th className="p-2">الحالة</th>
              <th className="p-2">المندوب المُعيّن</th>
              <th className="p-2">نُفذت بواسطة</th>
              <th className="p-2">تفاصيل</th>
              <th className="p-2">مراسلة العميل</th>
              <th className="p-2">تحديث الحالة</th>
              <th className="p-2">تعيين لمندوب</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={9} className="text-center p-4">لا توجد مهام حالياً</td></tr>
            ) : orders.map(order => {
              // استخراج البيانات من الحقول الجديدة والـ metadata
              let guardianName = 'غير محدد';
              let assignedDelegateId = order.assigned_delegate_id;
              let completedByDelegateId = null;
              
              try {
                // استخراج اسم الوالد من metadata
                const metadata = order.metadata ? (typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata) : {};
                guardianName = metadata.guardianInfo?.fullName || 'غير محدد';
                // في حالة وجود بيانات إضافية في metadata
                completedByDelegateId = metadata.completedBy || null;
              } catch (e) {
                console.log('Could not parse order metadata');
              }
              
              // العثور على اسم المندوب المُعيّن
              const assignedDelegate = assignedDelegateId ? 
                delegates.find((d: any) => d.id === assignedDelegateId) : null;
              
              // العثور على اسم المندوب الذي أكمل المهمة
              const completedByDelegate = completedByDelegateId ? 
                delegates.find((d: any) => d.id === completedByDelegateId) : null;
              
              return (
              <tr key={order.id}>
                <td className="p-2">{'طلب رقم ' + order.id.slice(0, 8)}</td>
                <td className="p-2">{guardianName}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm ${getStatusInfo(order.status).color}`}>
                    {getStatusInfo(order.status).label}
                  </span>
                </td>
                <td className="p-2">
                  {assignedDelegate ? (
                    <span className="text-green-600 font-medium">{assignedDelegate.name}</span>
                  ) : (
                    <span className="text-gray-400">غير معين</span>
                  )}
                </td>
                <td className="p-2">
                  {order.status === 'completed' && completedByDelegate ? (
                    <div className="text-blue-600 bg-blue-100 px-2 py-1 rounded text-sm font-medium">
                      ✓ {completedByDelegate.name}
                    </div>
                  ) : order.status === 'completed' ? (
                    <span className="text-green-600 text-sm">تم الإنجاز</span>
                  ) : (
                    <span className="text-gray-400 text-sm">لم تكتمل</span>
                  )}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => window.open(`/order-details/${order.id}`, '_blank')}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    عرض التفاصيل
                  </button>
                </td>
                {/* عمود مراسلة العميل - مفعل فقط عند حالة "مطلوب بيانات إضافية" */}
                <td className="p-2">
                  {order.assigned_supervisor_id === supervisorId ? (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => openMessageModal(order.id)}
                        className={`px-2 py-1 rounded text-xs ${
                          order.status === 'مطلوب بيانات إضافية أو مرفقات' 
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={order.status === 'مطلوب بيانات إضافية أو مرفقات' 
                          ? "طلب بيانات إضافية من العميل" 
                          : "يجب تغيير الحالة إلى 'مطلوب بيانات إضافية' أولاً"}
                        disabled={order.status !== 'مطلوب بيانات إضافية أو مرفقات'}
                      >
                        📝 طلب بيانات
                      </button>
                      {(order.status === 'مطلوب بيانات إضافية أو مرفقات' || order.status === 'بانتظار رد العميل') && (
                        <button
                          onClick={() => fetchDataRequests(order.id)}
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-xs"
                          title="عرض الملفات المرفوعة"
                        >
                          📁 عرض الملفات
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="p-2">
                  <div className="flex gap-2 items-center">
                    <select 
                      ref={el => { statusSelectRef.current[order.id] = el; }} 
                      className="border p-1 rounded text-sm"
                      defaultValue={order.status}
                      disabled={order.assigned_supervisor_id !== supervisorId}
                    >
                      {/* إذا كان الطلب مُعيّن للمشرف، إظهار الحالات المسموحة فقط */}
                      {order.assigned_supervisor_id === supervisorId ? (
                        supervisorAllowedStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))
                      ) : (
                        // إظهار الحالة الحالية فقط إذا لم يكن مُعيّن
                        <option value={order.status}>{getStatusInfo(order.status).label}</option>
                      )}
                    </select>
                    <button 
                      className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 disabled:bg-gray-400 text-sm" 
                      disabled={updatingStatus === order.id || order.assigned_supervisor_id !== supervisorId} 
                      onClick={() => handleStatusUpdate(order.id)}
                      title={order.assigned_supervisor_id !== supervisorId ? 'يجب أن يُعيّن الطلب لك أولاً' : ''}
                    >
                      {updatingStatus === order.id ? 'تحديث...' : 'تحديث'}
                    </button>
                  </div>
                </td>
                <td className="p-2 flex gap-2 items-center">
                  {assignedDelegate ? (
                    <div className="text-green-600 bg-green-100 px-3 py-2 rounded">
                      مُكلف للمندوب: {assignedDelegate.name}
                    </div>
                  ) : order.assigned_supervisor_id && order.assigned_supervisor_id !== supervisorId ? (
                    <div className="text-orange-600 bg-orange-100 px-3 py-2 rounded text-sm">
                      معين لمشرف آخر
                    </div>
                  ) : !order.assigned_supervisor_id ? (
                    // زر أخذ الطلب إذا لم يكن مُعيّن لأي مشرف
                    <button 
                      className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400" 
                      disabled={assigning === order.id} 
                      onClick={() => handleTakeOrder(order.id)}
                    >
                      {assigning === order.id ? 'جاري الأخذ...' : 'أخذ الطلب'}
                    </button>
                  ) : (
                    // إذا كان الطلب مُعيّن للمشرف الحالي، يمكنه تعيين مندوب
                    <>
                      <select ref={el => { delegateSelectRef.current[order.id] = el; }} className="border p-2 rounded">
                        <option value="">اختر مندوب</option>
                        {delegates.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                        ))}
                      </select>
                      <button 
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-400" 
                        disabled={assigning === order.id} 
                        onClick={() => handleAssign(order.id)}
                      >
                        {assigning === order.id ? 'جاري التعيين...' : 'تعيين'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}

      {/* نافذة عرض الملفات المرفوعة */}
      {showFilesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">طلبات البيانات والملفات المرفوعة</h3>
              <button
                onClick={() => {
                  setShowFilesModal(false);
                  setDataRequests([]);
                  setSelectedOrderForMessage(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {loadingRequests ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : dataRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد طلبات بيانات لهذا الطلب
              </div>
            ) : (
              <div className="space-y-4">
                {dataRequests.map((req) => (
                  <div key={req.id} className={`border rounded-lg p-4 ${
                    req.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                    req.status === 'responded' ? 'bg-green-50 border-green-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          req.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                          req.status === 'responded' ? 'bg-green-200 text-green-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {req.status === 'pending' ? 'في انتظار الرد' :
                           req.status === 'responded' ? 'تم الرد' : 'مغلق'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(req.created_at).toLocaleString('ar-SA')}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3 bg-white p-2 rounded border">
                      <strong>طلبك:</strong> {req.message}
                    </p>
                    
                    {req.status === 'responded' && (
                      <>
                        {req.client_note && (
                          <p className="text-gray-600 mb-2 text-sm">
                            <strong>ملاحظة العميل:</strong> {req.client_note}
                          </p>
                        )}
                        
                        {req.uploaded_files && req.uploaded_files.length > 0 && (
                          <div className="mb-3">
                            <strong className="text-sm">الملفات المرفوعة:</strong>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {req.uploaded_files.map((file: any, index: number) => (
                                <a
                                  key={index}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-white border rounded hover:bg-blue-50"
                                >
                                  <span className="text-2xl">
                                    {file.type?.includes('image') ? '🖼️' :
                                     file.type?.includes('pdf') ? '📄' : '📁'}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* رد المشرف إن كان موجود */}
                        {req.supervisor_reply && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                            <p className="text-sm font-medium text-blue-800 mb-2">💬 ردك على العميل:</p>
                            <p className="text-sm text-gray-700">{req.supervisor_reply}</p>
                            {req.supervisor_replied_at && (
                              <p className="text-xs text-blue-600 mt-2">
                                في {new Date(req.supervisor_replied_at).toLocaleString('ar-EG')}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          {!req.supervisor_reply && (
                            <button
                              onClick={() => {
                                setSelectedRequestForReply(req.id);
                                setReplyMessage('');
                                setShowReplyModal(true);
                              }}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              💬 رد على العميل
                            </button>
                          )}
                          <button
                            onClick={() => handleCloseDataRequest(req.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            ✓ إغلاق الطلب (تم المراجعة)
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة إرسال طلب بيانات */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">طلب بيانات إضافية من العميل</h3>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="اكتب رسالتك للعميل... مثال: نحتاج صورة من شهادة الميلاد"
              rows={5}
              className="w-full border rounded p-3 mb-4 resize-none"
              dir="rtl"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setMessageText('');
                  setSelectedOrderForMessage(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                إلغاء
              </button>
              <button
                onClick={handleSendDataRequest}
                disabled={sendingMessage || !messageText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {sendingMessage ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة رد المشرف على العميل */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">الرد على العميل</h3>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="اكتب ردك على ملاحظات/أسئلة العميل..."
              rows={5}
              className="w-full border rounded p-3 mb-4 resize-none"
              dir="rtl"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyMessage('');
                  setSelectedRequestForReply(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                إلغاء
              </button>
              <button
                onClick={handleSendReply}
                disabled={sendingReply || !replyMessage.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {sendingReply ? 'جاري الإرسال...' : 'إرسال الرد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}