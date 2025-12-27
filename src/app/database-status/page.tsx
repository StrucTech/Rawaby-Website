'use client';
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface DatabaseStats {
  ordersCount: number;
  contractsCount: number;
  usersCount: number;
  servicesCount: number;
  recentOrders: any[];
}

export default function DatabaseStatusPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabaseStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = Cookies.get('token');
      
      // استخدام API db-simple للحصول على إحصائيات بسيطة
      const dbResponse = await fetch('/api/db-simple');
      
      if (!dbResponse.ok) {
        throw new Error(`فشل في جلب إحصائيات قاعدة البيانات: ${dbResponse.status}`);
      }
      
      const dbData = await dbResponse.json();
      
      if (dbData.success) {
        const counts = dbData.counts;
        
        setStats({
          ordersCount: typeof counts.orders === 'number' ? counts.orders : 0,
          contractsCount: typeof counts.contracts === 'number' ? counts.contracts : 0,
          usersCount: typeof counts.users === 'number' ? counts.users : 0,
          servicesCount: typeof counts.services === 'number' ? counts.services : 0,
          recentOrders: Array.isArray(dbData.recentOrders) ? dbData.recentOrders : []
        });
      } else {
        throw new Error(dbData.error || 'فشل في جلب البيانات');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  const testDirectQuery = async () => {
    try {
      const response = await fetch('/api/db-simple', {
        method: 'POST'
      });
      
      const result = await response.json();
      console.log('نتيجة اختبار الإدراج:', result);
      
      // تحديث الإحصائيات بعد الاختبار
      fetchDatabaseStats();
      
    } catch (error) {
      console.error('خطأ في اختبار الإدراج:', error);
    }
  };

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل إحصائيات قاعدة البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>خطأ:</strong> {error}
          </div>
          <button
            onClick={fetchDatabaseStats}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">حالة قاعدة البيانات</h1>
          <div className="space-x-2 space-x-reverse">
            <button
              onClick={fetchDatabaseStats}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              تحديث
            </button>
            <button
              onClick={testDirectQuery}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              اختبار إدراج طلب
            </button>
          </div>
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📋</span>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      الطلبات
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.ordersCount || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">📄</span>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      العقود
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.contractsCount || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">👥</span>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      المستخدمون
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.usersCount || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">🔧</span>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      الخدمات
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.servicesCount || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* جدول الطلبات الأخيرة */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              الطلبات الأخيرة ({stats?.recentOrders.length || 0})
            </h3>
            
            {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                لا توجد طلبات في قاعدة البيانات
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        العميل
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المبلغ الإجمالي
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        التاريخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        البيانات الإضافية
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentOrders.map((order, index) => (
                      <tr key={order.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {order.id ? `${order.id.substring(0, 8)}...` : 'لا يوجد'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.client?.name || order.user_id || 'غير محدد'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.total_price || 0} جنيه مصري
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status || 'غير محدد'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.created_at ? 
                            new Date(order.created_at).toLocaleString('ar-SA') :
                            'غير محدد'
                          }
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <details>
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              عرض التفاصيل
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(order.metadata || {}, null, 2)}
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
        </div>
      </div>
    </div>
  );
}