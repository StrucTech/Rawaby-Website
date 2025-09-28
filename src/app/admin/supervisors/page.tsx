'use client';
import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import Cookies from 'js-cookie';

export default function SupervisorsPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', nationalId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', email: '', phone: '', nationalId: '' });
  const [editLoading, setEditLoading] = useState(false);

  const fetchSupervisors = async () => {
    setFetching(true);
    try {
      const token = Cookies.get('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      
      const res = await fetch('/api/admin/supervisors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      console.log('API Response:', data);
      console.log('Response status:', res.status);
      
      if (res.ok) {
        setSupervisors(data.supervisors || []);
        console.log('Supervisors loaded:', data.supervisors?.length || 0);
      } else {
        console.error('Error fetching supervisors:', data.error);
        setSupervisors([]); // تأكد من إفراغ القائمة في حالة الخطأ
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = Cookies.get('token');
      if (!token) {
        setError('يجب تسجيل الدخول أولاً');
        return;
      }
      
      const res = await fetch('/api/admin/supervisors', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
      } else {
        setSuccess('تم إضافة المشرف بنجاح');
        setForm({ name: '', email: '', phone: '', nationalId: '', password: '' });
        fetchSupervisors();
        setTimeout(() => setShowModal(false), 1200);
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // فتح نافذة تعديل المشرف
  const openEditModal = (supervisor: any) => {
    setEditForm({
      id: supervisor.id,
      name: supervisor.name,
      email: supervisor.email,
      phone: supervisor.phone,
      nationalId: supervisor.national_id
    });
    setEditModal(true);
  };

  // معالجة تغيير بيانات التعديل
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // حفظ تعديلات المشرف
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = Cookies.get('token');
      if (!token) {
        setError('يجب تسجيل الدخول أولاً');
        return;
      }

      const res = await fetch(`/api/admin/supervisors/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          nationalId: editForm.nationalId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'حدث خطأ في التحديث');
      } else {
        setSuccess('تم تحديث بيانات المشرف بنجاح');
        fetchSupervisors();
        setTimeout(() => {
          setEditModal(false);
          setSuccess('');
          setError('');
        }, 1500);
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-6">إدارة المشرفين</h2>
      <div className="mb-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowModal(true)}>إضافة مشرف جديد</button>
      </div>
      <table className="w-full border rounded">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">الاسم</th>
            <th className="p-2">البريد الإلكتروني</th>
            <th className="p-2">رقم الجوال</th>
            <th className="p-2">الرقم القومي</th>
            <th className="p-2">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {fetching ? (
            <tr><td colSpan={5} className="text-center p-4">جاري التحميل...</td></tr>
          ) : supervisors.length === 0 ? (
            <tr><td colSpan={5} className="text-center p-4">لا يوجد مشرفون</td></tr>
          ) : supervisors.map((s) => (
            <tr key={s.id}>
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.email}</td>
              <td className="p-2">{s.phone}</td>
              <td className="p-2">{s.national_id}</td>
              <td className="p-2 flex gap-2">
                <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" onClick={() => openEditModal(s)}>تعديل</button>
                <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" onClick={async () => {
                  if (!window.confirm('هل أنت متأكد من حذف هذا المشرف؟')) return;
                  const token = Cookies.get('token');
                  if (!token) return;
                  await fetch(`/api/admin/supervisors?id=${s.id}`, { 
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  fetchSupervisors();
                }}>حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal إضافة مشرف */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 left-2 text-gray-500" onClick={() => setShowModal(false)}>&times;</button>
            <h3 className="text-xl font-bold mb-4">إضافة مشرف جديد</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="name" value={form.name} onChange={handleChange} className="w-full border p-2 rounded" placeholder="الاسم" required />
              <input name="email" value={form.email} onChange={handleChange} className="w-full border p-2 rounded" placeholder="البريد الإلكتروني" type="email" required />
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full border p-2 rounded" placeholder="رقم الجوال" required />
              <input name="nationalId" value={form.nationalId} onChange={handleChange} className="w-full border p-2 rounded" placeholder="الرقم القومي" required />
              <input name="password" value={form.password} onChange={handleChange} className="w-full border p-2 rounded" placeholder="كلمة المرور" type="password" required />
              {error && <div className="text-red-600 text-center">{error}</div>}
              {success && <div className="text-green-600 text-center">{success}</div>}
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full" disabled={loading}>
                {loading ? 'جاري الإضافة...' : 'إضافة'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal تعديل المشرف */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 left-2 text-gray-500 text-xl" onClick={() => setEditModal(false)}>&times;</button>
            <h3 className="text-xl font-bold mb-4">تعديل بيانات المشرف</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الجوال</label>
                <input
                  type="text"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">الرقم القومي</label>
                <input
                  type="text"
                  name="nationalId"
                  value={editForm.nationalId}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
              {success && <div className="text-green-500 text-sm mb-4">{success}</div>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {editLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 