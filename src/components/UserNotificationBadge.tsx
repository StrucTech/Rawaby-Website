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
      
      // جلب رسائل العميل العادية
      const countResponse = await fetch('/api/user/notifications/unread', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let regularCount = 0;
      if (countResponse.ok) {
        const countData = await countResponse.json();
        regularCount = countData.unreadCount || 0;
      }

      // جلب إشعارات الإلغاء
      let cancellationCount = 0;
      try {
        const cancellationResponse = await fetch('/api/delegate-completion?status=unread', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (cancellationResponse.ok) {
          const data = await cancellationResponse.json();
          const clientNotifications = (data.notifications || []).filter(
            (n: any) => n.type === 'cancellation_approved' || n.type === 'cancellation_rejected'
          );
          cancellationCount = clientNotifications.length;
        }
      } catch (e) {
        console.log('No cancellation notifications');
      }

      // مجموع الإشعارات
      const totalCount = regularCount + cancellationCount;
      setUnreadCount(totalCount);

      // جلب الرسائل الحديثة فقط إذا كان هناك رسائل غير مقروءة
      if (totalCount > 0) {
        const messagesResponse = await fetch('/api/user/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const unreadNotifications = messagesData.notifications?.filter((n: Notification) => n.status === 'sent') || [];
          setRecentNotifications(unreadNotifications.slice(0, 3)); // أحدث 3 رسائل
        }
      }
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
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setShowDropdown(false);
                      router.push('/messages');
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
                        من: {notification.sender.name}
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