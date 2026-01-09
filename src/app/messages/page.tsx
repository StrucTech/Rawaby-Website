'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

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
  responded_by?: string;
  responded_by_id?: string;
  supervisor: {
    id: string;
    name: string;
    email: string;
  };
  orders: {
    id: string;
    status: string;
    metadata: any;
    total_price: number;
    created_at: string;
  };
}

export default function UserMessages() {
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [clientNote, setClientNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/data-requests');
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('خطأ في جلب الطلبات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitFiles = async (requestId: string, orderId: string) => {
    if (selectedFiles.length === 0) {
      alert('يرجى اختيار ملف واحد على الأقل');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('note', clientNote);

      const token = Cookies.get('token');
      const response = await fetch(`/api/orders/${orderId}/data-requests/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('تم رفع الملفات بنجاح! سيتم مراجعتها من المشرف.');
        setSelectedFiles([]);
        setClientNote('');
        setUploadingFor(null);
        fetchRequests();
      } else {
        const error = await response.json();
        alert(`خطأ: ${error.error || 'فشل في رفع الملفات'}`);
      }
    } catch (error) {
      console.error('خطأ في رفع الملفات:', error);
      alert('حدث خطأ أثناء رفع الملفات');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'في انتظار ردك';
      case 'responded': return 'تم الرد - قيد المراجعة';
      case 'closed': return 'مكتمل';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'responded': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'closed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  // فلترة الطلبات المفتوحة (في انتظار الرد)
  // عرض الطلبات التي تحتاج رد: pending أو لديها supervisor_reply بدون رد من العميل
  const pendingRequests = requests.filter(r => 
    r.status === 'pending' || 
    (r.status === 'responded' && r.supervisor_reply && !r.client_note)
  );
  // الطلبات السابقة: الطلبات التي ردّ عليها العميل أو مغلقة
  const otherRequests = requests.filter(r => 
    r.status === 'closed' || 
    (r.status === 'responded' && r.client_note)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">رسائلي</h1>
          <p className="text-gray-600 mb-6">طلبات البيانات من المشرفين</p>
          
          {requests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-6xl text-gray-400 mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد رسائل</h3>
              <p className="text-gray-600">لم تستلم أي طلبات بيانات من المشرفين حتى الآن</p>
            </div>
          ) : (
            <>
              {/* طلبات تحتاج رد */}
              {pendingRequests.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    {requests.some(r => r.supervisor_reply && !r.client_note) 
                      ? '🔔 طلبات جديدة من المشرف' 
                      : 'طلبات تحتاج ردك'} ({pendingRequests.length})
                  </h2>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className="border-2 border-yellow-300 rounded-lg p-6 bg-yellow-50"
                      >
                        {/* رأس الطلب */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                              {getStatusLabel(request.status)}
                            </span>
                            <p className="text-sm text-gray-600 mt-2">
                              من: <strong>{request.supervisor?.name || 'المشرف'}</strong>
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(request.created_at)}
                          </span>
                        </div>

                        {/* رسالة المشرف */}
                        <div className="bg-white p-4 rounded-lg border border-yellow-200 mb-4">
                          <p className="text-gray-800 leading-relaxed">{request.message}</p>
                        </div>

                        {/* عرض رد المشرف إن كان موجود */}
                        {request.supervisor_reply && (
                          <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                            <p className="text-sm font-medium text-green-800 mb-2">💬 رد المشرف:</p>
                            <p className="text-sm text-gray-700">{request.supervisor_reply}</p>
                            {request.supervisor_replied_at && (
                              <p className="text-xs text-green-600 mt-2">
                                في {new Date(request.supervisor_replied_at).toLocaleString('ar-EG')}
                              </p>
                            )}
                          </div>
                        )}

                        {/* معلومات الطلب المرتبط */}
                        <div className="text-sm text-gray-600 mb-4 bg-white p-3 rounded border">
                          <strong>الطلب:</strong> رقم {request.order_id.substring(0, 8)}
                          {request.orders?.metadata?.studentInfo && (
                            <span className="mr-2">
                              | الطالب: {request.orders.metadata.studentInfo.fullName || request.orders.metadata.studentInfo.name}
                            </span>
                          )}
                        </div>

                        {/* منطقة رفع الملفات */}
                        {uploadingFor === request.id ? (
                          <div className="bg-white p-4 rounded-lg border">
                            <h4 className="font-medium mb-3">رفع الملفات المطلوبة</h4>
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              onChange={handleFileSelect}
                              className="hidden"
                              accept="image/*,.pdf,.doc,.docx"
                            />
                            
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                            >
                              <div className="text-4xl mb-2">📁</div>
                              <p className="text-gray-600">اضغط لاختيار الملفات</p>
                              <p className="text-xs text-gray-400 mt-1">صور، PDF، Word</p>
                            </button>

                            {/* عرض الملفات المختارة */}
                            {selectedFiles.length > 0 && (
                              <div className="mt-4">
                                <h5 className="text-sm font-medium mb-2">الملفات المختارة:</h5>
                                <div className="space-y-2">
                                  {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xl">
                                          {file.type.includes('image') ? '🖼️' :
                                           file.type.includes('pdf') ? '📄' : '📁'}
                                        </span>
                                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                                        <span className="text-xs text-gray-500">
                                          ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => removeFile(index)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ملاحظة اختيارية */}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ملاحظة (اختياري)
                              </label>
                              <textarea
                                value={clientNote}
                                onChange={(e) => setClientNote(e.target.value)}
                                placeholder="أضف ملاحظة للمشرف..."
                                rows={2}
                                className="w-full border rounded p-2 text-sm"
                              />
                            </div>

                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => handleSubmitFiles(request.id, request.order_id)}
                                disabled={submitting || selectedFiles.length === 0}
                                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                              >
                                {submitting ? 'جاري الرفع...' : '✓ إرسال الملفات'}
                              </button>
                              <button
                                onClick={() => {
                                  setUploadingFor(null);
                                  setSelectedFiles([]);
                                  setClientNote('');
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setUploadingFor(request.id)}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                          >
                            📤 رفع الملفات المطلوبة
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* الطلبات الأخرى (تم الرد عليها أو مغلقة) */}
              {otherRequests.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    الطلبات السابقة ({otherRequests.length})
                  </h2>
                  <div className="space-y-4">
                    {otherRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className={`border rounded-lg p-4 ${
                          request.status === 'responded' ? 'bg-blue-50 border-blue-200' :
                          'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(request.created_at)}
                          </span>
                        </div>

                        <p className="text-gray-700 text-sm mb-3">
                          <strong>الطلب:</strong> {request.message}
                        </p>

                        {/* الملفات المرفوعة */}
                        {request.uploaded_files && request.uploaded_files.length > 0 && (
                          <div className="bg-white p-3 rounded border">
                            <p className="text-sm font-medium mb-2">الملفات المرفوعة:</p>
                            <div className="flex flex-wrap gap-2">
                              {request.uploaded_files.map((file: any, index: number) => (
                                <a
                                  key={index}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
                                >
                                  {file.type?.includes('image') ? '🖼️' : '📄'}
                                  {file.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {request.client_note && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>ملاحظتك:</strong> {request.client_note}
                          </p>
                        )}

                        {/* رد المشرف إن وجد */}
                        {request.supervisor_reply && (
                          <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                            <p className="text-sm font-medium text-green-800 mb-2">💬 رد المشرف:</p>
                            <p className="text-sm text-gray-700">{request.supervisor_reply}</p>
                            {request.supervisor_replied_at && (
                              <p className="text-xs text-green-600 mt-2">
                                في {new Date(request.supervisor_replied_at).toLocaleString('ar-EG')}
                              </p>
                            )}
                          </div>
                        )}

                        {request.status === 'responded' && (
                          <p className="text-xs text-blue-600 mt-2">
                            ⏳ في انتظار مراجعة المشرف
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}