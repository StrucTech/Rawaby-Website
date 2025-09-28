'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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
  sender: User;
  recipient: User;
  orders: Order;
}

export default function SupervisorCustomerMessages() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [messageType, setMessageType] = useState<string>('customer_update');
  const [priority, setPriority] = useState<string>('normal');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const router = useRouter();

  // جلب جميع الطلبات
  useEffect(() => {
    fetchOrders();
    fetchNotifications();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await fetch('/api/supervisor/orders', {
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('خطأ في جلب الطلبات:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await fetch('/api/supervisor/customer-messages');
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('خطأ في جلب الرسائل:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // عند تغيير الطلب المختار
  const handleOrderChange = (orderId: string) => {
    setSelectedOrder(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedCustomer(order.client_id);
    }
  };

  // إرسال رسالة جديدة
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder || !selectedCustomer || !subject || !message) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/supervisor/customer-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: selectedOrder,
          customerId: selectedCustomer,
          subject,
          message,
          type: messageType,
          priority
        })
      });

      if (response.ok) {
        alert('تم إرسال الرسالة بنجاح');
        setSubject('');
        setMessage('');
        setSelectedOrder('');
        setSelectedCustomer('');
        fetchNotifications(); // إعادة تحميل الرسائل
      } else {
        const error = await response.json();
        alert(`خطأ في إرسال الرسالة: ${error.error}`);
      }
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      alert('خطأ في إرسال الرسالة');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG');
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'customer_update': 'تحديث للعميل',
      'customer_inquiry': 'استفسار للعميل',
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

  if (loadingOrders && loadingNotifications) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">رسائل العملاء</h1>
          
          {/* نموذج إرسال رسالة جديدة */}
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h2 className="text-lg font-semibold mb-4">إرسال رسالة جديدة للعميل</h2>
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              {/* اختيار الطلب */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختيار الطلب
                </label>
                <select
                  value={selectedOrder}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر طلب</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.metadata.client_name || 'عميل غير محدد'} - {order.metadata.student_name || 'طالب غير محدد'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* نوع الرسالة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع الرسالة
                  </label>
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="customer_update">تحديث للعميل</option>
                    <option value="customer_inquiry">استفسار للعميل</option>
                    <option value="message">رسالة عامة</option>
                  </select>
                </div>

                {/* أولوية الرسالة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الأولوية
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">منخفضة</option>
                    <option value="normal">عادية</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة</option>
                  </select>
                </div>
              </div>

              {/* عنوان الرسالة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان الرسالة
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل عنوان الرسالة"
                  required
                />
              </div>

              {/* محتوى الرسالة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  محتوى الرسالة
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل محتوى الرسالة"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال الرسالة'}
              </button>
            </form>
          </div>

          {/* قائمة الرسائل المرسلة */}
          <div>
            <h2 className="text-lg font-semibold mb-4">الرسائل المرسلة والردود</h2>
            
            {loadingNotifications ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">جاري تحميل الرسائل...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">لا توجد رسائل حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{notification.subject}</h3>
                        <p className="text-sm text-gray-600">
                          إلى: {notification.recipient.name} ({notification.recipient.email})
                        </p>
                        <p className="text-sm text-gray-500">
                          الطلب: {notification.orders.metadata.student_name || 'غير محدد'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                          {getPriorityLabel(notification.priority)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getTypeLabel(notification.type)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded mb-3">
                      <p className="text-gray-700">{notification.message}</p>
                    </div>
                    
                    {notification.reply && (
                      <div className="bg-green-50 p-3 rounded border-r-4 border-green-400">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-green-800">رد العميل:</span>
                          <span className="text-xs text-green-600">
                            {notification.replied_at && formatDate(notification.replied_at)}
                          </span>
                        </div>
                        <p className="text-green-700">{notification.reply}</p>
                      </div>
                    )}
                    
                    <div className="mt-3 flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.status === 'replied' ? 'bg-green-100 text-green-800' :
                        notification.status === 'read' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {notification.status === 'replied' ? 'تم الرد' :
                         notification.status === 'read' ? 'مقروءة' : 'مرسلة'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}