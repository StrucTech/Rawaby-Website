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

export default function SupervisorMessagesPage() {
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  
  // نموذج الرسالة
  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: '',
    type: 'question',
    priority: 'normal'
  });

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<UserPayload>(token);
        if (decodedToken.role === 'supervisor') {
          setSupervisorId(decodedToken.userId);
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
    if (!supervisorId) return;
    fetchSupervisorOrders();
  }, [supervisorId]);

  const fetchSupervisorOrders = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      const res = await fetch(`/api/orders?supervisorId=${supervisorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (orderId: string) => {
    try {
      const token = Cookies.get('token');
      const res = await fetch(`/api/supervisor/notifications?orderId=${orderId}`, {
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
    }
  };

  const handleOrderSelect = (order: any) => {
    setSelectedOrder(order);
    fetchNotifications(order.id);
  };

  const sendMessage = async () => {
    if (!selectedOrder || !messageForm.subject || !messageForm.message) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const token = Cookies.get('token');
      const res = await fetch('/api/supervisor/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          recipientId: selectedOrder.assigned_delegate_id,
          ...messageForm
        })
      });

      if (res.ok) {
        alert('تم إرسال الرسالة بنجاح');
        setShowMessageForm(false);
        setMessageForm({
          subject: '',
          message: '',
          type: 'question',
          priority: 'normal'
        });
        fetchNotifications(selectedOrder.id);
      } else {
        const errorData = await res.json();
        alert('خطأ في إرسال الرسالة: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('حدث خطأ في إرسال الرسالة');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">رسائل المشرف</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قائمة الطلبات */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">طلباتي المُشرف عليها</h2>
          
          {loading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-4 text-gray-500">لا توجد طلبات</div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div
                  key={order.id}
                  onClick={() => handleOrderSelect(order)}
                  className={`p-4 rounded border cursor-pointer transition-colors ${
                    selectedOrder?.id === order.id 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">
                    طلب {order.id.substring(0, 8)}...
                  </div>
                  <div className="text-sm text-gray-600">
                    الحالة: {order.status}
                  </div>
                  <div className="text-sm text-gray-600">
                    المندوب: {order.assigned_delegate?.name || 'غير محدد'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* تفاصيل الطلب والرسائل */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {!selectedOrder ? (
            <div className="text-center py-8 text-gray-500">
              اختر طلباً من القائمة لعرض الرسائل
            </div>
          ) : (
            <>
              {/* معلومات الطلب */}
              <div className="mb-6 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">
                  طلب رقم {selectedOrder.id.substring(0, 8)}...
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>الحالة:</strong> {selectedOrder.status}
                  </div>
                  <div>
                    <strong>المندوب:</strong> {selectedOrder.assigned_delegate?.name || 'غير محدد'}
                  </div>
                  <div>
                    <strong>إجمالي السعر:</strong> {selectedOrder.total_price} ريال
                  </div>
                  <div>
                    <strong>تاريخ الإنشاء:</strong> {new Date(selectedOrder.created_at).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setShowMessageForm(true)}
                  disabled={!selectedOrder.assigned_delegate_id}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  📝 إرسال رسالة
                </button>
                {!selectedOrder.assigned_delegate_id && (
                  <span className="text-sm text-red-600 flex items-center">
                    ⚠️ لم يتم تعيين مندوب لهذا الطلب
                  </span>
                )}
              </div>

              {/* نموذج إرسال الرسالة */}
              {showMessageForm && (
                <div className="mb-6 p-4 border border-blue-200 rounded bg-blue-50">
                  <h4 className="font-semibold mb-3">إرسال رسالة جديدة</h4>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">نوع الرسالة</label>
                        <select
                          value={messageForm.type}
                          onChange={(e) => setMessageForm({...messageForm, type: e.target.value})}
                          className="w-full p-2 border rounded"
                        >
                          <option value="question">سؤال</option>
                          <option value="request">طلب معلومات</option>
                          <option value="message">رسالة عامة</option>
                          <option value="update">طلب تحديث</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">الأولوية</label>
                        <select
                          value={messageForm.priority}
                          onChange={(e) => setMessageForm({...messageForm, priority: e.target.value})}
                          className="w-full p-2 border rounded"
                        >
                          <option value="low">منخفضة</option>
                          <option value="normal">عادية</option>
                          <option value="high">عالية</option>
                          <option value="urgent">عاجلة</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">عنوان الرسالة</label>
                      <input
                        type="text"
                        value={messageForm.subject}
                        onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                        className="w-full p-2 border rounded"
                        placeholder="عنوان مختصر للرسالة"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">محتوى الرسالة</label>
                      <textarea
                        value={messageForm.message}
                        onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                        className="w-full p-2 border rounded h-24"
                        placeholder="اكتب رسالتك هنا..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={sendMessage}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        ✅ إرسال
                      </button>
                      <button
                        onClick={() => setShowMessageForm(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                      >
                        ❌ إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* قائمة الرسائل */}
              <div>
                <h4 className="font-semibold mb-3">الرسائل والردود</h4>
                
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    لا توجد رسائل لهذا الطلب
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map(notification => (
                      <div key={notification.id} className="border rounded p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium">{notification.subject}</h5>
                            <div className="text-sm text-gray-600">
                              من: {notification.sender.name} • 
                              {new Date(notification.created_at).toLocaleString('ar-SA')}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {notification.priority === 'urgent' ? 'عاجل' :
                               notification.priority === 'high' ? 'مهم' :
                               notification.priority === 'low' ? 'منخفض' : 'عادي'}
                            </span>
                            
                            <span className={`px-2 py-1 rounded text-xs ${
                              notification.status === 'replied' ? 'bg-green-100 text-green-800' :
                              notification.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.status === 'replied' ? 'تم الرد' :
                               notification.status === 'read' ? 'مقروء' : 'مُرسل'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded mb-3">
                          {notification.message}
                        </div>
                        
                        {notification.reply && (
                          <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                            <div className="text-sm text-green-700 mb-1">
                              الرد - {new Date(notification.replied_at).toLocaleString('ar-SA')}
                            </div>
                            <div>{notification.reply}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}