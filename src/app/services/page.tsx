'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';

interface Service {
  id: string; // UUID من قاعدة البيانات
  title: string;
  description: string;
  duration_days?: number; // من قاعدة البيانات
  duration?: string; // للعرض
  price: number;
  category?: string;
  active?: boolean;
}

const ServicesPage: React.FC = () => {
  const router = useRouter();
  const [cart, setCart] = useState<string[]>([]); // تغيير إلى string[] للـ UUIDs
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [cartCleared, setCartCleared] = useState(false);

  // جلب الخدمات من قاعدة البيانات
  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      } else {
        console.error('فشل في جلب الخدمات');
      }
    } catch (error) {
      console.error('خطأ في جلب الخدمات:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // التحقق من وجود عناصر قديمة برقم بدلاً من UUID
        const hasOldItems = parsedCart.some((item: any) => 
          typeof item === 'number' || (typeof item === 'string' && !item.includes('-'))
        );
        
        if (hasOldItems) {
          // مسح السلة القديمة
          console.log('مسح السلة القديمة التي تحتوي على معرفات رقمية');
          localStorage.removeItem('cart');
          localStorage.removeItem('orderDetails');
          localStorage.removeItem('completeOrderDetails');
          setCart([]);
          setCartCleared(true);
        } else {
          setCart(parsedCart);
        }
      } catch (error) {
        console.error('خطأ في تحميل السلة:', error);
        localStorage.removeItem('cart');
        setCart([]);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (serviceId: string) => {
    setCart([...cart, serviceId]);
  };

  const removeFromCart = (serviceId: string) => {
    setCart(cart.filter(id => id !== serviceId));
  };

  const isInCart = (serviceId: string) => {
    return cart.includes(serviceId);
  };

  const handleContinueOrder = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is logged in using cookies
      const token = Cookies.get('token');
      if (!token) {
        // If not logged in, redirect to login page with return URL
        router.push('/login?redirectTo=/services');
        return;
      }

      // Verify token is valid
      try {
        jwt_decode(token);
      } catch (error) {
        // If token is invalid, clear it and redirect to login
        Cookies.remove('token');
        router.push('/login?redirectTo=/services');
        return;
      }

      // Calculate total price
      const totalPrice = cart.reduce((total, serviceId) => {
        const service = services.find(s => s.id === serviceId);
        return total + (service?.price || 0);
      }, 0);

      // Save order details to localStorage
      const orderDetails = {
        services: cart.map(id => services.find(s => s.id === id)),
        totalPrice,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('orderDetails', JSON.stringify(orderDetails));

      // Redirect to cart page
      router.push('/cart');
    } catch (error) {
      console.error('Error processing order:', error);
      alert('حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            خدماتنا التعليمية
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            مجموعة متكاملة من الخدمات التعليمية المتميزة
          </p>
          
          {/* رسالة إعلامية عند مسح السلة القديمة */}
          {cartCleared && (
            <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mx-auto max-w-md">
              <p className="text-sm">
                تم تحديث النظام. تم مسح السلة السابقة - يرجى إضافة الخدمات مرة أخرى.
              </p>
            </div>
          )}
        </div>

        {/* Organizational Notes */}
        <div className="mb-8 bg-blue-50 border-r-4 border-blue-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">ملاحظات تنظيمية</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="ml-3 text-blue-600 font-bold">•</span>
              <span>لا يتم إدراج تصديق الشهادات كخدمة أساسية إلا عند الطلب فقط</span>
            </li>
            <li className="flex items-start">
              <span className="ml-3 text-blue-600 font-bold">•</span>
              <span>لا تشمل الخدمات أي تعامل تعاقدي مباشر مع الجامعات</span>
            </li>
            <li className="flex items-start">
              <span className="ml-3 text-blue-600 font-bold">•</span>
              <span>جميع الخدمات تقدم من خلال شركة الروابي وبعقود وفواتير ضريبية</span>
            </li>
            <li className="flex items-start">
              <span className="ml-3 text-blue-600 font-bold">•</span>
              <span>الأسعار تحدد بشكل منفصل حسب الجامعة ونوع الكلية</span>
            </li>
          </ul>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {service.category}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {service.price} جنيه مصري
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {service.description}
                </p>
                
                <div className="flex items-center text-gray-500 mb-4">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{service.duration}</span>
                </div>

                <button
                  onClick={() => isInCart(service.id) ? removeFromCart(service.id) : addToCart(service.id)}
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isInCart(service.id)
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isInCart(service.id) ? 'إزالة من السلة' : 'إضافة إلى السلة'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="text-gray-600">
                عدد الخدمات المختارة: {cart.length}
              </div>
              <button
                onClick={handleContinueOrder}
                disabled={isLoading}
                className={`bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'جاري المعالجة...' : 'متابعة الطلب'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;