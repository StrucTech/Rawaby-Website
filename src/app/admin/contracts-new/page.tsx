'use client';
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';

export default function ContractsAdminPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('token');
      
      const response = await fetch('/api/admin/contracts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setContracts(data.contracts || []);
        setError(null);
        console.log('Contracts loaded:', data.contracts?.length || 0);
      } else {
        setError(data.error || 'خطأ في جلب العقود');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
      console.error('Fetch contracts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير محدد';
    try {
      return new Date(dateString).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploaded': return 'تم الرفع';
      case 'under_review': return 'قيد المراجعة';
      case 'approved': return 'موافق عليه';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="text-lg">جاري تحميل العقود...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">إدارة العقود المرفوعة</h1>
          <Link 
            href="/admin/tasks"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            العودة للمهام
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">العقود المرفوعة ({contracts.length})</h2>
          </div>

          {contracts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">لا توجد عقود مرفوعة حالياً</p>
              <p className="text-gray-400 text-sm mt-2">
                العقود التي يرفعها المستخدمون ستظهر هنا
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">معلومات الاتصال</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العقود</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الرفع</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المصدر</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {contract.user?.name || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          📧 {contract.user?.email || 'غير محدد'}
                        </div>
                        <div className="text-sm text-gray-500">
                          📱 {contract.user?.phone || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {contract.contract1_url && (
                            <div>
                              <a 
                                href={contract.contract1_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                              >
                                📄 {contract.contract1_filename || 'عقد 1'}
                              </a>
                            </div>
                          )}
                          {contract.contract2_url && (
                            <div>
                              <a 
                                href={contract.contract2_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                              >
                                📄 {contract.contract2_filename || 'عقد 2'}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(contract.status)}`}>
                          {getStatusText(contract.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(contract.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={contract.source === 'user_profile' ? 'text-yellow-600' : 'text-green-600'}>
                          {contract.source === 'user_profile' ? '📝 ملف المستخدم' : '🗃️ جدول العقود'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={fetchContracts}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 mr-2"
          >
            🔄 تحديث القائمة
          </button>
          
          <Link
            href="/admin/tasks"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            📊 عرض المهام
          </Link>
        </div>
      </div>
    </div>
  );
}