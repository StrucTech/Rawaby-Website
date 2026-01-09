'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Notification {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  sender: User;
  type?: string;
  order_id?: string;
}

interface DataRequest {
  id: string;
  order_id: string;
  message: string;
  status: string;
  created_at: string;
  supervisor?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function UserNotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  // التحقق من دور المستخدم
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (error) {
        console.error('خطأ في فك تشفير الـ token:', error);
      }
    }
  }, []);

  // جلب عدد الرسائل غير المقروءة
  const fetchUnreadCount = async () => {
    if (userRole !== 'user') return;
    
    try {
      const token = Cookies.get('token');
      const allNotifications: Notification[] = [];
      
      // أولاً: جلب طلبات البيانات المنتظرة (هذا هو المصدر الرئيسي للإشعارات)
      try {
        const dataRequestsResponse = await fetch('/api/user/data-requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (dataRequestsResponse.ok) {
          const data = await dataRequestsResponse.json();
          console.log('Data requests response:', data);
          const pendingRequests = (data.requests || []).filter((r: DataRequest) => r.status === 'pending');
          console.log('Pending requests:', pendingRequests);
          // تحويل طلبات البيانات إلى صيغة Notification
          pendingRequests.forEach((req: DataRequest) => {
            allNotifications.push({
              id: req.id,
              subject: '📋 طلب بيانات من المشرف',
              message: req.message,
              status: 'sent',
              priority: 'high',
              created_at: req.created_at,
              sender: req.supervisor || { id: '', name: 'المشرف', email: '' },
              type: 'data_request',
              order_id: req.order_id
            });
          });
        }
      } catch (e) {
        console.log('Error fetching data requests:', e);
      }

      // جلب إشعارات الإلغاء
      try {
        const cancellationResponse = await fetch('/api/delegate-completion?status=unread', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (cancellationResponse.ok) {
          const data = await cancellationResponse.json();
          const clientNotifications = (data.notifications || []).filter(
            (n: any) => n.type === 'cancellation_approved' || n.type === 'cancellation_rejected'
          );
          // إضافة إشعارات الإلغاء
          clientNotifications.forEach((n: any) => {
            allNotifications.push({
              id: n.id,
              subject: n.type === 'cancellation_approved' ? '✅ تمت الموافقة على الإلغاء' : '❌ تم رفض طلب الإلغاء',
              message: n.message || '',
              status: 'sent',
              priority: 'normal',
              created_at: n.created_at,
              sender: { id: '', name: 'النظام', email: '' },
              type: n.type
            });
          });
        }
      } catch (e) {
        console.log('No cancellation notifications');
      }
        
      // جلب الرسائل العادية
      try {
        const messagesResponse = await fetch('/api/user/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const unreadNotifications = messagesData.notifications?.filter((n: Notification) => n.status === 'sent') || [];
          allNotifications.push(...unreadNotifications);
        }
      } catch (e) {
        console.log('Error fetching messages:', e);
      }
      
      // ترتيب حسب التاريخ
      allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // تحديث العداد والقائمة
      setUnreadCount(allNotifications.length);
      setRecentNotifications(allNotifications.slice(0, 5)); // أحدث 5 رسائل
      
      console.log('Total notifications:', allNotifications.length);
      console.log('Recent notifications:', allNotifications.slice(0, 5));
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
    }
  };

  useEffect(() => {
    if (userRole === 'user') {
      fetchUnreadCount();
      // تحديث كل 30 ثانية
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  // لا نعرض شيئاً إذا لم يكن المستخدم عميل أو لا توجد رسائل غير مقروءة
  if (userRole !== 'user' || unreadCount === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'low': 'text-gray-600',
      'normal': 'text-blue-600',
      'high': 'text-yellow-600',
      'urgent': 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  return (
    <div className="relative">
      {/* أيقونة الإشعارات مع العداد */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* عداد الرسائل غير المقروءة */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* القائمة المنسدلة */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                الرسائل الجديدة ({unreadCount})
              </h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  لا توجد رسائل جديدة
                </div>
              ) : (
                recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      notification.type === 'data_request' ? 'bg-yellow-50' : ''
                    }`}
                    onClick={() => {
                      setShowDropdown(false);
                      // إذا كان طلب بيانات، اذهب لصفحة الرسائل/طلبات البيانات
                      if (notification.type === 'data_request') {
                        router.push('/messages');
                      } else {
                        router.push('/messages');
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {notification.subject}
                      </h4>
                      <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                        ●
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {truncateMessage(notification.message)}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        من: {notification.sender?.name || 'المشرف'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  router.push('/messages');
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                عرض جميع الرسائل
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}