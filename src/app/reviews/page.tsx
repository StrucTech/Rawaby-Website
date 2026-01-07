'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer_name: string;
  service_name: string;
  is_featured: boolean;
}

export default function AllReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews?limit=50');
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = selectedRating
    ? reviews.filter(r => r.rating === selectedRating)
    : reviews;

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0
      ? Math.round((reviews.filter(r => r.rating === rating).length / reviews.length) * 100)
      : 0
  }));

  const renderStars = (rating: number, size: string = 'w-5 h-5') => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          className={`${size} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل التقييمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">آراء عملائنا</h1>
            <p className="text-blue-100 max-w-2xl mx-auto">
              نفخر بثقة عملائنا وتقييماتهم. اكتشف تجارب العملاء الذين استخدموا خدماتنا
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Rating Summary */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              {/* Average Rating */}
              <div className="text-center mb-6 pb-6 border-b">
                <div className="text-5xl font-bold text-gray-900 mb-2">{averageRating}</div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(parseFloat(averageRating)), 'w-6 h-6')}
                </div>
                <p className="text-gray-500">{reviews.length} تقييم</p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-4">توزيع التقييمات</h3>
                {ratingCounts.map(({ rating, count, percentage }) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      selectedRating === rating
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm font-medium w-4">{rating}</span>
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </button>
                ))}
              </div>

              {selectedRating && (
                <button
                  onClick={() => setSelectedRating(null)}
                  className="w-full mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  عرض جميع التقييمات
                </button>
              )}

              {/* CTA */}
              <div className="mt-6 pt-6 border-t">
                <Link
                  href="/services"
                  className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                  استكشف خدماتنا
                </Link>
              </div>
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="flex-1">
            {selectedRating && (
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <span>عرض تقييمات</span>
                {renderStars(selectedRating, 'w-4 h-4')}
                <span>({filteredReviews.length} تقييم)</span>
              </div>
            )}

            {filteredReviews.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="mt-4 text-gray-600">لا توجد تقييمات بعد</p>
                <p className="text-gray-500 text-sm mt-2">كن أول من يقيّم خدماتنا!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className={`bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl ${
                      review.is_featured ? 'ring-2 ring-yellow-400' : ''
                    }`}
                  >
                    {review.is_featured && (
                      <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full mb-4">
                        ⭐ تقييم مميز
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {review.customer_name.charAt(0)}
                      </div>

                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{review.customer_name}</h3>
                          {renderStars(review.rating)}
                        </div>

                        {/* Service */}
                        <p className="text-sm text-blue-600 mb-3">{review.service_name}</p>

                        {/* Comment */}
                        {review.comment && (
                          <p className="text-gray-700 leading-relaxed">
                            "{review.comment}"
                          </p>
                        )}

                        {/* Date */}
                        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(review.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
