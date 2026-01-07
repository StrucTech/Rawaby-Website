'use client';

import { useState, useEffect } from 'react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer_name: string;
  service_name: string;
  is_featured: boolean;
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews?limit=6');
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل التقييمات...</p>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null; // لا تعرض القسم إذا لم توجد تقييمات
  }

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      <div className="container mx-auto px-4">
        {/* العنوان */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ماذا يقول عملاؤنا؟
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            نفخر بثقة عملائنا وتقييماتهم الإيجابية. اكتشف تجاربهم مع خدماتنا
          </p>
          
          {/* إحصائيات سريعة */}
          <div className="flex justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{reviews.length}+</div>
              <div className="text-sm text-gray-500">تقييم</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                {reviews.length > 0 
                  ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                  : '5.0'}
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="text-sm text-gray-500">متوسط التقييم</div>
            </div>
          </div>
        </div>

        {/* بطاقات التقييمات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                review.is_featured ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              {/* شارة مميز */}
              {review.is_featured && (
                <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                  ⭐ مميز
                </div>
              )}
              
              {/* الهيدر */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* أفاتار */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {review.customer_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.customer_name}</h4>
                    <p className="text-sm text-gray-500">{review.service_name}</p>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>

              {/* التعليق */}
              {review.comment && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  "{review.comment}"
                </p>
              )}

              {/* التاريخ */}
              <div className="flex items-center text-sm text-gray-400 mt-auto">
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(review.created_at)}
              </div>
            </div>
          ))}
        </div>

        {/* رابط لعرض المزيد */}
        <div className="text-center mt-10">
          <a
            href="/reviews"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            عرض جميع التقييمات
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
