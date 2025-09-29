'use client';
import React, { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  userId: string;
  role: string;
  name: string;
  email: string;
}

export default function SupervisorDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [delegates, setDelegates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const delegateSelectRef = useRef<{ [orderId: string]: HTMLSelectElement | null }>({});
  const [supervisorId, setSupervisorId] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<UserPayload>(token);
        setSupervisorId(decodedToken.userId);
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
    if (!supervisorId) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('token');
        if (!token) {
          console.error('No token found');
          return;
        }
        
        // جلب الطلبات والمندوبين معًا
        // سنجلب جميع الطلبات وسنقوم بالفلترة في الواجهة
        const [ordersRes, delegatesRes] = await Promise.all([
          fetch('/api/orders?role=supervisor', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/delegates', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        const ordersData = await ordersRes.json();
        const delegatesData = await delegatesRes.json();
        
        if (ordersRes.ok) {
          setOrders(ordersData.orders || []);
        }
        
        if (delegatesRes.ok) {
          setDelegates(delegatesData.delegates || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [supervisorId]); // فقط supervisorId

  // تعيين مهمة لمندوب
  const handleAssign = async (orderId: string) => {
    const delegateId = delegateSelectRef.current[orderId]?.value;
    if (!delegateId || !supervisorId) return;

    setAssigning(orderId);
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ staffId: delegateId, status: 'assigned' }),
      });
      
      if (res.ok) {
        const response = await res.json();
        // تحديث الطلب محليًا بدلاً من إعادة جلب كل الطلبات
        setOrders(prev => prev.map(order => {
          if (order.id === orderId) {
            return { 
              ...order, 
              assigned_delegate_id: delegateId,
              assigned_supervisor_id: supervisorId, // إضافة المشرف المسؤول
              status: 'assigned',
              assigned_at: new Date().toISOString()
            };
          }
          return order;
        }));
        
        // إعادة تحميل البيانات للتأكد من التحديث
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error('Failed to assign task');
      }
    } catch (error) {
      console.error('Error assigning task:', error);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">لوحة توزيع المهام على المندوبين</h2>
      </div>
      {loading ? <div>جاري التحميل...</div> : (
        <div>
          <div className="mb-4 flex gap-2">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'جاري التحميل...' : 'تحديث الطلبات'}
            </button>
            <div className="text-sm text-gray-600 flex items-center">
              عدد الطلبات: {orders.length} | عدد المندوبين: {delegates.length}
            </div>
          </div>
          
          <table className="w-full border rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">العنوان</th>
              <th className="p-2">العميل</th>
              <th className="p-2">الحالة</th>
              <th className="p-2">المندوب المُعيّن</th>
              <th className="p-2">نُفذت بواسطة</th>
              <th className="p-2">تفاصيل</th>
              <th className="p-2">تعيين لمندوب</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-4">لا توجد مهام حالياً</td></tr>
            ) : orders.map(order => {
              // استخراج البيانات من الحقول الجديدة والـ metadata
              let guardianName = 'غير محدد';
              let assignedDelegateId = order.assigned_delegate_id;
              let completedByDelegateId = null;
              
              try {
                // استخراج اسم الوالد من metadata
                const metadata = order.metadata ? (typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata) : {};
                guardianName = metadata.guardianInfo?.fullName || 'غير محدد';
                // في حالة وجود بيانات إضافية في metadata
                completedByDelegateId = metadata.completedBy || null;
              } catch (e) {
                console.log('Could not parse order metadata');
              }
              
              // العثور على اسم المندوب المُعيّن
              const assignedDelegate = assignedDelegateId ? 
                delegates.find((d: any) => d.id === assignedDelegateId) : null;
              
              // العثور على اسم المندوب الذي أكمل المهمة
              const completedByDelegate = completedByDelegateId ? 
                delegates.find((d: any) => d.id === completedByDelegateId) : null;
              
              return (
              <tr key={order.id}>
                <td className="p-2">{'طلب رقم ' + order.id.slice(0, 8)}</td>
                <td className="p-2">{guardianName}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    order.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'assigned' ? 'bg-orange-100 text-orange-800' :
                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'new' ? 'طلب جديد' :
                     order.status === 'assigned' ? 'تم التعيين' :
                     order.status === 'in_progress' ? 'قيد التنفيذ' :
                     order.status === 'completed' ? 'مكتمل' :
                     order.status === 'paid' ? 'مدفوع' : order.status}
                  </span>
                </td>
                <td className="p-2">
                  {assignedDelegate ? (
                    <span className="text-green-600 font-medium">{assignedDelegate.name}</span>
                  ) : (
                    <span className="text-gray-400">غير معين</span>
                  )}
                </td>
                <td className="p-2">
                  {order.status === 'completed' && completedByDelegate ? (
                    <div className="text-blue-600 bg-blue-100 px-2 py-1 rounded text-sm font-medium">
                      ✓ {completedByDelegate.name}
                    </div>
                  ) : order.status === 'completed' ? (
                    <span className="text-green-600 text-sm">تم الإنجاز</span>
                  ) : (
                    <span className="text-gray-400 text-sm">لم تكتمل</span>
                  )}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => window.open(`/order-details/${order.id}`, '_blank')}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    عرض التفاصيل
                  </button>
                </td>
                <td className="p-2 flex gap-2 items-center">
                  {assignedDelegate ? (
                    <div className="text-green-600 bg-green-100 px-3 py-2 rounded">
                      مُكلف للمندوب: {assignedDelegate.name}
                    </div>
                  ) : order.assigned_supervisor_id && order.assigned_supervisor_id !== supervisorId ? (
                    <div className="text-orange-600 bg-orange-100 px-3 py-2 rounded text-sm">
                      معين لمشرف آخر
                    </div>
                  ) : (
                    <>
                      <select ref={el => { delegateSelectRef.current[order.id] = el; }} className="border p-2 rounded">
                        <option value="">اختر مندوب</option>
                        {delegates.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
                        ))}
                      </select>
                      <button 
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-400" 
                        disabled={assigning === order.id} 
                        onClick={() => handleAssign(order.id)}
                      >
                        {assigning === order.id ? 'جاري التعيين...' : 'تعيين'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
} 