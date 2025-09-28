'use client';
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  userId: string;
  role: string;
  name: string;
  email: string;
}

export default function DelegateMessagesPage() {
  const [delegateId, setDelegateId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<UserPayload>(token);
        if (decodedToken.role === 'delegate') {
          setDelegateId(decodedToken.userId);
        } else {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Invalid token:', error);
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    if (!delegateId) return;
    fetchNotifications();
  }, [delegateId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      const res = await fetch('/api/delegate/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async (notificationId: string) => {
    if (!replyMessage.trim()) {
      alert('يرجى كتابة الرد');
      return;
    }

    try {
      const token = Cookies.get('token');
      const res = await fetch('/api/delegate/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notificationId,
          reply: replyMessage
        })
      });

      if (res.ok) {
        alert('تم إرسال الرد بنجاح');
        setReplyingTo(null);
        setReplyMessage('');
        fetchNotifications();
      } else {
        const errorData = await res.json();
        alert('خطأ في إرسال الرد: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('حدث خطأ في إرسال الرد');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">رسائل من المشرف</h1>
        <p className="text-gray-600">الرسائل والاستفسارات الواردة من المشرف</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">جاري تحميل الرسائل...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📬</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد رسائل</h3>
          <p className="text-gray-500">لم تصلك أي رسائل من المشرف بعد</p>
        </div>
      ) : (
        <div className="space-y-6">
          {notifications.map(notification => (
            <div key={notification.id} className="bg-white rounded-lg shadow border p-6">
              {/* رأس الرسالة */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{notification.subject}</h3>
                  <div className="text-sm text-gray-600">
                    من: {notification.sender.name} • 
                    {new Date(notification.created_at).toLocaleString('ar-SA')}
                  </div>
                  <div className="text-sm text-gray-600">
                    طلب رقم: {notification.order_id.substring(0, 8)}...
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    notification.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {notification.priority === 'urgent' ? '🔥 عاجل' :
                     notification.priority === 'high' ? '⚡ مهم' :
                     notification.priority === 'low' ? '⬇️ منخفض' : '📋 عادي'}
                  </span>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    notification.status === 'replied' ? 'bg-green-100 text-green-800' :
                    notification.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {notification.status === 'replied' ? '✅ تم الرد' :
                     notification.status === 'read' ? '👁️ مقروء' : '📨 جديد'}
                  </span>
                </div>
              </div>

              {/* محتوى الرسالة */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4 border-l-4 border-blue-400">
                <div className="whitespace-pre-wrap">{notification.message}</div>
              </div>

              {/* الرد إن وجد */}
              {notification.reply ? (
                <div className="bg-green-50 p-4 rounded-lg mb-4 border-l-4 border-green-400">
                  <div className="text-sm text-green-700 mb-2 font-medium">
                    ردك - {new Date(notification.replied_at).toLocaleString('ar-SA')}
                  </div>
                  <div className="whitespace-pre-wrap">{notification.reply}</div>
                </div>
              ) : (
                // نموذج الرد
                <div>
                  {replyingTo === notification.id ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">كتابة الرد:</h4>
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="w-full p-3 border rounded-lg h-24 resize-none"
                        placeholder="اكتب ردك هنا..."
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => sendReply(notification.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
                        >
                          ✅ إرسال الرد
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyMessage('');
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                          ❌ إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setReplyingTo(notification.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
                      >
                        💬 الرد على الرسالة
                      </button>
                      
                      <button
                        onClick={() => window.open(`/order-details/${notification.order_id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        🔗 عرض تفاصيل الطلب
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}