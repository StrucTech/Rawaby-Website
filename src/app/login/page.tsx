'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';

interface DecodedToken {
  userId: string;
  email: string;
  name: string;
  role: string;
}

interface UserResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  message: string;
  user: UserResponse;
  token: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') || '/';
  const errorFromUrl = searchParams?.get('error');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // عرض رسالة الخطأ من الـ URL إن وجدت
    if (errorFromUrl) {
      setError(decodeURIComponent(errorFromUrl));
    }
  }, [errorFromUrl]);

  useEffect(() => {
    // Check if user is already logged in
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded = jwt_decode<DecodedToken>(token);
        setUserName(decoded.name);
        setShowWelcome(true);
        // Redirect after showing welcome message
        const timer = setTimeout(() => {
          router.push(redirectTo);
        }, 2000);
        return () => clearTimeout(timer);
      } catch (error) {
        Cookies.remove('token');
      }
    }
  }, [redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json() as LoginResponse;

      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ في تسجيل الدخول');
      }

      // Store token in cookies
      Cookies.set('token', data.token, { expires: 7 }); // Expires in 7 days

      // Show welcome message with user's name from the response
      setUserName(data.user.name);
      setShowWelcome(true);

      // Determine the redirect path based on user role
      let finalRedirectTo = redirectTo;
      if (finalRedirectTo === '/') { // Only override if the default is home
        switch (data.user.role) {
          case 'admin':
            finalRedirectTo = '/admin';
            break;
          case 'supervisor':
            finalRedirectTo = '/supervisor/dashboard';
            break;
          case 'delegate':
            finalRedirectTo = '/delegate-tasks';
            break;
          default:
            finalRedirectTo = '/';
        }
      }

      // Redirect after showing welcome message
      setTimeout(() => {
        router.push(finalRedirectTo);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-bounce">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            مرحباً {userName}!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            تم تسجيل دخولك بنجاح
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            تسجيل الدخول
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            أو{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className={`rounded-md p-4 ${
              error.includes('تفعيل') ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50'
            }`}>
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  {error.includes('تفعيل') ? (
                    <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-medium ${
                    error.includes('تفعيل') ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    {error.includes('تفعيل') ? '⚠️ ' : '❌ '}
                    {error}
                  </h3>
                  {error.includes('تفعيل') && (
                    <p className="text-xs text-yellow-700 mt-2">
                      تحقق من بريدك الإلكتروني وانقر على رابط التفعيل المرسل إليك. إذا لم تستقبل الرسالة، تحقق من مجلد الرسائل غير المرغوبة.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="البريد الإلكتروني"
                dir="rtl"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="كلمة المرور"
                dir="rtl"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-4" dir="rtl">
            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">???? ???????...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}