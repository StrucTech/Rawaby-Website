'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';

interface DataRequest {
  id: string;
  order_id: string;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  uploaded_files: any[];
  client_note?: string;
  created_at: string;
  responded_at?: string;
  closed_at?: string;
  supervisor_reply?: string;
  supervisor_replied_at?: string;
  responded_by?: string;
  responded_by_id?: string;
  supervisor: {
    id: string;
    name: string;
    email: string;
  };
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  orders: {
    id: string;
    status: string;
    metadata: any;
    total_price: number;
    created_at: string;
  };
}

interface UserPayload {
  userId: string;
  role: string;
  name: string;
  email: string;
}

export default function AdminDataRequestsPage() {
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded' | 'closed'>('all');
  const [editingRequest, setEditingRequest] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState({ orderId: '', clientId: '', message: '', supervisorId: '' });
  const [orders, setOrders] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedRequestForReply, setSelectedRequestForReply] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded = jwt_decode<UserPayload>(token);
        if (decoded.role !== 'admin') {
          router.push('/login');
          return;
        }
      } catch {
        router.push('/login');
        return;
      }
    } else {
      router.push('/login');
      return;
    }
    
    fetchRequests();
    fetchOrders();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('token');
      const response = await fetch('/api/admin/data-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/orders?detailed=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleEditMessage = async (requestId: string) => {
    if (!editMessage.trim()) return;
    
    setSaving(true);
    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/admin/data-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, message: editMessage })
      });

      if (response.ok) {
        alert('تم تحديث الرسالة بنجاح');
        setEditingRequest(null);
        setEditMessage('');
        fetchRequests();
      } else {
        const error = await response.json();
        alert(`خطأ: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating message:', error);
      alert('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseRequest = async (requestId: string) => {
    if (!confirm('هل أنت متأكد من إغلاق هذا الطلب؟')) return;
    
    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/admin/data-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, status: 'closed' })
      });

      if (response.ok) {
        alert('تم إغلاق الطلب');
        fetchRequests();
      }
    } catch (error) {
      console.error('Error closing request:', error);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    
    try {
      const token = Cookies.get('token');
      const response = await fetch(`/api/admin/data-requests?requestId=${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('تم حذف الطلب');
        fetchRequests();
      }
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  // الرد على طلب البيانات
  const handleSendReply = async () => {
    if (!selectedRequestForReply || !replyMessage.trim()) {
      alert('يرجى كتابة الرد');
      return;
    }

    setSendingReply(true);
    try {
      const token = Cookies.get('token');
      const currentRequest = requests.find(r => r.id === selectedRequestForReply);
      
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
        setRequests(prev => prev.map(req => 
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

  const handleSendNewMessage = async () => {
    if (!newMessage.orderId || !newMessage.clientId || !newMessage.message.trim()) {
      alert('يرجى ملء جميع الحقول');
      return;
    }
    
    setSaving(true);
    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/admin/data-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newMessage)
      });

      if (response.ok) {
        alert('تم إرسال الرسالة بنجاح');
        setShowNewMessageModal(false);
        setNewMessage({ orderId: '', clientId: '', message: '', supervisorId: '' });
        fetchRequests();
      } else {
        const error = await response.json();
        alert(`خطأ: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">في الانتظار</span>;
      case 'responded':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">تم الرد</span>;
      case 'closed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">مغلق</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة الرسائل</h1>
              <p className="text-gray-600">عرض وتعديل جميع الرسائل بين المشرفين والعملاء</p>
            </div>
            <button
              onClick={() => setShowNewMessageModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + رسالة جديدة
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              الكل ({requests.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
            >
              في الانتظار ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('responded')}
              className={`px-4 py-2 rounded ${filter === 'responded' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              تم الرد ({requests.filter(r => r.status === 'responded').length})
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 rounded ${filter === 'closed' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              مغلق ({requests.filter(r => r.status === 'closed').length})
            </button>
          </div>

          {/* Requests List */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-6xl text-gray-400 mb-4">📭</div>
              <p className="text-gray-600">لا توجد رسائل</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Request Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(request.status)}
                      <span className="text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {/* التعديل متاح فقط إذا لم يرد العميل بعد (pending) */}
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setEditingRequest(request.id);
                              setEditMessage(request.message);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            ✏️ تعديل
                          </button>
                        </>
                      )}
                      {request.status !== 'closed' && (
                        <button
                          onClick={() => handleCloseRequest(request.id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          ✓ إغلاق
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div className="bg-blue-50 p-2 rounded">
                      <strong>المشرف:</strong> {request.supervisor?.name || 'غير محدد'}
                      <br />
                      <span className="text-xs text-gray-500">{request.supervisor?.email}</span>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <strong>العميل:</strong> {request.client?.name || 'غير محدد'}
                      <br />
                      <span className="text-xs text-gray-500">{request.client?.email}</span>
                      {request.client?.phone && (
                        <span className="text-xs text-gray-500 mr-2">| {request.client.phone}</span>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  {editingRequest === request.id ? (
                    <div className="bg-gray-50 p-3 rounded mb-3">
                      <textarea
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                        className="w-full border rounded p-2 mb-2"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditMessage(request.id)}
                          disabled={saving}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {saving ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingRequest(null);
                            setEditMessage('');
                          }}
                          className="bg-gray-300 px-3 py-1 rounded text-sm"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-3 rounded mb-3 border-r-4 border-yellow-400">
                      <strong className="text-sm text-yellow-800">رسالة المشرف:</strong>
                      <p className="text-gray-700 mt-1">{request.message}</p>
                    </div>
                  )}

                  {/* Client Response */}
                  {request.status !== 'pending' && (
                    <div className="bg-green-50 p-3 rounded mb-3 border-r-4 border-green-400">
                      <strong className="text-sm text-green-800">رد العميل:</strong>
                      {request.client_note && (
                        <p className="text-gray-700 mt-1">{request.client_note}</p>
                      )}
                      {request.uploaded_files && request.uploaded_files.length > 0 && (
                        <div className="mt-2">
                          <strong className="text-sm">الملفات المرفقة:</strong>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {request.uploaded_files.map((file: any, index: number) => (
                              <a
                                key={index}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white border rounded text-xs hover:bg-gray-50"
                              >
                                {file.type?.includes('image') ? '🖼️' : '📄'}
                                {file.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {request.responded_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          تم الرد في: {formatDate(request.responded_at)}
                        </p>
                      )}
                      
                      {/* Supervisor Reply */}
                      {request.supervisor_reply && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-3">
                          <p className="text-sm font-medium text-blue-800 mb-1">💬 رد المشرف:</p>
                          <p className="text-sm text-gray-700">{request.supervisor_reply}</p>
                          {request.supervisor_replied_at && (
                            <p className="text-xs text-blue-600 mt-1">
                              في {formatDate(request.supervisor_replied_at)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply Button - متاح فقط للرسائل التي لم يرد عليها العميل */}
                  {request.status === 'pending' && (
                    <div className="mb-3">
                      <button
                        onClick={() => {
                          setSelectedRequestForReply(request.id);
                          setReplyMessage('');
                          setShowReplyModal(true);
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        💬 الرد على العميل
                      </button>
                    </div>
                  )}

                  {/* Order Info */}
                  <div className="text-xs text-gray-500 border-t pt-2">
                    <strong>الطلب:</strong> {request.order_id.substring(0, 8)}...
                    {request.orders?.metadata?.studentInfo && (
                      <span className="mr-2">
                        | الطالب: {request.orders.metadata.studentInfo.fullName || request.orders.metadata.studentInfo.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">إرسال رسالة جديدة للعميل</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">اختر الطلب</label>
                <select
                  value={newMessage.orderId}
                  onChange={(e) => {
                    const order = orders.find(o => o.id === e.target.value);
                    setNewMessage({
                      ...newMessage,
                      orderId: e.target.value,
                      clientId: order?.client_id || '',
                      supervisorId: order?.assigned_supervisor_id || ''
                    });
                  }}
                  className="w-full border rounded p-2"
                >
                  <option value="">اختر طلب...</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.id.substring(0, 8)} - {order.metadata?.studentInfo?.fullName || 'غير محدد'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">الرسالة</label>
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  placeholder="اكتب رسالتك للعميل..."
                  rows={4}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSendNewMessage}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'جاري الإرسال...' : 'إرسال'}
              </button>
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  setNewMessage({ orderId: '', clientId: '', message: '', supervisorId: '' });
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
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
