'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';

interface UserPayload {
  userId: string;
  role: string;
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded = jwt_decode<UserPayload>(token);
        switch (decoded.role) {
          case 'admin':
            router.replace('/admin');
            break;
          case 'supervisor':
            router.replace('/supervisor/dashboard');
            break;
          case 'delegate':
            router.replace('/delegate-tasks');
            break;
          // For 'user' or other roles, do nothing and stay on the homepage.
          default:
            break;
        }
      } catch (error) {
        // Invalid token, do nothing
        console.error("Invalid token:", error);
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">خدمات تعليمية متميزة</span>
              <span className="block text-blue-600">للمصريين في المملكة العربية السعودية</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              نقدم مجموعة متكاملة من الخدمات التعليمية لمساعدة الطلاب المصريين في المملكة العربية السعودية على تحقيق أهدافهم الأكاديمية
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link href="/services" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                  تصفح الخدمات المتاحة
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
