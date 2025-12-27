'use client';
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';
import Link from 'next/link';

interface UserPayload {
  userId: string;
  role: string;
  name: string;
  email: string;
}

export default function NotificationBadge() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decodedToken = jwt_decode<UserPayload>(token);
        setUserRole(decodedToken.role);
        
        // جلب عدد الرسائل غير المقروءة فقط للمندوبين
        if (decodedToken.role === 'delegate') {
          fetchUnreadCount();
          
          // تحديث كل 30 ثانية
          const interval = setInterval(fetchUnreadCount, 30000);
          return () => clearInterval(interval);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = Cookies.get('token');
      const res = await fetch('/api/notifications/unread', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
        setLatestNotification(data.latestNotification);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // عرض الإشعار فقط للمندوبين
  if (userRole !== 'delegate' || unreadCount === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* خلفية شفافة للإغلاق */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* قائمة الإشعارات */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-20">
            <div className="p-4 border-b bg-blue-50">
              <h3 className="font-semibold text-blue-900">
                📬 رسائل جديدة ({unreadCount})
              </h3>
            </div>
            
            <div className="p-4">
              {latestNotification ? (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-1">آخر رسالة:</div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium text-sm mb-1">
                      {latestNotification.subject}
                    </div>
                    <div className="text-xs text-gray-600">
                      من: {latestNotification.sender?.name} • 
                      {new Date(latestNotification.created_at).toLocaleString('ar-SA')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm mb-4">
                  لا توجد رسائل حديثة
                </div>
              )}
              
              <div className="space-y-2">
                <Link
                  href="/delegate/messages"
                  onClick={() => setShowDropdown(false)}
                  className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  📨 عرض جميع الرسائل
                </Link>
                
                <button
                  onClick={() => {
                    fetchUnreadCount();
                    setShowDropdown(false);
                  }}
                  className="block w-full bg-gray-100 text-gray-700 text-center py-2 rounded hover:bg-gray-200 transition-colors"
                >
                  🔄 تحديث
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}