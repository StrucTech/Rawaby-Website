'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export default function TasksManagement() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [delegates, setDelegates] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // إحصائيات عامة
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    pendingOrders: 0
  });
  
  // إحصائيات المندوبين
  const [delegateStats, setDelegateStats] = useState<any[]>([]);
  
  // إحصائيات المشرفين
  const [supervisorStats, setSupervisorStats] = useState<any[]>([]);

  const getCurrentUser = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) return;

      // فك تشفير التوكن للحصول على معلومات المستخدم
      const response = await fetch('/api/auth/verify-token', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData.user);
        console.log('Current user:', userData.user);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      console.log('Token exists:', !!token);
      if (!token) {
        console.error('No token found');
        return;
      }

      // جلب جميع البيانات معاً - استخدم الـ view الجديد
      const [ordersRes, supervisorsRes, delegatesRes] = await Promise.all([
        fetch('/api/orders?detailed=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/supervisors', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/delegates', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const ordersData = await ordersRes.json();
      const supervisorsData = await supervisorsRes.json();
      const delegatesData = await delegatesRes.json();

      console.log('API Responses:', {
        ordersStatus: ordersRes.status,
        supervisorsStatus: supervisorsRes.status,
        delegatesStatus: delegatesRes.status
      });

      if (ordersRes.ok) {
        console.log('Raw orders data:', ordersData.orders);
        const processedOrders = processOrders(ordersData.orders || []);
        console.log('Processed orders:', processedOrders);
        setOrders(processedOrders);
        calculateStats(processedOrders);
      } else {
        console.error('Orders API error:', ordersData);
      }

      if (supervisorsRes.ok) {
        console.log('Supervisors data:', supervisorsData.supervisors);
        console.log('Number of supervisors:', supervisorsData.supervisors?.length || 0);
        setSupervisors(supervisorsData.supervisors || []);
      } else {
        console.error('Supervisors API error:', supervisorsData);
      }

      if (delegatesRes.ok) {
        setDelegates(delegatesData.delegates || []);
      } else {
        console.error('Delegates API error:', delegatesData);
      }

      // حساب الإحصائيات بعد تحميل البيانات
      if (ordersRes.ok && delegatesRes.ok && supervisorsRes.ok) {
        calculateDelegateStats(ordersData.orders || [], delegatesData.delegates || []);
        calculateSupervisorStats(ordersData.orders || [], supervisorsData.supervisors || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processOrders = (rawOrders: any[]) => {
    return rawOrders.map(order => {
      // استخدام الحقول الجديدة مباشرة من الـ view
      const metadata = order.metadata || {};

      console.log('Processing order with new structure:', {
        id: order.id,
        assigned_supervisor_id: order.assigned_supervisor_id,
        assigned_delegate_id: order.assigned_delegate_id,
        supervisor_name: order.supervisor_name,
        delegate_name: order.delegate_name
      });

      return {
        ...order,
        assignedDelegate: order.assigned_delegate_id,
        completedBy: order.completed_by,
        assignedAt: order.assigned_at,
        completedAt: order.completed_at,
        guardianName: order.guardian_name || metadata.guardianName || order.client_name || 'غير محدد'
      };
    });
  };

  const calculateStats = (orders: any[]) => {
    const stats = {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      inProgressOrders: orders.filter(o => o.status === 'in_progress').length,
      pendingOrders: orders.filter(o => o.status === 'new' || o.status === 'pending').length
    };
    setStats(stats);
  };

  const calculateDelegateStats = (orders: any[], delegates: any[]) => {
    const delegateStats = delegates.map(delegate => {
      const delegateOrders = orders.filter(order => 
        order.assigned_delegate_id === delegate.id || order.completed_by === delegate.id
      );

      return {
        ...delegate,
        completedOrders: delegateOrders.filter(o => o.status === 'completed').length,
        totalAssigned: orders.filter(order => order.assigned_delegate_id === delegate.id).length
      };
    });

    setDelegateStats(delegateStats);
  };

  const calculateSupervisorStats = (orders: any[], supervisors: any[]) => {
    const supervisorStats = supervisors.map(supervisor => {
      // الطلبات التي عين لها هذا المشرف مندوب (هو مسؤول عنها)
      const supervisorOrders = orders.filter(order => 
        order.assigned_supervisor_id === supervisor.id
      );
      
      return {
        ...supervisor,
        totalOrders: supervisorOrders.length,
        completedOrders: supervisorOrders.filter(o => o.status === 'completed').length,
        inProgressOrders: supervisorOrders.filter(o => o.status === 'in_progress').length,
        pendingOrders: supervisorOrders.filter(o => o.status === 'new' || o.status === 'pending').length
      };
    });

    setSupervisorStats(supervisorStats);
  };

  const getSupervisorName = (order: any) => {
    // استخدام supervisor_name من الـ view مباشرة
    if (order.supervisor_name) {
      console.log('Supervisor name from view:', order.supervisor_name, 'for order:', order.id);
      return order.supervisor_name;
    }
    
    // البحث بالحقل المباشر
    if (order.assigned_supervisor_id) {
      const supervisor = supervisors.find(s => s.id === order.assigned_supervisor_id);
      console.log('Found supervisor by ID:', supervisor, 'for supervisor_id:', order.assigned_supervisor_id);
      return supervisor ? supervisor.name : 'مشرف غير معروف';
    }
    
    // إذا لم يكن هناك مشرف معين بعد
    return 'غير معين';
  };

  const getDelegateName = (order: any) => {
    // استخدام delegate_name من الـ view مباشرة
    if (order.delegate_name) {
      return order.delegate_name;
    }
    
    // البحث بالحقل المباشر
    if (order.assigned_delegate_id) {
      const delegate = delegates.find(d => d.id === order.assigned_delegate_id);
      return delegate ? delegate.name : 'مندوب غير معروف';
    }
    
    return 'غير معين';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'new':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'new':
      case 'pending':
        return 'في الانتظار';
      case 'paid':
        return 'مدفوع';
      default:
        return status;
    }
  };

  const assignSupervisor = async (orderId: string, supervisorId: string) => {
    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          supervisorId: supervisorId
        })
      });

      if (response.ok) {
        // إعادة تحميل البيانات
        loadAllData();
        alert('تم تعيين المشرف بنجاح');
      } else {
        alert('فشل في تعيين المشرف');
      }
    } catch (error) {
      console.error('Error assigning supervisor:', error);
      alert('حدث خطأ أثناء تعيين المشرف');
    }
  };

  const assignDelegate = async (orderId: string, delegateId: string) => {
    try {
      const token = Cookies.get('token');
      
      if (!currentUser || !currentUser.id) {
        alert('لا يمكن تحديد هوية المستخدم الحالي');
        return;
      }

      // التحقق من أن المستخدم مخول للتعيين (مشرف أو أدمن)
      if (currentUser.role !== 'supervisor' && currentUser.role !== 'admin') {
        alert('غير مخول لتعيين المندوبين');
        return;
      }
      
      console.log('Assigning delegate with new structure:', {
        orderId,
        delegateId,
        assignedBy: currentUser.id,
        assignedByName: currentUser.name
      });
      
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          assigned_supervisor_id: currentUser.id,
          assigned_delegate_id: delegateId,
          status: 'in_progress'
        })
      });

      if (response.ok) {
        // إعادة تحميل البيانات
        loadAllData();
        alert('تم تعيين المندوب بنجاح');
      } else {
        alert('فشل في تعيين المندوب');
      }
    } catch (error) {
      console.error('Error assigning delegate:', error);
      alert('حدث خطأ أثناء تعيين المندوب');
    }
  };

  const assignAllUnassignedOrders = async () => {
    if (supervisors.length === 0) {
      alert('لا يوجد مشرفين متاحين');
      return;
    }

    const unassignedOrders = orders.filter(order => !order.supervisor_id);
    if (unassignedOrders.length === 0) {
      alert('جميع الطلبات لديها مشرف مُعيّن بالفعل');
      return;
    }

    const defaultSupervisor = supervisors[0];
    
    try {
      for (const order of unassignedOrders) {
        await assignSupervisor(order.id, defaultSupervisor.id);
      }
      alert(`تم تعيين ${unassignedOrders.length} طلب للمشرف ${defaultSupervisor.name}`);
    } catch (error) {
      console.error('Error assigning multiple orders:', error);
      alert('حدث خطأ أثناء تعيين الطلبات');
    }
  };

  useEffect(() => {
    getCurrentUser();
    loadAllData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-6 px-4 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-purple-900">
          لوحة توزيع ومتابعة المهام
        </h1>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg">جاري التحميل...</div>
          </div>
        ) : (
          <>
            {/* معلومات النظام */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">كيف يعمل النظام:</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• الطلبات تُنشأ بدون مشرف محدد - تظهر "لم يُعيّن مشرف بعد"</li>
                <li>• أي مشرف يمكنه تعيين مندوب للطلب</li>
                <li>• بمجرد تعيين مندوب، يصبح المشرف الذي عيّنه مسؤولاً عن الطلب</li>
                <li>• اسم المشرف المسؤول يظهر في العمود ولا يمكن للآخرين تعديل الطلب</li>
              </ul>
            </div>

            {/* إحصائيات عامة */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalOrders}</div>
                <div className="text-gray-600">إجمالي الطلبات</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
                <div className="text-gray-600">طلبات مكتملة</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.inProgressOrders}</div>
                <div className="text-gray-600">قيد التنفيذ</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
                <div className="text-gray-600">في الانتظار</div>
              </div>
            </div>

            {/* جدول الطلبات */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">جميع الطلبات</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-right">رقم الطلب</th>
                      <th className="px-4 py-2 text-right">الخدمة</th>
                      <th className="px-4 py-2 text-right">العميل</th>
                      <th className="px-4 py-2 text-right">المشرف المسؤول</th>
                      <th className="px-4 py-2 text-right">المندوب المعين</th>
                      <th className="px-4 py-2 text-right">حالة الطلب</th>
                      <th className="px-4 py-2 text-right">تاريخ الإنشاء</th>
                      <th className="px-4 py-2 text-right">تعيين مندوب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{order.id}</td>
                        <td className="px-4 py-2">{order.service_name || 'غير محدد'}</td>
                        <td className="px-4 py-2">{order.guardianName}</td>
                        <td className="px-4 py-2">
                          <div>
                            {getSupervisorName(order)}
                            {order.assignedDelegate && (
                              <>
                                <br />
                                <small className="text-green-600">مسؤول عن الطلب</small>
                              </>
                            )}
                            {!order.assignedDelegate && (
                              <>
                                <br />
                                <small className="text-orange-600">في انتظار تعيين مندوب</small>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {getDelegateName(order)}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-sm ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {new Date(order.created_at).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-4 py-2">
                          {!order.assignedDelegate && delegates.length > 0 && (
                            <select 
                              className="text-sm border rounded px-2 py-1"
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignDelegate(order.id, e.target.value);
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="">تعيين مندوب</option>
                              {delegates.map(delegate => (
                                <option key={delegate.id} value={delegate.id}>
                                  {delegate.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {order.assignedDelegate && (
                            <span className="text-green-600 text-sm">مُعيّن لمندوب</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {orders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">لا توجد طلبات</div>
                )}
              </div>
            </div>

            {/* إحصائيات المندوبين */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">إحصائيات المندوبين</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-right">اسم المندوب</th>
                      <th className="px-4 py-2 text-right">البريد الإلكتروني</th>
                      <th className="px-4 py-2 text-right">الطلبات المعينة</th>
                      <th className="px-4 py-2 text-right">الطلبات المكتملة</th>
                      <th className="px-4 py-2 text-right">معدل الإنجاز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delegateStats.map(delegate => (
                      <tr key={delegate.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{delegate.name}</td>
                        <td className="px-4 py-2">{delegate.email}</td>
                        <td className="px-4 py-2">{delegate.totalAssigned}</td>
                        <td className="px-4 py-2">{delegate.completedOrders}</td>
                        <td className="px-4 py-2">
                          {delegate.totalAssigned > 0 
                            ? `${Math.round((delegate.completedOrders / delegate.totalAssigned) * 100)}%`
                            : '0%'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {delegateStats.length === 0 && (
                  <div className="text-center py-8 text-gray-500">لا توجد مندوبين</div>
                )}
              </div>
            </div>

            {/* إحصائيات المشرفين */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">إحصائيات المشرفين</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-right">اسم المشرف</th>
                      <th className="px-4 py-2 text-right">البريد الإلكتروني</th>
                      <th className="px-4 py-2 text-right">إجمالي الطلبات</th>
                      <th className="px-4 py-2 text-right">الطلبات المكتملة</th>
                      <th className="px-4 py-2 text-right">قيد التنفيذ</th>
                      <th className="px-4 py-2 text-right">في الانتظار</th>
                      <th className="px-4 py-2 text-right">معدل الإنجاز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supervisorStats.map(supervisor => (
                      <tr key={supervisor.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{supervisor.name}</td>
                        <td className="px-4 py-2">{supervisor.email}</td>
                        <td className="px-4 py-2">{supervisor.totalOrders}</td>
                        <td className="px-4 py-2">{supervisor.completedOrders}</td>
                        <td className="px-4 py-2">{supervisor.inProgressOrders}</td>
                        <td className="px-4 py-2">{supervisor.pendingOrders}</td>
                        <td className="px-4 py-2">
                          {supervisor.totalOrders > 0 
                            ? `${Math.round((supervisor.completedOrders / supervisor.totalOrders) * 100)}%`
                            : '0%'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {supervisorStats.length === 0 && (
                  <div className="text-center py-8 text-gray-500">لا توجد مشرفين</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}