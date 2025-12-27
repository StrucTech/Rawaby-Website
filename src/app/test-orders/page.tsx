'use client';
import React, { useState } from 'react';
import Cookies from 'js-cookie';

export default function TestOrderPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const createTestOrder = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      
      const response = await fetch('/api/orders-simple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
          totalAmount: 500.00,
          paymentMethod: 'credit',
          guardianName: 'ولي أمر اختبار',
          serviceName: 'خدمة تجريبية',
          studentInfo: {
            name: 'طالب اختبار',
            grade: 'الثالث الثانوي'
          }
        })
      });

      const data = await response.json();
      setResult(data);
      
      if (response.ok) {
        // جلب الطلبات المحدثة
        fetchOrders();
      }
    } catch (error) {
      setResult({ error: 'خطأ في الاتصال', details: error });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = Cookies.get('token');
      
      const response = await fetch('/api/orders-simple', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">اختبار إنشاء الطلبات</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">إنشاء طلب اختبار</h2>
          
          <button
            onClick={createTestOrder}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء طلب تجريبي'}
          </button>

          {result && (
            <div className="mt-4 p-4 border rounded">
              <h3 className="font-semibold mb-2">نتيجة الطلب:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">الطلبات في قاعدة البيانات ({orders.length})</h2>
            <button
              onClick={fetchOrders}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              تحديث
            </button>
          </div>

          {orders.length === 0 ? (
            <p className="text-gray-500">لا توجد طلبات في قاعدة البيانات</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">ID</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">العميل</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">ولي الأمر</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">المبلغ</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الحالة</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-2 text-sm font-mono">
                        {order.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {order.client?.name || 'غير محدد'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {order.metadata?.guardianName || 'غير محدد'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {order.total_price} جنيه مصري
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {new Date(order.created_at).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}