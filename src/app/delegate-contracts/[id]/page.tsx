'use client';
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useParams } from 'next/navigation';

interface UserPayload {
  userId: string;
  role: string;
  name: string;
  email: string;
}

interface Contract {
  id: string;
  order_id: string;
  contract1_path?: string;
  contract2_path?: string;
  contract1_url?: string;
  contract2_url?: string;
  created_at: string;
  updated_at: string;
}

export default function DelegateContractsPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserPayload | null>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<UserPayload>(token);
        if (decodedToken.role === 'delegate') {
          setUserInfo(decodedToken);
        } else {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Invalid token:', error);
        Cookies.remove('token');
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    if (!userInfo || !orderId) return;
    
    fetchContracts();
  }, [userInfo, orderId]);

  const fetchContracts = async () => {
    setLoading(true);
    console.log('Fetching contracts for order ID:', orderId);
    console.log('User info:', userInfo);
    
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      const res = await fetch(`/api/simple-contracts/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Success! Contracts response:', data);
        console.log('Contracts array:', data.contracts);
        
        if (data.contracts && data.contracts.length > 0) {
          console.log('First contract details:', data.contracts[0]);
        }
        
        setContracts(data.contracts || []);
        
        // عرض رسالة نجاح
        if (data.contracts && data.contracts.length === 0) {
          setError('لا توجد عقود مرفوعة لهذا الطلب بعد');
        }
      } else {
        const errorData = await res.json();
        console.error('Error response:', errorData);
        setError(errorData.error || 'فشل في جلب العقود');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const downloadContract = async (contractPath: string, fileName: string) => {
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      const res = await fetch(`/api/admin/contracts/download?filePath=${encodeURIComponent(contractPath)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('فشل في تحميل الملف');
      }
    } catch (error) {
      console.error('Error downloading contract:', error);
      alert('حدث خطأ أثناء تحميل الملف');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">جاري تحميل العقود...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">خطأ</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">عقود الطلب</h1>
          <button 
            onClick={() => window.history.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            العودة
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p><strong>رقم الطلب:</strong> {orderId.substring(0, 8)}...</p>
          <p><strong>المندوب:</strong> {userInfo?.name}</p>
          <p><strong>عدد العقود:</strong> {contracts.length}</p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد عقود</h3>
          <p className="text-gray-500">لم يتم رفع أي عقود لهذا الطلب بعد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract, index) => (
            <div key={contract.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">عقد رقم {index + 1}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(contract.created_at).toLocaleDateString('ar-SA')} - {new Date(contract.created_at).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {(contract.contract1_url || contract.contract1_path) && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <h4 className="font-medium mb-2">العقد الأول</h4>
                    <button
                      onClick={() => {
                        const contractPath = contract.contract1_url || contract.contract1_path;
                        if (contractPath) {
                          if (contractPath.startsWith('http')) {
                            // رابط مباشر
                            window.open(contractPath, '_blank');
                          } else {
                            // مسار ملف - استخدم API التحميل
                            downloadContract(contractPath, `Contract1_${contract.id.substring(0, 8)}.pdf`);
                          }
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
                    >
                      📥 تحميل العقد الأول
                    </button>
                  </div>
                )}
                
                {(contract.contract2_url || contract.contract2_path) && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <h4 className="font-medium mb-2">العقد الثاني</h4>
                    <button
                      onClick={() => {
                        const contractPath = contract.contract2_url || contract.contract2_path;
                        if (contractPath) {
                          if (contractPath.startsWith('http')) {
                            // رابط مباشر
                            window.open(contractPath, '_blank');
                          } else {
                            // مسار ملف - استخدم API التحميل
                            downloadContract(contractPath, `Contract2_${contract.id.substring(0, 8)}.pdf`);
                          }
                        }
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
                    >
                      📥 تحميل العقد الثاني
                    </button>
                  </div>
                )}
              </div>
              
              {contract.updated_at !== contract.created_at && (
                <div className="mt-4 text-sm text-gray-500">
                  آخر تحديث: {new Date(contract.updated_at).toLocaleDateString('ar-SA')} - {new Date(contract.updated_at).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}