'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';
import { useRouter } from 'next/navigation';

interface Review {
  id: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  users: {
    name: string;
    email: string;
  };
  orders: {
    id: string;
    services: {
      name: string;
    };
  };
}

interface DecodedToken {
  userId: string;
  role: string;
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwt_decode<DecodedToken>(token);
      if (decoded.role !== 'admin') {
        router.push('/');
        return;
      }
      fetchReviews();
    } catch {
      router.push('/login');
    }
  }, [router]);

  const fetchReviews = async () => {
    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/admin/reviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (id: string, updates: { is_approved?: boolean; is_featured?: boolean }) => {
    setActionLoading(id);
    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...updates })
      });

      if (response.ok) {
        setReviews(prev => prev.map(r => 
          r.id === id ? { ...r, ...updates } : r
        ));
      }
    } catch (error) {
      console.error('Error updating review:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;

    setActionLoading(id);
    try {
      const token = Cookies.get('token');
      const response = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setReviews(prev => prev.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReviews = reviews.filter(review => {
    switch (filter) {
      case 'pending':
        return !review.is_approved;
      case 'approved':
        return review.is_approved;
      case 'featured':
        return review.is_featured;
      default:
        return true;
    }
  });

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة التقييمات</h1>
              <p className="text-gray-600 mt-1">مراجعة والموافقة على تقييمات العملاء</p>
            </div>
            <a
              href="/admin"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              العودة للوحة التحكم
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-gray-900">{reviews.length}</div>
            <div className="text-sm text-gray-500">إجمالي التقييمات</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-yellow-600">
              {reviews.filter(r => !r.is_approved).length}
            </div>
            <div className="text-sm text-gray-500">بانتظار الموافقة</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-green-600">
              {reviews.filter(r => r.is_approved).length}
            </div>
            <div className="text-sm text-gray-500">معتمدة</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-purple-600">
              {reviews.filter(r => r.is_featured).length}
            </div>
            <div className="text-sm text-gray-500">مميزة</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'pending', label: 'بانتظار الموافقة' },
              { key: 'approved', label: 'معتمدة' },
              { key: 'featured', label: 'مميزة' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="mt-4 text-gray-600">لا توجد تقييمات في هذا القسم</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map(review => (
              <div
                key={review.id}
                className={`bg-white rounded-lg shadow overflow-hidden ${
                  !review.is_approved ? 'border-r-4 border-yellow-400' : ''
                } ${review.is_featured ? 'ring-2 ring-purple-400' : ''}`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    {/* Review Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {review.users?.name?.charAt(0) || '؟'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{review.users?.name || 'غير معروف'}</h3>
                          <p className="text-sm text-gray-500">{review.users?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {review.orders?.services?.name || 'خدمة'}
                        </span>
                      </div>

                      {review.comment && (
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                          "{review.comment}"
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>
                          {new Date(review.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        {review.is_approved && (
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                            معتمد ✓
                          </span>
                        )}
                        {review.is_featured && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                            ⭐ مميز
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 mr-4">
                      {!review.is_approved ? (
                        <button
                          onClick={() => updateReview(review.id, { is_approved: true })}
                          disabled={actionLoading === review.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          {actionLoading === review.id ? '...' : 'موافقة'}
                        </button>
                      ) : (
                        <button
                          onClick={() => updateReview(review.id, { is_approved: false })}
                          disabled={actionLoading === review.id}
                          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-sm"
                        >
                          {actionLoading === review.id ? '...' : 'إلغاء الموافقة'}
                        </button>
                      )}

                      <button
                        onClick={() => updateReview(review.id, { is_featured: !review.is_featured })}
                        disabled={actionLoading === review.id}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          review.is_featured
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        } disabled:opacity-50`}
                      >
                        {review.is_featured ? 'إزالة التميز' : '⭐ تمييز'}
                      </button>

                      <button
                        onClick={() => deleteReview(review.id)}
                        disabled={actionLoading === review.id}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 disabled:opacity-50 text-sm"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
