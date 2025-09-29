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

export default function DelegateTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [delegateId, setDelegateId] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<UserPayload>(token);
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

  const handleDone = async (taskId: string) => {
    setUpdating(taskId);
    try {
      const token = Cookies.get('token');
      if (!token) return;
      
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          orderId: taskId,
          status: 'completed'
        }),
      });
      
      if (res.ok) {
        // تحديث البيانات محلياً
        setTasks(prev => prev.map(task => {
          if (task.id === taskId) {
            return { 
              ...task, 
              status: 'completed',
              completed_by: delegateId,
              completed_at: new Date().toISOString()
            };
          }
          return task;
        }));
        
        // رسالة نجاح
        alert('تم إكمال المهمة بنجاح! ✅');
      } else {
        const errorData = await res.json();
        alert('خطأ: ' + (errorData.error || 'حدث خطأ أثناء إكمال المهمة'));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-6">مهامي كمندوب</h2>
      <div className="mb-4 p-4 bg-blue-50 rounded">
        <p><strong>معرف المندوب:</strong> {delegateId}</p>
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
                    طلب رقم {task.id.substring(0, 8)}
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
                     task.status === 'in progress' || task.status === 'in_progress' ? 'قيد التنفيذ' : 
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
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-400"
                    disabled={task.status === 'completed' || updating === task.id}
                    onClick={() => handleDone(task.id)}
                  >
                    {updating === task.id ? '...جارٍ الحفظ' : 'تم التنفيذ'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 