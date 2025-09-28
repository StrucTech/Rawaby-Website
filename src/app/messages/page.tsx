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

interface Order {
  id: string;
  service_ids: string[];
  client_id: string;
  metadata: {
    client_name?: string;
    client_email?: string;
    student_name?: string;
    student_grade?: string;
  };
}

interface Notification {
  id: string;
  order_id: string;
  sender_id: string;
  recipient_id: string;
  type: string;
  subject: string;
  message: string;
  reply?: string;
  status: string;
  priority: string;
  created_at: string;
  replied_at?: string;
  read_at?: string;
  sender: User;
  recipient: User;
  orders: Order;
}

export default function UserMessages() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [sendingReply, setSendingReply] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/messages');
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('خطأ في جلب الرسائل:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/user/messages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      });
      
      // تحديث الحالة محلياً
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'read', read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('خطأ في تحديث حالة القراءة:', error);
    }
  };

  const handleReply = async (notificationId: string) => {
    if (!replyText.trim()) {
      alert('يرجى كتابة الرد');
      return;
    }

    setSendingReply(true);
    try {
      const response = await fetch('/api/user/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationId,
          reply: replyText
        })
      });

      if (response.ok) {
        alert('تم إرسال الرد بنجاح');
        setReplyText('');
        setReplyingTo(null);
        fetchNotifications(); // إعادة تحميل الرسائل
      } else {
        const error = await response.json();
        alert(`خطأ في إرسال الرد: ${error.error}`);
      }
    } catch (error) {
      console.error('خطأ في إرسال الرد:', error);
      alert('خطأ في إرسال الرد');
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG');
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'customer_update': 'تحديث من المشرف',
      'customer_inquiry': 'استفسار من المشرف',
      'message': 'رسالة عامة'
    };
    return types[type] || type;
  };

  const getPriorityLabel = (priority: string) => {
    const priorities: { [key: string]: string } = {
      'low': 'منخفضة',
      'normal': 'عادية',
      'high': 'عالية',
      'urgent': 'عاجلة'
    };
    return priorities[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'low': 'text-gray-600 bg-gray-100',
      'normal': 'text-blue-600 bg-blue-100',
      'high': 'text-yellow-600 bg-yellow-100',
      'urgent': 'text-red-600 bg-red-100'
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">رسائل المشرفين</h1>
          
          {notifications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-6xl text-gray-400 mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد رسائل</h3>
              <p className="text-gray-600">لم تستلم أي رسائل من المشرفين حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-6">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`border rounded-lg p-6 ${
                    notification.status === 'sent' ? 'border-blue-200 bg-blue-50' :
                    notification.status === 'read' ? 'border-gray-200 bg-white' :
                    'border-green-200 bg-green-50'
                  }`}
                  onClick={() => {
                    if (notification.status === 'sent') {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  {/* رأس الرسالة */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 space-x-reverse mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.subject}
                        </h3>
                        {notification.status === 'sent' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            جديد
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
                        <span>من: {notification.sender.name}</span>
                        <span>•</span>
                        <span>{getTypeLabel(notification.type)}</span>
                        <span>•</span>
                        <span>الطالب: {notification.orders?.metadata?.student_name || 'غير محدد'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                        {getPriorityLabel(notification.priority)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* محتوى الرسالة */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                    <p className="text-gray-700 leading-relaxed">{notification.message}</p>
                  </div>

                  {/* الرد إذا كان موجوداً */}
                  {notification.reply && (
                    <div className="bg-green-100 p-4 rounded-lg border-r-4 border-green-400 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-green-800">ردك:</span>
                        <span className="text-xs text-green-600">
                          {notification.replied_at && formatDate(notification.replied_at)}
                        </span>
                      </div>
                      <p className="text-green-700">{notification.reply}</p>
                    </div>
                  )}

                  {/* منطقة الرد */}
                  {!notification.reply && (
                    <div className="border-t border-gray-200 pt-4">
                      {replyingTo === notification.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="اكتب ردك هنا..."
                            rows={4}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex space-x-3 space-x-reverse">
                            <button
                              onClick={() => handleReply(notification.id)}
                              disabled={sendingReply}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                            >
                              {sendingReply ? 'جاري الإرسال...' : 'إرسال الرد'}
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(notification.id)}
                          className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          رد على الرسالة
                        </button>
                      )}
                    </div>
                  )}

                  {/* حالة الرسالة */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                      {notification.read_at && (
                        <span>قُرئت في: {formatDate(notification.read_at)}</span>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      notification.status === 'replied' ? 'bg-green-100 text-green-800' :
                      notification.status === 'read' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {notification.status === 'replied' ? 'تم الرد' :
                       notification.status === 'read' ? 'مقروءة' : 'جديدة'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}