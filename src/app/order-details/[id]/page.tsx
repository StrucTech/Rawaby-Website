'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) {
          setError('يجب تسجيل الدخول لعرض تفاصيل الطلب');
          return;
        }

        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('فشل في جلب تفاصيل الطلب');
        }

        const data = await response.json();
        setOrderData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ في تحميل الطلب</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">الطلب غير موجود</h1>
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  let orderMetadata: any = {};
  try {
    // استخدام metadata بدلاً من note
    orderMetadata = orderData.metadata ? (typeof orderData.metadata === 'string' ? JSON.parse(orderData.metadata) : orderData.metadata) : {};
  } catch (e) {
    console.log('Could not parse order metadata:', e);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تفاصيل الطلب</h1>
              <p className="text-sm text-gray-600 mt-1">رقم الطلب: {orderId}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                orderData.status === 'done' ? 'bg-green-100 text-green-800' :
                (orderData.status === 'in progress' || orderData.status === 'in_progress') ? 'bg-blue-100 text-blue-800' :
                orderData.status === 'new' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {orderData.status === 'done' ? 'تم التنفيذ' : 
                 orderData.status === 'in progress' || orderData.status === 'in_progress' ? 'قيد التنفيذ' : 
                 orderData.status === 'new' ? 'طلب جديد' : orderData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">معلومات العميل</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-blue-700">معرف العميل</label>
              <p className="text-blue-900 font-mono text-sm">{orderData.client_id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-blue-700">تاريخ إنشاء الطلب</label>
              <p className="text-blue-900">{new Date(orderData.created_at).toLocaleString('ar-SA')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Guardian Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">بيانات ولي الأمر</h2>
            {(orderMetadata.guardianInfo || orderMetadata.guardianName) ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">الاسم الكامل</label>
                  <p className="text-gray-900">{orderMetadata.guardianInfo?.fullName || orderMetadata.guardianName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">رقم الجوال</label>
                  <p className="text-gray-900">{orderMetadata.guardianInfo?.mobileNumber || orderMetadata.guardianPhone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">الرقم القومي</label>
                  <p className="text-gray-900">{orderMetadata.guardianInfo?.nationalId || orderMetadata.guardianNationalId}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">لم يتم إدخال بيانات ولي الأمر</p>
                <p className="text-sm text-gray-400">يرجى التواصل مع العميل للحصول على البيانات</p>
              </div>
            )}
          </div>

          {/* Student Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">بيانات الطالب</h2>
            {orderMetadata.studentInfo ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">اسم الطالب</label>
                  <p className="text-gray-900">{orderMetadata.studentInfo.fullName || orderMetadata.studentInfo.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">الصف الدراسي</label>
                  <p className="text-gray-900">{orderMetadata.studentInfo.grade}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">المجموع الكلي</label>
                  <p className="text-gray-900">{orderMetadata.studentInfo.totalScore}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">نوع الشهادة</label>
                  <p className="text-gray-900">{orderMetadata.studentInfo.certificateType}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">لم يتم إدخال بيانات الطالب</p>
                <p className="text-sm text-gray-400">يرجى التواصل مع العميل للحصول على البيانات</p>
              </div>
            )}
          </div>
        </div>

        {/* Services */}
        {orderMetadata.selectedServices && orderMetadata.selectedServices.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">الخدمات المطلوبة</h2>
              <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                خدمات مؤقتة - تحتاج تحديث
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3 font-medium text-gray-600">اسم الخدمة</th>
                    <th className="text-right p-3 font-medium text-gray-600">الوصف</th>
                    <th className="text-right p-3 font-medium text-gray-600">السعر</th>
                  </tr>
                </thead>
                <tbody>
                  {orderMetadata.selectedServices.map((service: any, index: number) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="p-3 font-medium">{service.title}</td>
                      <td className="p-3 text-gray-600">{service.description || 'لا يوجد وصف'}</td>
                      <td className="p-3 font-semibold text-blue-600">{service.price} ريال</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">المجموع الكلي:</span>
                <span className="text-xl font-bold text-blue-600">{orderData.total_price} ريال</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Info */}
        {orderMetadata.paymentMethod && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الدفع</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">طريقة الدفع</label>
                <p className="text-gray-900">
                  {orderMetadata.paymentMethod === 'credit' ? 'بطاقة ائتمان' :
                   orderMetadata.paymentMethod === 'mada' ? 'مدى' :
                   orderMetadata.paymentMethod === 'apple' ? 'Apple Pay' : orderMetadata.paymentMethod}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">تاريخ الدفع</label>
                <p className="text-gray-900">
                  {new Date(orderMetadata.paymentTimestamp).toLocaleString('ar-SA')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Info */}
        {orderMetadata.assignedDelegate && (
          <div className="bg-blue-50 rounded-lg p-6 mt-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">معلومات التعيين</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-blue-700">معرف المندوب</label>
                <p className="text-blue-900">{orderMetadata.assignedDelegate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-700">تاريخ التعيين</label>
                <p className="text-blue-900">
                  {new Date(orderMetadata.assignedAt).toLocaleString('ar-SA')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contracts Section */}
        <ContractsOrButtonSection orderId={orderId} />

        {/* Close Button */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => window.close()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}

// مكون عرض العقود
function ContractsOrButtonSection({ orderId }: { orderId: string }) {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        setUserRole(decodedToken.role);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  // للمندوب: عرض زرار يوديه لصفحة العقود المخصصة
  if (userRole === 'delegate') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">العقود المرتبطة</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-4">عرض العقود</h3>
          <p className="text-gray-500 mb-6">اضغط الزر أدناه لعرض جميع العقود المرتبطة بهذا الطلب</p>
          <button
            onClick={() => window.open(`/delegate-contracts/${orderId}`, '_blank')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            📋 عرض العقود
          </button>
        </div>
      </div>
    );
  }

  // للمستخدمين الآخرين: عرض العقود كما هو
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">العقود المرتبطة</h2>
      <ContractsSection orderId={orderId} />
    </div>
  );
}

function ContractsSection({ orderId }: { orderId: string }) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) return;

        const response = await fetch(`/api/orders/${orderId}/contracts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setContracts(data.contracts || []);
        }
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchContracts();
    }
  }, [orderId]);

  if (loading) {
    return <div className="text-center py-4">جاري تحميل العقود...</div>;
  }

  if (contracts.length === 0) {
    return <div className="text-center py-4 text-gray-500">لا توجد عقود مرتبطة بهذا الطلب</div>;
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => (
        <div key={contract.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-900">عقد رقم {contract.id.substring(0, 8)}</h3>
            <span className={`px-2 py-1 rounded text-xs ${
              contract.status === 'approved' ? 'bg-green-100 text-green-800' :
              contract.status === 'rejected' ? 'bg-red-100 text-red-800' :
              contract.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {contract.status === 'uploaded' ? 'مرفوع' :
               contract.status === 'under_review' ? 'قيد المراجعة' :
               contract.status === 'approved' ? 'مُعتمد' :
               contract.status === 'rejected' ? 'مرفوض' : contract.status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            {contract.contract1_url && (
              <div>
                <label className="text-gray-600">العقد الأول:</label>
                <a 
                  href={contract.contract1_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-800 truncate"
                >
                  {contract.contract1_filename}
                </a>
              </div>
            )}
            
            {contract.contract2_url && (
              <div>
                <label className="text-gray-600">العقد الثاني:</label>
                <a 
                  href={contract.contract2_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-800 truncate"
                >
                  {contract.contract2_filename}
                </a>
              </div>
            )}
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            رُفع في: {new Date(contract.uploaded_at).toLocaleString('ar-SA')}
          </div>
          
          {contract.review_notes && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
              <strong>ملاحظات المراجعة:</strong> {contract.review_notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}