'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export default function TasksManagement() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [delegates, setDelegates] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // حالة المودال لتعديل التعيينات
  const [assignmentModal, setAssignmentModal] = useState<{
    isOpen: boolean;
    orderId: string | null;
    currentSupervisor: string | null;
    currentDelegate: string | null;
    newSupervisor: string;
    newDelegate: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    orderId: null,
    currentSupervisor: null,
    currentDelegate: null,
    newSupervisor: '',
    newDelegate: '',
    isLoading: false
  });
  
  // إحصائيات عامة
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    pendingCancellationOrders: 0
  });
  
  // إحصائيات المندوبين
  const [delegateStats, setDelegateStats] = useState<any[]>([]);
  
  // إحصائيات المشرفين
  const [supervisorStats, setSupervisorStats] = useState<any[]>([]);

  // حالة إشعارات طلبات الإلغاء
  const [cancellationRequests, setCancellationRequests] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [rejectingCancellation, setRejectingCancellation] = useState<string | null>(null);
  const [cancellationRejectReason, setCancellationRejectReason] = useState<{ [key: string]: string }>({});
  
  // فتح مودال تعديل التعيينات
  const openAssignmentModal = (order: any) => {
    setAssignmentModal({
      isOpen: true,
      orderId: order.id,
      currentSupervisor: order.assigned_supervisor_id,
      currentDelegate: order.assigned_delegate_id,
      newSupervisor: order.assigned_supervisor_id || '',
      newDelegate: order.assigned_delegate_id || '',
      isLoading: false
    });
  };

  // إغلاق مودال تعديل التعيينات
  const closeAssignmentModal = () => {
    setAssignmentModal({
      isOpen: false,
      orderId: null,
      currentSupervisor: null,
      currentDelegate: null,
      newSupervisor: '',
      newDelegate: '',
      isLoading: false
    });
  };

  // حفظ التعيينات الجديدة
  const saveNewAssignments = async () => {
    if (!assignmentModal.orderId) return;

    // التحقق من أن يكون هناك تغيير واحد على الأقل
    if (
      assignmentModal.newSupervisor === assignmentModal.currentSupervisor &&
      assignmentModal.newDelegate === assignmentModal.currentDelegate
    ) {
      alert('يجب تغيير المشرف أو المندوب');
      return;
    }

    try {
      setAssignmentModal(prev => ({ ...prev, isLoading: true }));
      const token = Cookies.get('token');

      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: assignmentModal.orderId,
          assigned_supervisor_id: assignmentModal.newSupervisor || null,
          assigned_delegate_id: assignmentModal.newDelegate || null
        })
      });

      if (response.ok) {
        alert('تم تحديث التعيينات بنجاح');
        closeAssignmentModal();
        loadAllData();
      } else {
        const error = await response.json();
        alert(error.error || 'فشل تحديث التعيينات');
      }
    } catch (error) {
      console.error('Error updating assignments:', error);
      alert('حدث خطأ أثناء تحديث التعيينات');
    } finally {
      setAssignmentModal(prev => ({ ...prev, isLoading: false }));
    }
  };

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
      completedOrders: orders.filter(o => o.status === 'تم الانتهاء').length,
      inProgressOrders: orders.filter(o => o.status === 'تحت الإجراء').length,
      pendingOrders: orders.filter(o => o.status === 'new' || o.status === 'تعيين مشرف' || o.status === 'تعيين مندوب').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      pendingCancellationOrders: orders.filter(o => o.metadata?.cancellation_requested === true).length
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
      case 'تعيين مشرف':
        return 'bg-red-100 text-red-800';
      case 'تعيين مندوب':
        return 'bg-orange-100 text-orange-800';
      case 'تحت الإجراء':
        return 'bg-blue-100 text-blue-800';
      case 'مطلوب بيانات إضافية أو مرفقات':
        return 'bg-yellow-100 text-yellow-800';
      case 'بانتظار رد العميل':
        return 'bg-purple-100 text-purple-800';
      case 'تم الانتهاء بنجاح':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status || 'تعيين مشرف';
  };

  const validStatusOptions = [
    { value: 'تعيين مشرف', label: 'تعيين مشرف' },
    { value: 'تعيين مندوب', label: 'تعيين مندوب' },
    { value: 'تحت الإجراء', label: 'تحت الإجراء' },
    { value: 'مطلوب بيانات إضافية أو مرفقات', label: 'مطلوب بيانات إضافية أو مرفقات' },
    { value: 'بانتظار رد العميل', label: 'بانتظار رد العميل' },
    { value: 'تم الانتهاء بنجاح', label: 'تم الانتهاء بنجاح' }
  ];

  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      const token = Cookies.get('token');
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        loadAllData();
        alert('تم تحديث حالة الطلب بنجاح');
      } else {
        const error = await response.json();
        alert(error.error || 'فشل تحديث حالة الطلب');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('حدث خطأ أثناء تحديث الحالة');
    } finally {
      setUpdatingStatus(null);
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

  const fetchCancellationRequests = async () => {
    try {
      setLoadingNotifications(true);
      const token = Cookies.get('token');
      
      // استخدام الـ API الصحيح - delegate-completion
      const response = await fetch('/api/delegate-completion?status=unread', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // تصفية طلبات الإلغاء فقط (Admin يرى الكل، بما في ذلك التي supervisor_id = NULL)
        const requests = (data.notifications || []).filter((notif: any) => notif.type === 'cancellation_request');
        setCancellationRequests(requests);
        console.log('Cancellation requests for Admin:', requests);
      }
    } catch (error) {
      console.error('Error fetching cancellation requests:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleRejectCancellation = async (notificationId: string, orderId: string) => {
    const reason = cancellationRejectReason[notificationId];
    if (!reason.trim()) {
      alert('الرجاء إدخال سبب الرفض');
      return;
    }

    try {
      setRejectingCancellation(notificationId);
      const token = Cookies.get('token');

      const response = await fetch(`/api/orders/${orderId}/respond-to-cancellation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'reject',
          reason: reason.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('تم رفض طلب الإلغاء بنجاح');
        setCancellationRejectReason(prev => {
          const updated = { ...prev };
          delete updated[notificationId];
          return updated;
        });
        
        // حذف الإشعار بعد الرفض
        await fetch('/api/delegate-completion', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ notificationId, status: 'dismissed' })
        });
        
        fetchCancellationRequests();
        loadAllData(); // إعادة تحميل الطلبات
      } else {
        alert(data.error || 'فشل في رفض الطلب');
      }
    } catch (error) {
      console.error('Error rejecting cancellation:', error);
      alert('حدث خطأ أثناء معالجة الطلب');
    } finally {
      setRejectingCancellation(null);
    }
  };

  const handleApproveCancellation = async (notificationId: string, orderId: string) => {
    if (!window.confirm('هل تريد الموافقة على إلغاء الطلب؟')) {
      return;
    }

    try {
      setRejectingCancellation(notificationId);
      const token = Cookies.get('token');

      const response = await fetch(`/api/orders/${orderId}/respond-to-cancellation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'approve'
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('تم الموافقة على إلغاء الطلب بنجاح');
        
        // حذف الإشعار بعد الموافقة
        await fetch('/api/delegate-completion', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ notificationId, status: 'acknowledged' })
        });
        
        fetchCancellationRequests();
        loadAllData(); // إعادة تحميل الطلبات
      } else {
        alert(data.error || 'فشل في الموافقة على الطلب');
      }
    } catch (error) {
      console.error('Error approving cancellation:', error);
      alert('حدث خطأ أثناء معالجة الطلب');
    } finally {
      setRejectingCancellation(null);
    }
  };

  useEffect(() => {
    getCurrentUser();
    loadAllData();
    fetchCancellationRequests();
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalOrders}</div>
                <div className="text-gray-600 text-sm">إجمالي الطلبات</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
                <div className="text-gray-600 text-sm">طلبات مكتملة</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.inProgressOrders}</div>
                <div className="text-gray-600 text-sm">قيد التنفيذ</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
                <div className="text-gray-600 text-sm">في الانتظار</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</div>
                <div className="text-gray-600 text-sm">طلبات ملغية</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.pendingCancellationOrders}</div>
                <div className="text-gray-600 text-sm">طلبات إلغاء معلقة</div>
              </div>
            </div>

            {/* قسم طلبات الإلغاء */}
            {cancellationRequests.length > 0 && (
              <div className="mb-8 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                    ⚠️ طلبات الإلغاء المعلقة ({cancellationRequests.length})
                  </h2>
                  <button
                    onClick={fetchCancellationRequests}
                    className="text-orange-600 hover:text-orange-800 text-sm"
                    disabled={loadingNotifications}
                  >
                    {loadingNotifications ? 'جاري التحديث...' : '↻ تحديث'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  {cancellationRequests.map((request) => (
                    <div key={request.id} className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-orange-700 mb-2">
                            🔢 رقم الطلب: #{request.order_id.slice(-8).toUpperCase()}
                          </p>
                          <p className="text-gray-700 mb-2">
                            {request.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.created_at).toLocaleString('ar-SA')}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {/* زر قبول الإلغاء */}
                          <button
                            onClick={() => handleApproveCancellation(request.id, request.order_id)}
                            disabled={rejectingCancellation === request.id}
                            className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            ✓ قبول الإلغاء
                          </button>
                          
                          {/* منطقة رفض الإلغاء مع إدخال السبب */}
                          <div className="flex flex-col gap-1">
                            <textarea
                              placeholder="اكتب سبب الرفض..."
                              value={cancellationRejectReason[request.id] || ''}
                              onChange={(e) => setCancellationRejectReason(prev => ({
                                ...prev,
                                [request.id]: e.target.value
                              }))}
                              className="text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                              rows={2}
                            />
                            <button
                              onClick={() => handleRejectCancellation(request.id, request.order_id)}
                              disabled={rejectingCancellation === request.id}
                              className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                            >
                              {rejectingCancellation === request.id ? 'جاري الإرسال...' : 'رفض الإلغاء'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      <th className="px-4 py-2 text-right">تحديث الحالة</th>
                      <th className="px-4 py-2 text-right">تاريخ الإنشاء</th>
                      <th className="px-4 py-2 text-right">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => {
                      const isOrderDisabled = order.status === 'cancelled' || 
                                             (order.metadata && order.metadata.cancellation_requested === true);
                      
                      return (
                      <tr key={order.id} className={`border-b hover:bg-gray-50 ${isOrderDisabled ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-2">
                          <div className="flex flex-col gap-1">
                            <span>{order.id.slice(-8).toUpperCase()}</span>
                            {isOrderDisabled && order.metadata?.cancellation_requested && (
                              <span className="text-xs text-red-600 font-medium">⚠️ طلب إلغاء معلق</span>
                            )}
                            {order.status === 'cancelled' && (
                              <span className="text-xs text-red-600 font-medium">✖ ملغي</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {order.metadata?.serviceName || order.service_name || 'غير محدد'}
                        </td>
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
                          <select 
                            className="text-sm border rounded px-2 py-1 w-full"
                            value={order.status || 'تعيين مشرف'}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            disabled={updatingStatus === order.id || isOrderDisabled}
                            title={isOrderDisabled ? 'الطلب ملغي أو له طلب إلغاء معلق' : ''}
                          >
                            {validStatusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {updatingStatus === order.id && (
                            <span className="text-xs text-blue-600">جاري التحديث...</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(order.created_at).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => openAssignmentModal(order)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={isOrderDisabled}
                            title={isOrderDisabled ? 'الطلب ملغي أو له طلب إلغاء معلق' : ''}
                          >
                            تعديل التعيينات
                          </button>
                        </td>
                      </tr>
                      );
                    })}
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

        {/* مودال تعديل التعيينات */}
        {assignmentModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-purple-900">تعديل التعيينات</h2>
              
              <div className="space-y-4">
                {/* تحديد المشرف */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    المشرف المسؤول
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-right"
                    value={assignmentModal.newSupervisor}
                    onChange={(e) =>
                      setAssignmentModal(prev => ({
                        ...prev,
                        newSupervisor: e.target.value
                      }))
                    }
                  >
                    <option value="">-- اختر مشرفاً --</option>
                    {supervisors.map(supervisor => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.name} ({supervisor.email})
                      </option>
                    ))}
                  </select>
                  {assignmentModal.currentSupervisor && (
                    <p className="text-xs text-gray-500 mt-1">
                      المشرف الحالي: {supervisors.find(s => s.id === assignmentModal.currentSupervisor)?.name || 'غير محدد'}
                    </p>
                  )}
                </div>

                {/* تحديد المندوب */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    المندوب المعين
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-right"
                    value={assignmentModal.newDelegate}
                    onChange={(e) =>
                      setAssignmentModal(prev => ({
                        ...prev,
                        newDelegate: e.target.value
                      }))
                    }
                  >
                    <option value="">-- اختر مندوباً --</option>
                    {delegates.map(delegate => (
                      <option key={delegate.id} value={delegate.id}>
                        {delegate.name} ({delegate.email})
                      </option>
                    ))}
                  </select>
                  {assignmentModal.currentDelegate && (
                    <p className="text-xs text-gray-500 mt-1">
                      المندوب الحالي: {delegates.find(d => d.id === assignmentModal.currentDelegate)?.name || 'غير محدد'}
                    </p>
                  )}
                </div>

                {/* الأزرار */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button
                    onClick={closeAssignmentModal}
                    disabled={assignmentModal.isLoading}
                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 transition disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={saveNewAssignments}
                    disabled={assignmentModal.isLoading}
                    className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition disabled:opacity-50"
                  >
                    {assignmentModal.isLoading ? 'جاري الحفظ...' : 'حفظ التعيينات'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}