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

export default function DebugDelegatePage() {
  const [delegateId, setDelegateId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<UserPayload>(token);
        console.log('Decoded token:', decodedToken);
        setDelegateId(decodedToken.userId);
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!delegateId) return;
    
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('token');
        console.log('Fetching orders for delegate:', delegateId);
        
        const res = await fetch(`/api/orders?delegateId=${delegateId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await res.json();
        console.log('Orders API response:', data);
        
        if (res.ok) {
          setOrders(data.orders || []);
        } else {
          console.error('API Error:', data);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [delegateId]);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Debug - معلومات المندوب والطلبات</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">معلومات المندوب:</h3>
        <p><strong>معرف المندوب:</strong> {delegateId || 'غير محدد'}</p>
        <p><strong>عدد الطلبات:</strong> {orders.length}</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">جاري التحميل...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">الطلبات المكلفة للمندوب:</h3>
          
          {orders.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">لا توجد طلبات مكلفة لهذا المندوب</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border p-3 text-left">رقم الطلب</th>
                    <th className="border p-3 text-left">الحالة</th>
                    <th className="border p-3 text-left">assigned_delegate_id</th>
                    <th className="border p-3 text-left">delegate_id</th>
                    <th className="border p-3 text-left">تاريخ الإنشاء</th>
                    <th className="border p-3 text-left">معلومات إضافية</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr key={order.id || index} className="hover:bg-gray-50">
                      <td className="border p-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {order.id ? order.id.substring(0, 8) + '...' : 'غير محدد'}
                        </code>
                      </td>
                      <td className="border p-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="border p-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {order.assigned_delegate_id ? order.assigned_delegate_id.substring(0, 8) + '...' : 'null'}
                        </code>
                      </td>
                      <td className="border p-3">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {order.delegate_id ? order.delegate_id.substring(0, 8) + '...' : 'null'}
                        </code>
                      </td>
                      <td className="border p-3 text-sm">
                        {order.created_at ? new Date(order.created_at).toLocaleString('ar-SA') : 'غير محدد'}
                      </td>
                      <td className="border p-3">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            عرض التفاصيل
                          </summary>
                          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify({
                              client_id: order.client_id,
                              supervisor_id: order.supervisor_id || order.assigned_supervisor_id,
                              total_price: order.total_price,
                              service_ids: order.service_ids
                            }, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 space-x-4">
        <button 
          onClick={async () => {
            const token = Cookies.get('token');
            const res = await fetch('/api/debug-delegate', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            console.log('Debug API Response:', data);
            alert(JSON.stringify(data, null, 2));
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
        >
          تشغيل Debug API
        </button>
        
        <button 
          onClick={() => window.history.back()}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          العودة
        </button>
      </div>
    </div>
  );
}