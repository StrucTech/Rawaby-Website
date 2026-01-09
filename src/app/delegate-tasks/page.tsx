'use client';
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';
import { useActiveStatusCheck } from '@/components/ActiveStatusChecker';

interface UserPayload {
  userId: string;
  role: string;
  name: string;
  email: string;
}

export default function DelegateTasksPage() {
  // التحقق من حالة النشاط كل 30 ثانية
  useActiveStatusCheck({ checkInterval: 30000 });

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [delegateId, setDelegateId] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decodedToken = jwt_decode<UserPayload>(token);
        if (decodedToken.role === 'delegate') {
          setDelegateId(decodedToken.userId);
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
    if (!delegateId) return;
    
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('token');
        if (!token) return;
        
        const res = await fetch('/api/orders?delegateId=' + delegateId, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await res.json();
        if (res.ok) {
          setTasks(data.orders || []);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [delegateId]);

  // إرسال إشعار للمشرف بإتمام المهمة (لا يغير حالة الطلب)
  const handleDone = async (taskId: string) => {
    if (!confirm('هل أنت متأكد من إرسال إشعار للمشرف بإتمام هذه المهمة؟')) {
      return;
    }
    
    setUpdating(taskId);
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      // إرسال إشعار للمشرف بدلاً من تغيير حالة الطلب
      const res = await fetch('/api/delegate-completion', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          orderId: taskId,
          message: 'تم إتمام المهمة بنجاح من قبل المندوب'
        }),
      });
      
      if (res.ok) {
        // تحديث البيانات محلياً - إضافة علامة أنه تم إرسال الإشعار
        setTasks(prev => prev.map(task => {
          if (task.id === taskId) {
            return { 
              ...task, 
              notificationSent: true,
              notificationSentAt: new Date().toISOString()
            };
          }
          return task;
        }));
        
        // رسالة نجاح
        alert('✅ تم إرسال إشعار للمشرف بإتمام المهمة. سينتظر الطلب موافقة المشرف لتغيير الحالة.');
      } else {
        const errorData = await res.json();
        if (errorData.sql) {
          console.log('SQL to create table:', errorData.sql);
          alert('يرجى إنشاء جدول الإشعارات أولاً. راجع وحدة التحكم للحصول على SQL.');
        } else {
          alert('خطأ: ' + (errorData.error || 'حدث خطأ أثناء إرسال الإشعار'));
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-6">مهامي كمندوب</h2>
      <div className="mb-4 p-4 bg-blue-50 rounded">
        <p><strong>عدد المهام:</strong> {tasks.length}</p>
      </div>
      <table className="w-full border rounded">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">رقم الطلب</th>
            <th className="p-2">اسم الطالب</th>
            <th className="p-2">اسم ولي الأمر</th>
            <th className="p-2">رقم الهاتف</th>
            <th className="p-2">الخدمات</th>
            <th className="p-2">الحالة</th>
            <th className="p-2">تاريخ التعيين</th>
            <th className="p-2">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="text-center p-4">جاري التحميل...</td></tr>
          ) : tasks.length === 0 ? (
            <tr><td colSpan={8} className="text-center p-4">لا توجد مهام حالياً</td></tr>
          ) : tasks.map(task => {
            console.log('Individual task:', task);
            // استخدام metadata بدلاً من note
            const taskData = task.metadata || {};
            console.log('Task metadata:', taskData);
            
            return (
              <tr key={task.id}>
                <td className="p-2">
                  <button 
                    className="text-blue-600 hover:text-blue-800 underline"
                    onClick={() => window.open(`/order-details/${task.id}`, '_blank')}
                  >
                    طلب رقم {task.id.slice(-8).toUpperCase()}
                  </button>
                </td>
                <td className="p-2">{taskData.studentInfo?.name || taskData.guardianName || 'غير محدد'}</td>
                <td className="p-2">{taskData.guardianName || 'غير محدد'}</td>
                <td className="p-2">{task.client?.phone || 'غير محدد'}</td>
                <td className="p-2">
                  <div className="text-sm">
                    {taskData.serviceName || 'غير محدد'}
                  </div>
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {task.status === 'completed' ? '✓ تم التنفيذ' : 
                     task.status === 'in progress' || task.status === 'in_progress' ? 'جاري العمل' : 
                     'معلق'}
                  </span>
                </td>
                <td className="p-2 text-sm">
                  {task.assigned_at ? (
                    <div className="text-gray-600">
                      {new Date(task.assigned_at).toLocaleDateString('ar-SA')}
                      <br />
                      <span className="text-xs">{new Date(task.assigned_at).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">غير محدد</span>
                  )}
                </td>
                <td className="p-2">
                  {task.notificationSent ? (
                    <span className="text-green-600 text-sm">
                      ✅ تم إبلاغ المشرف
                    </span>
                  ) : task.status === 'تم الانتهاء بنجاح' ? (
                    <span className="text-green-600 text-sm">
                      ✓ تم الانتهاء
                    </span>
                  ) : (
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-400"
                      disabled={updating === task.id}
                      onClick={() => handleDone(task.id)}
                    >
                      {updating === task.id ? '...جارٍ الإرسال' : 'إبلاغ المشرف بالإتمام'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 